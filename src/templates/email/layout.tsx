import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { Fragment } from "react";
import type { ReactNode } from "react";
import type { CompanyLegal } from "@/types/billing";
import type { TemplateLang, TemplateLocale } from "../shared/locale";
import { BRAND, EMAIL_FONTS } from "../shared/theme";
import { EMAIL_LOGO_PATH, paragraph, sides, small } from "./shared";

const CONTENT_WIDTH = 600;

export interface EmailAction {
  label: string;
  href: string;
}

/**
 * The frame every email shares: a dark header with the logo mark, a thin gold line, a light card
 * with the title, the content and one gold button, and a quiet footer.
 */
export function EmailLayout({
  locale,
  assetBaseUrl,
  legal,
  preview,
  title,
  greeting,
  action,
  footerNote,
  children,
}: {
  locale: TemplateLocale;
  assetBaseUrl: string;
  legal?: CompanyLegal | undefined;
  /** The line mail apps show next to the subject */
  preview: string;
  title: string;
  /** "Hello Noah," */
  greeting: string;
  action?: EmailAction | undefined;
  /** Replaces the standard "automated message" line in the footer */
  footerNote?: ReactNode;
  children: ReactNode;
}) {
  const { t, dir, lang } = locale;
  const fonts = EMAIL_FONTS[lang];
  const { start } = sides(dir);
  const ltr = dir === "rtl" ? ({ direction: "ltr", unicodeBidi: "embed" } as const) : {};

  return (
    <Html lang={lang} dir={dir}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{title}</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: BRAND.canvas,
          fontFamily: fonts.sans,
          color: BRAND.ink,
        }}
      >
        <Container style={{ maxWidth: CONTENT_WIDTH, width: "100%", margin: "0 auto" }} dir={dir}>
          <Section
            style={{
              backgroundColor: BRAND.ink,
              padding: "22px 32px",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Row dir={dir}>
              <Column style={{ width: 40, verticalAlign: "middle" }}>
                <Img
                  src={`${assetBaseUrl}${EMAIL_LOGO_PATH}`}
                  width={28}
                  height={42}
                  alt={locale.brand}
                  style={{ display: "block" }}
                />
              </Column>
              <Column style={{ verticalAlign: "middle", textAlign: start }}>
                <Text
                  style={{
                    margin: 0,
                    color: "#F8F9FA",
                    fontSize: 14,
                    lineHeight: "18px",
                    fontWeight: 300,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: '"Jost", "Helvetica Neue", Helvetica, Arial, sans-serif',
                    ...ltr,
                  }}
                >
                  {locale.brand}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    color: BRAND.gold,
                    fontSize: 10,
                    lineHeight: "14px",
                    letterSpacing: dir === "rtl" ? "normal" : "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  {locale.brandTagline}
                </Text>
              </Column>
            </Row>
          </Section>
          <Section
            style={{ height: 3, lineHeight: "3px", fontSize: 0, backgroundColor: BRAND.gold }}
          >
            &nbsp;
          </Section>

          <Section
            style={{
              backgroundColor: BRAND.paper,
              padding: "36px 32px 32px",
              textAlign: start,
              borderLeft: `1px solid ${BRAND.goldRule}`,
              borderRight: `1px solid ${BRAND.goldRule}`,
            }}
            dir={dir}
          >
            <Text
              style={{
                margin: "0 0 20px",
                fontFamily: fonts.serif,
                fontSize: 26,
                lineHeight: "32px",
                fontWeight: 600,
                color: BRAND.ink,
              }}
            >
              {title}
            </Text>
            <Text style={{ ...paragraph, margin: "0 0 14px" }}>{greeting}</Text>
            {children}
            {action && <ActionButton locale={locale} action={action} />}
          </Section>

          <Section
            style={{
              backgroundColor: BRAND.paper,
              padding: "0 32px 28px",
              textAlign: start,
              borderLeft: `1px solid ${BRAND.goldRule}`,
              borderRight: `1px solid ${BRAND.goldRule}`,
              borderBottom: `1px solid ${BRAND.goldRule}`,
              borderRadius: "0 0 8px 8px",
            }}
            dir={dir}
          >
            <Section style={{ borderTop: `1px solid ${BRAND.goldRule}`, paddingTop: 18 }}>
              {footerNote ?? (
                <Text style={small}>{t("email.common.automated", { brand: locale.brand })}</Text>
              )}
              {legal && <LegalLines locale={locale} legal={legal} />}
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function ActionButton({ locale, action }: { locale: TemplateLocale; action: EmailAction }) {
  return (
    <>
      <Section style={{ textAlign: "center", margin: "30px 0 22px" }}>
        <Button
          href={action.href}
          style={{
            backgroundColor: BRAND.gold,
            color: BRAND.ink,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: "20px",
            textDecoration: "none",
            padding: "14px 32px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          {action.label}
        </Button>
      </Section>
      <Text style={{ ...small, margin: "0 0 4px" }}>{locale.t("email.common.ctaFallback")}</Text>
      <Text
        style={{
          ...small,
          margin: 0,
          wordBreak: "break-all",
          direction: "ltr",
          textAlign: sides(locale.dir).start,
        }}
      >
        <Link href={action.href} style={{ color: BRAND.goldDeep }}>
          {action.href}
        </Link>
      </Text>
    </>
  );
}

function LegalLines({ locale, legal }: { locale: TemplateLocale; legal: CompanyLegal }) {
  const { t } = locale;
  const ids = [
    [t("billing:doc.legal.ice"), legal.ice],
    [t("billing:doc.legal.if"), legal.if],
    [t("billing:doc.legal.rc"), legal.rc],
    [t("billing:doc.legal.patente"), legal.patente],
  ].filter(([, value]) => value);
  return (
    <>
      <Text style={{ ...small, margin: "10px 0 0", color: BRAND.inkMuted }}>
        {legal.name || locale.brand}
        {legal.address ? ` · ${legal.address}` : ""}
      </Text>
      {ids.length > 0 && (
        <Text style={{ ...small, margin: "2px 0 0" }}>
          {ids.map(([label, value], index) => (
            <Fragment key={label}>
              {index > 0 ? " · " : null}
              <bdi>{`${label} ${value}`}</bdi>
            </Fragment>
          ))}
        </Text>
      )}
    </>
  );
}

/** A paragraph of body copy. */
export function EmailText({
  locale,
  children,
  muted = false,
}: {
  locale: TemplateLocale;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        ...(muted ? { ...paragraph, fontSize: 13, color: BRAND.inkMuted } : paragraph),
        textAlign: sides(locale.dir).start,
      }}
    >
      {children}
    </Text>
  );
}

/** A framed table of label and value pairs, such as an invoice's number, amount and due date. */
export function EmailDetails({
  locale,
  rows,
  title,
}: {
  locale: TemplateLocale;
  rows: { label: string; value: ReactNode; strong?: boolean; mono?: boolean }[];
  title?: string;
}) {
  const { start, end } = sides(locale.dir);
  return (
    <Section
      dir={locale.dir}
      style={{
        margin: "6px 0 18px",
        border: `1px solid ${BRAND.goldRule}`,
        borderRadius: 6,
        backgroundColor: BRAND.canvas,
        padding: "6px 16px",
      }}
    >
      {title && (
        <Text
          style={{
            margin: "8px 0 4px",
            fontSize: 12,
            fontWeight: 600,
            color: BRAND.goldDeep,
            textAlign: start,
            letterSpacing: locale.dir === "rtl" ? "normal" : "0.08em",
            textTransform: locale.dir === "rtl" ? "none" : "uppercase",
          }}
        >
          {title}
        </Text>
      )}
      {rows.map((row) => (
        <Row key={row.label} dir={locale.dir}>
          <Column
            style={{ width: "42%", padding: "7px 0", verticalAlign: "top", textAlign: start }}
          >
            <Text style={{ ...small, margin: 0 }}>{row.label}</Text>
          </Column>
          <Column style={{ padding: "7px 0", verticalAlign: "top", textAlign: end }}>
            <Text
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: row.strong ? 700 : 500,
                color: BRAND.ink,
                fontVariantNumeric: "tabular-nums",
                ...(row.mono
                  ? {
                      fontFamily: "SFMono-Regular, Consolas, Menlo, monospace",
                      direction: "ltr" as const,
                    }
                  : {}),
              }}
            >
              {row.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

/** A highlighted note, such as what happens if an invoice stays unpaid. */
export function EmailCallout({
  locale,
  tone = "gold",
  children,
}: {
  locale: TemplateLocale;
  tone?: "gold" | "ruby";
  children: ReactNode;
}) {
  const accent = tone === "ruby" ? BRAND.ruby : BRAND.gold;
  const { start } = sides(locale.dir);
  return (
    <Section
      dir={locale.dir}
      style={{
        margin: "6px 0 18px",
        padding: "12px 16px",
        backgroundColor: BRAND.canvas,
        [start === "left" ? "borderLeft" : "borderRight"]: `3px solid ${accent}`,
        textAlign: start,
      }}
    >
      <Text style={{ ...paragraph, margin: 0, fontSize: 14, lineHeight: "22px" }}>{children}</Text>
    </Section>
  );
}
