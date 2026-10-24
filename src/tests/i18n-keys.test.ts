import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resources } from "@/lib/i18n";

/**
 * Fails when a screen asks for a translation key that a locale file does not define, which would
 * show the raw key (for example "leaseForm.contractNone") instead of text. Only literal keys can be
 * checked: keys built at runtime (template strings with ${...}) are checked by prefix.
 */

type Json = { [key: string]: Json | string };
const LANGS = ["en", "fr", "ar"] as const;
const SRC = path.resolve(__dirname, "..");
const DEFAULT_NS = "common";
const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"];

function flatten(node: Json, prefix = "", out = new Set<string>()): Set<string> {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.add(full);
    else flatten(value, full, out);
  }
  return out;
}

const keys: Record<string, Record<string, Set<string>>> = {};
for (const lang of LANGS) {
  const byNamespace: Record<string, Set<string>> = {};
  for (const [ns, content] of Object.entries(resources[lang])) {
    byNamespace[ns] = flatten(content as unknown as Json);
  }
  keys[lang] = byNamespace;
}
const NAMESPACES = Object.keys(keys["en"] ?? {});

function hasKey(lang: string, ns: string, key: string): boolean {
  const set = keys[lang]?.[ns];
  if (!set) return false;
  return set.has(key) || PLURAL_SUFFIXES.some((suffix) => set.has(key + suffix));
}

function hasPrefix(lang: string, ns: string, prefix: string): boolean {
  const set = keys[lang]?.[ns];
  if (!set) return false;
  for (const key of set) if (key.startsWith(prefix)) return true;
  return false;
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (["locales", "tests", "node_modules"].includes(name)) continue;
      sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.(test|gen)\./.test(name)) out.push(full);
  }
  return out;
}

interface Used {
  file: string;
  line: number;
  ns: string;
  key: string;
  dynamic: boolean;
}

function parseNamespaces(arg: string): string[] {
  const names = [...arg.matchAll(/["']([\w-]+)["']/g)].map((m) => m[1] ?? "");
  return names.length ? names : [DEFAULT_NS];
}

function scan(file: string): Used[] {
  const text = readFileSync(file, "utf8");
  const lineOf = (index: number) => text.slice(0, index).split("\n").length;
  const used: Used[] = [];

  // `const { t } = useTranslation("ns")` / `const { t: tc } = useTranslation(["ns", "other"])`:
  // the alias means that namespace from there until the alias is declared again.
  const decls: { index: number; alias: string; ns: string }[] = [];
  for (const m of text.matchAll(
    /const\s*\{\s*t(?:\s*:\s*(\w+))?\s*(?:,[^}]*)?\}\s*=\s*useTranslation\(([^)]*)\)/g,
  )) {
    decls.push({ index: m.index ?? 0, alias: m[1] ?? "t", ns: parseNamespaces(m[2] ?? "")[0] ?? DEFAULT_NS });
  }
  const aliases = new Set(decls.map((d) => d.alias));

  const record = (index: number, alias: string, key: string, dynamic: boolean) => {
    // Only a namespace prefix is literal (`common:${key}`): nothing to check
    if (/^[\w-]+:$/.test(key)) return;
    let ns = DEFAULT_NS;
    const prefixed = key.match(/^([\w-]+):(.+)$/);
    if (prefixed?.[1] && prefixed[2] && NAMESPACES.includes(prefixed[1])) {
      ns = prefixed[1];
      key = prefixed[2];
    } else {
      const decl = [...decls].reverse().find((d) => d.alias === alias && d.index < index);
      if (!decl) return; // `t` handed in as a parameter: the namespace is not known here
      ns = decl.ns;
    }
    used.push({ file: path.relative(SRC, file), line: lineOf(index), ns, key, dynamic });
  };

  for (const alias of aliases) {
    const call = new RegExp(
      `(?<![\\w.])${alias}\\(\\s*(?:"([^"\\n]+)"|'([^'\\n]+)'|\`([^\`\\n]+)\`)`,
      "g",
    );
    for (const m of text.matchAll(call)) {
      const literal = m[1] ?? m[2];
      const template = m[3];
      if (literal !== undefined) record(m.index ?? 0, alias, literal, false);
      else if (template !== undefined) {
        if (template.includes("${")) {
          const prefix = template.slice(0, template.indexOf("${"));
          if (prefix) record(m.index ?? 0, alias, prefix, true);
        } else record(m.index ?? 0, alias, template, false);
      }
    }
  }

  // <Trans i18nKey="ns:key" /> or <Trans i18nKey="key" ns="x" />
  for (const m of text.matchAll(/i18nKey=["']([^"']+)["']/g)) {
    const key = m[1] ?? "";
    if (/^[\w-]+:/.test(key)) record(m.index ?? 0, "", key, false);
  }
  return used;
}

const allUsed = sourceFiles(SRC).flatMap(scan);

describe("i18n keys", () => {
  it("has the same namespaces in every language", () => {
    for (const lang of LANGS)
      expect(Object.keys(keys[lang] ?? {}).sort()).toEqual([...NAMESPACES].sort());
  });

  it("finds literal keys to check", () => {
    expect(allUsed.length).toBeGreaterThan(500);
  });

  for (const lang of LANGS) {
    it(`defines every key used in code (${lang})`, () => {
      const missing = allUsed
        .filter((u) => (u.dynamic ? !hasPrefix(lang, u.ns, u.key) : !hasKey(lang, u.ns, u.key)))
        .map((u) => `${u.file}:${u.line} ${u.ns}:${u.key}${u.dynamic ? "*" : ""}`);
      expect(missing).toEqual([]);
    });
  }

  for (const lang of LANGS.filter((l) => l !== "en")) {
    it(`has no key missing from ${lang} that English has`, () => {
      const missing: string[] = [];
      for (const ns of NAMESPACES) {
        for (const key of keys["en"]?.[ns] ?? []) {
          if (!keys[lang]?.[ns]?.has(key)) missing.push(`${ns}:${key}`);
        }
      }
      expect(missing).toEqual([]);
    });
  }
});
