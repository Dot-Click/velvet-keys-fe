import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { IssuerHeader } from "@/components/conciergerie/rent-invoice-document";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIssuerProfile, usePanelMutation } from "@/hooks/use-portfolio-data";
import {
  ICE_DIGITS,
  RIB_DIGITS,
  digitsOnly,
  formatRib,
  isValidIce,
  isValidRib,
} from "@/lib/issuer";
import { issuerProfileService } from "@/services/ltr-service";
import type { IssuerProfile, IssuerProfileInput } from "@/types/ltr";

export const Route = createFileRoute("/conciergerie/settings/issuer")({
  component: IssuerSettingsPage,
});

function IssuerSettingsPage() {
  const query = useIssuerProfile();
  return (
    <QueryView query={query} skeleton="split">
      {(profile) => <IssuerSettings profile={profile} />}
    </QueryView>
  );
}

interface FormState {
  name: string;
  address: string;
  ice: string;
  rib: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function toForm(profile: IssuerProfile): FormState {
  return {
    name: profile.name ?? "",
    address: profile.address ?? "",
    ice: profile.ice ?? "",
    rib: profile.rib ?? "",
  };
}

function IssuerSettings({ profile }: { profile: IssuerProfile }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [saved, setSaved] = React.useState(() => toForm(profile));
  const [form, setForm] = React.useState(saved);
  const [errors, setErrors] = React.useState<Errors>({});
  const save = usePanelMutation((input: IssuerProfileInput) => issuerProfileService.save(input));
  const dirty = (Object.keys(form) as (keyof FormState)[]).some(
    (field) => form[field].trim() !== saved[field].trim(),
  );

  const set = (field: keyof FormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = t("forms.errors.nameRequired");
    if (!form.address.trim()) next.address = t("forms.errors.addressRequired");
    if (!isValidRib(form.rib)) next.rib = t("issuer.errors.rib", { count: RIB_DIGITS });
    if (form.ice.trim() && !isValidIce(form.ice))
      next.ice = t("issuer.errors.ice", { count: ICE_DIGITS });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input: IssuerProfileInput = {
      name: form.name.trim(),
      address: form.address.trim(),
      rib: formatRib(form.rib),
      ...(form.ice.trim() ? { ice: digitsOnly(form.ice) } : {}),
    };
    save.mutate(input, {
      onSuccess: (result) => {
        const next = toForm(result);
        setSaved(next);
        setForm(next);
        toast.success(t("issuer.saved"));
      },
      onError: () => toast.error(t("common:states.errorBody")),
    });
  }

  const preview = {
    name: form.name.trim() || null,
    address: form.address.trim() || null,
    rib: form.rib.trim() || null,
    ice: form.ice.trim() || null,
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-[1720px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="ps-0 text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
      >
        <Link to="/conciergerie/rent-invoices">
          <ArrowLeft className="me-2 size-4 rtl-flip" />
          {t("issuer.back")}
        </Link>
      </Button>

      <div className="space-y-1 border-b border-border/80 pb-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#A2E8DD]" />
          <p className="text-label-caps text-[#A2E8DD]">{t("issuer.badge")}</p>
        </div>
        <h1 className="font-display text-3xl uppercase tracking-[0.1em] text-[#F8F9FA] sm:text-4xl">
          {t("issuer.title")}
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {t("issuer.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <form
          onSubmit={submit}
          noValidate
          className="space-y-5 rounded-2xl border border-primary/20 bg-[#141414] p-5 sm:p-6 lg:col-span-6"
        >
          <DrawerField
            id="issuer-name"
            label={t("issuer.name")}
            error={errors.name}
            hint={t("issuer.nameHint")}
          >
            <Input
              id="issuer-name"
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField id="issuer-address" label={t("issuer.address")} error={errors.address}>
            <Textarea
              id="issuer-address"
              value={form.address}
              onChange={(event) => set("address")(event.target.value)}
              rows={3}
              placeholder={t("issuer.addressPlaceholder")}
              aria-invalid={Boolean(errors.address)}
              className="border-border/80 bg-[#161616] text-xs aria-[invalid=true]:border-destructive"
            />
          </DrawerField>
          <DrawerField
            id="issuer-ice"
            label={t("issuer.ice")}
            error={errors.ice}
            hint={t("issuer.iceHint", { count: ICE_DIGITS })}
          >
            <Input
              id="issuer-ice"
              inputMode="numeric"
              dir="ltr"
              value={form.ice}
              onChange={(event) => set("ice")(event.target.value)}
              placeholder="002345678000091"
              aria-invalid={Boolean(errors.ice)}
              className={`${drawerInputClassName} font-mono`}
            />
          </DrawerField>
          <DrawerField
            id="issuer-rib"
            label={t("issuer.rib")}
            error={errors.rib}
            hint={t("issuer.ribHint", { count: RIB_DIGITS })}
          >
            <Input
              id="issuer-rib"
              inputMode="numeric"
              dir="ltr"
              value={form.rib}
              onChange={(event) => set("rib")(event.target.value)}
              placeholder="011 780 0000123456789012 34"
              aria-invalid={Boolean(errors.rib)}
              className={`${drawerInputClassName} font-mono`}
            />
          </DrawerField>

          <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-[#161616] p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {t("issuer.appliesNote")}
          </p>

          <div className="flex flex-col-reverse gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || save.isPending}
              onClick={() => {
                setForm(saved);
                setErrors({});
              }}
              className="text-xs"
            >
              {t("issuer.reset")}
            </Button>
            <ReadOnlyGuard className="flex">
              <Button
                type="submit"
                disabled={!dirty || save.isPending}
                className="btn-shimmer w-full bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground sm:w-auto"
              >
                {save.isPending ? t("forms.saving") : t("forms.saveChanges")}
              </Button>
            </ReadOnlyGuard>
          </div>
        </form>

        <aside
          className="space-y-3 lg:sticky lg:top-24 lg:col-span-6"
          aria-label={t("issuer.previewLabel")}
        >
          <p className="text-label-caps text-primary">{t("issuer.previewLabel")}</p>
          <div className="space-y-6 rounded-lg bg-[#F8F9FA] p-6 text-[#0B0B0B] shadow-2xl sm:p-8">
            <div className="flex flex-col gap-6 border-b-2 border-[#D4AF37] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <IssuerHeader issuer={preview} />
              <div className="shrink-0 space-y-1 sm:text-end">
                <p className="text-label-caps text-[#8C6B14]">{t("invoiceDoc.title")}</p>
                <p className="font-mono text-sm font-semibold">R-000000-001</p>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 p-4 text-xs">
              <p className="font-semibold">{t("invoiceDoc.payBy")}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-[#0B0B0B]/60">{t("invoiceDoc.beneficiary")}</dt>
                <dd className={preview.name ? "" : "text-[#0B0B0B]/30"}>
                  {preview.name || t("issuer.namePlaceholder")}
                </dd>
                <dt className="text-[#0B0B0B]/60">{t("invoiceDoc.rib")}</dt>
                <dd className={preview.rib ? "font-mono" : "font-mono text-[#0B0B0B]/30"} dir="ltr">
                  {preview.rib ? formatRib(preview.rib) : "000 000 0000000000000000 00"}
                </dd>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
