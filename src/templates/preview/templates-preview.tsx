import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, Printer } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { renderEmailHtml, renderEmailText } from "../email/render";
import { PdfPreview } from "../pdf/pdf-preview";
import { EMAIL_TEMPLATES, PDF_TEMPLATES } from "../registry";
import type { EmailTemplateEntry, PdfTemplateEntry } from "../registry";
import { loadTemplateSamples } from "../samples";
import type { TemplateLang } from "../shared/locale";

type LangMode = TemplateLang | "all";
type EmailView = "preview" | "html" | "text";

const LANG_OPTIONS: { id: LangMode; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "fr", label: "FR" },
  { id: "ar", label: "AR" },
  { id: "all", label: "All" },
];

const LANG_NAMES: Record<TemplateLang, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

const ALL_LANGS: TemplateLang[] = ["en", "fr", "ar"];

/** Printing shows only the PDF copy that sits outside the page. */
const PRINT_CSS = `@media print { body > *:not([data-template-print]) { display: none !important; } body { background: #ffffff !important; } }`;

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-md border border-border/80 bg-[#121212] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            option.id === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Dev-only preview of every PDF and email template in every language, with the sample data the
 * app's mocks provide. PDFs show at true A4 proportions and print; emails show as they render.
 */
export default function TemplatesPreview() {
  const all = [...PDF_TEMPLATES, ...EMAIL_TEMPLATES];
  const [templateId, setTemplateId] = React.useState(all[0]?.id ?? "");
  const [variants, setVariants] = React.useState<Record<string, string>>({});
  const [langMode, setLangMode] = React.useState<LangMode>("en");
  const [emailView, setEmailView] = React.useState<EmailView>("preview");

  const entry = all.find((item) => item.id === templateId) ?? all[0];
  if (!entry) return null;
  const variant = variants[entry.id] ?? entry.variants[0]?.id ?? "default";
  const langs = langMode === "all" ? ALL_LANGS : [langMode];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 px-4 py-5 sm:px-8">
        <p className="text-label-caps text-primary">Dev only</p>
        <h1 className="font-display text-2xl uppercase tracking-[0.1em]">
          Document and email templates
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Every template in English, French and Arabic, built from the app&apos;s sample data. PDFs
          are A4; emails render with react-email.
        </p>
      </header>

      <div className="grid gap-0 lg:grid-cols-[16rem_1fr]">
        <nav
          aria-label="Templates"
          className="space-y-5 border-b border-border/70 px-4 py-5 lg:border-b-0 lg:border-e lg:px-5"
        >
          <TemplateGroup
            title="PDF"
            icon={<FileText className="size-3.5" aria-hidden="true" />}
            entries={PDF_TEMPLATES}
            selected={entry.id}
            onSelect={setTemplateId}
          />
          <TemplateGroup
            title="Email"
            icon={<Mail className="size-3.5" aria-hidden="true" />}
            entries={EMAIL_TEMPLATES}
            selected={entry.id}
            onSelect={setTemplateId}
          />
        </nav>

        <main className="min-w-0 space-y-5 px-4 py-5 sm:px-8">
          <div>
            <h2 className="font-display text-xl uppercase tracking-[0.08em]">{entry.label}</h2>
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {entry.variants.length > 1 && (
              <Segmented
                label="Variant"
                value={variant}
                onChange={(next) => setVariants((current) => ({ ...current, [entry.id]: next }))}
                options={entry.variants}
              />
            )}
            <Segmented
              label="Language"
              value={langMode}
              onChange={setLangMode}
              options={LANG_OPTIONS}
            />
            {entry.kind === "email" && langMode !== "all" && (
              <Segmented
                label="View"
                value={emailView}
                onChange={setEmailView}
                options={[
                  { id: "preview", label: "Preview" },
                  { id: "html", label: "HTML" },
                  { id: "text", label: "Plain text" },
                ]}
              />
            )}
            {entry.kind === "pdf" && <PrintButton />}
          </div>

          {entry.kind === "pdf" ? (
            <PdfPane entry={entry} variant={variant} langs={langs} />
          ) : (
            <div className={cn("grid gap-6", langMode === "all" && "xl:grid-cols-3")}>
              {langs.map((lang) => (
                <EmailPane
                  key={lang}
                  entry={entry}
                  variant={variant}
                  lang={lang}
                  view={langMode === "all" ? "preview" : emailView}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TemplateGroup({
  title,
  icon,
  entries,
  selected,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  entries: (PdfTemplateEntry | EmailTemplateEntry)[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {title}
      </p>
      <ul className="space-y-0.5">
        {entries.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={item.id === selected ? "true" : undefined}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full rounded-md px-2.5 py-1.5 text-start text-[13px] transition-colors",
                item.id === selected
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-[#161616] hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="h-8 text-xs"
    >
      <Printer className="size-3.5" aria-hidden="true" />
      Print / save as PDF
    </Button>
  );
}

function PdfPane({
  entry,
  variant,
  langs,
}: {
  entry: PdfTemplateEntry;
  variant: string;
  langs: TemplateLang[];
}) {
  const samples = useQuery({
    queryKey: ["template-samples"],
    queryFn: loadTemplateSamples,
    staleTime: Infinity,
  });

  if (samples.isError) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
      >
        The sample data could not be loaded.{" "}
        <button type="button" className="underline" onClick={() => void samples.refetch()}>
          Try again
        </button>
      </p>
    );
  }
  if (!samples.data) {
    return <p className="text-sm text-muted-foreground">Loading sample data…</p>;
  }
  const data = samples.data;

  return (
    <>
      <div className={cn("grid gap-6", langs.length > 1 && "xl:grid-cols-3")}>
        {langs.map((lang) => (
          <section key={lang} aria-label={LANG_NAMES[lang]} className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{LANG_NAMES[lang]}</p>
            <PdfPreview>{entry.render(lang, variant, data)}</PdfPreview>
          </section>
        ))}
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <div data-template-print="" className="hidden print:block">
            <style>{PRINT_CSS}</style>
            {langs.map((lang) => (
              <React.Fragment key={lang}>{entry.render(lang, variant, data)}</React.Fragment>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function EmailPane({
  entry,
  variant,
  lang,
  view,
}: {
  entry: EmailTemplateEntry;
  variant: string;
  lang: TemplateLang;
  view: EmailView;
}) {
  const base = window.location.origin;
  const rendered = useQuery({
    queryKey: ["template-email", entry.id, variant, lang, base],
    queryFn: async () => {
      const element = entry.render(lang, variant, base);
      const [html, text] = await Promise.all([
        renderEmailHtml(element, { pretty: true }),
        renderEmailText(element),
      ]);
      return { html, text, subject: entry.subject(lang, variant, base) };
    },
    staleTime: Infinity,
  });

  return (
    <section aria-label={LANG_NAMES[lang]} className="min-w-0 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{LANG_NAMES[lang]}</p>
      {rendered.isError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          This email could not be rendered.
        </p>
      )}
      {rendered.data && (
        <>
          <p
            dir="auto"
            className="rounded-md border border-border/70 bg-[#121212] px-3 py-2 text-[13px]"
          >
            <span className="text-muted-foreground">Subject: </span>
            {rendered.data.subject}
          </p>
          {view === "preview" ? (
            <EmailFrame html={rendered.data.html} title={`${entry.label} (${LANG_NAMES[lang]})`} />
          ) : (
            <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/70 bg-[#0F0F0F] p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {view === "html" ? rendered.data.html : rendered.data.text}
            </pre>
          )}
        </>
      )}
    </section>
  );
}

/** An email in its own document, sized to its content, so its styles never touch the page. */
function EmailFrame({ html, title }: { html: string; title: string }) {
  const [height, setHeight] = React.useState(640);
  const frame = React.useRef<HTMLIFrameElement>(null);

  const fit = React.useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (doc) setHeight(doc.documentElement.scrollHeight);
  }, []);

  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={html}
      onLoad={fit}
      style={{ height }}
      className="w-full rounded-lg border border-border/70 bg-[#F8F9FA]"
    />
  );
}
