import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { bookingErrorKey } from "@/lib/booking-errors";
import { bookingsService } from "@/services/str-service";
import type { Guest, GuestIdDetailsInput, GuestIdType, PurposeOfVisit } from "@/types/str";

const ID_TYPES: GuestIdType[] = ["passport", "cin"];
const PURPOSES: PurposeOfVisit[] = ["tourism", "business", "family", "official_mission", "other"];
const EMPTY = "__none__";

function toInput(guest: Guest): GuestIdDetailsInput {
  return {
    ...(guest.nationality ? { nationality: guest.nationality } : {}),
    ...(guest.idType ? { idType: guest.idType } : {}),
    ...(guest.idNumber ? { idNumber: guest.idNumber } : {}),
    ...(guest.dateOfBirth ? { dateOfBirth: guest.dateOfBirth } : {}),
    ...(guest.placeOfBirth ? { placeOfBirth: guest.placeOfBirth } : {}),
    ...(guest.residenceAddress ? { residenceAddress: guest.residenceAddress } : {}),
    ...(guest.maidenName ? { maidenName: guest.maidenName } : {}),
    ...(guest.countryOfResidence ? { countryOfResidence: guest.countryOfResidence } : {}),
    ...(guest.occupation ? { occupation: guest.occupation } : {}),
    ...(guest.documentPlaceOfIssue ? { documentPlaceOfIssue: guest.documentPlaceOfIssue } : {}),
    ...(guest.documentDateOfIssue ? { documentDateOfIssue: guest.documentDateOfIssue } : {}),
    ...(guest.arrivingFrom ? { arrivingFrom: guest.arrivingFrom } : {}),
    ...(guest.nextDestination ? { nextDestination: guest.nextDestination } : {}),
    ...(guest.purposeOfVisit ? { purposeOfVisit: guest.purposeOfVisit } : {}),
    ...(guest.accompanyingMinors ? { accompanyingMinors: guest.accompanyingMinors } : {}),
  };
}

/**
 * Police Declaration Form (fiche de police) section: every field the client's exact template
 * asks for, editable any time -- not gated by check-in, since a manager may check a guest in
 * before their papers are on hand -- plus the "Generate Police Declaration" action itself.
 * Conciergerie-only: this whole drawer only renders on Conciergerie routes (per the client's
 * "delivered by concierge" instruction), gated the same way as check-in/check-out.
 */
export function GuestPoliceDetailsSection({
  bookingId,
  guest,
  canWrite,
}: {
  bookingId: string;
  guest: Guest;
  canWrite: boolean;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [form, setForm] = useState<GuestIdDetailsInput>(() => toInput(guest));
  const [downloading, setDownloading] = useState(false);

  const save = usePanelMutation((input: GuestIdDetailsInput) =>
    bookingsService.updateGuestDetails(bookingId, input),
  );

  function set<K extends keyof GuestIdDetailsInput>(key: K, value: GuestIdDetailsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function submit() {
    save.mutate(form, {
      onSuccess: () => toast.success(t("bookingDrawer.policeDeclaration.saved")),
      onError: (error) => toast.error(t(bookingErrorKey(error))),
    });
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await bookingsService.policeDeclarationPdf(bookingId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `police-declaration-${bookingId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("common:states.errorBody"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      aria-label={t("bookingDrawer.policeDeclaration.title")}
      className="space-y-4 rounded-xl border border-border/70 bg-[#161616] p-4"
    >
      <div>
        <h4 className="text-label-caps text-muted-foreground">
          {t("bookingDrawer.policeDeclaration.title")}
        </h4>
        <p className="mt-1 text-[0.7rem] text-muted-foreground">
          {t("bookingDrawer.policeDeclaration.hint")}
        </p>
      </div>

      {canWrite ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DrawerField id="guest-nationality" label={t("bookingDrawer.policeDeclaration.nationality")}>
            <Input
              id="guest-nationality"
              value={form.nationality ?? ""}
              onChange={(event) => set("nationality", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField
            id="guest-country-of-residence"
            label={t("bookingDrawer.policeDeclaration.countryOfResidence")}
          >
            <Input
              id="guest-country-of-residence"
              value={form.countryOfResidence ?? ""}
              onChange={(event) => set("countryOfResidence", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField id="guest-id-type" label={t("bookingDrawer.policeDeclaration.idType")}>
            <Select
              value={form.idType ?? EMPTY}
              onValueChange={(value) =>
                set("idType", value === EMPTY ? undefined : (value as GuestIdType))
              }
            >
              <SelectTrigger id="guest-id-type" className={drawerInputClassName}>
                <SelectValue placeholder={t("bookingDrawer.policeDeclaration.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="border-border bg-[#141414]">
                <SelectItem value={EMPTY} className="py-2 text-xs">
                  {t("bookingDrawer.policeDeclaration.selectPlaceholder")}
                </SelectItem>
                {ID_TYPES.map((value) => (
                  <SelectItem key={value} value={value} className="py-2 text-xs">
                    {t(`bookingDrawer.policeDeclaration.idTypeName.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerField>
          <DrawerField id="guest-id-number" label={t("bookingDrawer.policeDeclaration.idNumber")}>
            <Input
              id="guest-id-number"
              value={form.idNumber ?? ""}
              onChange={(event) => set("idNumber", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField
            id="guest-document-place-of-issue"
            label={t("bookingDrawer.policeDeclaration.documentPlaceOfIssue")}
          >
            <Input
              id="guest-document-place-of-issue"
              value={form.documentPlaceOfIssue ?? ""}
              onChange={(event) => set("documentPlaceOfIssue", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField
            id="guest-document-date-of-issue"
            label={t("bookingDrawer.policeDeclaration.documentDateOfIssue")}
          >
            <Input
              id="guest-document-date-of-issue"
              type="date"
              value={form.documentDateOfIssue ?? ""}
              onChange={(event) => set("documentDateOfIssue", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField
            id="guest-date-of-birth"
            label={t("bookingDrawer.policeDeclaration.dateOfBirth")}
          >
            <Input
              id="guest-date-of-birth"
              type="date"
              value={form.dateOfBirth ?? ""}
              onChange={(event) => set("dateOfBirth", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField
            id="guest-place-of-birth"
            label={t("bookingDrawer.policeDeclaration.placeOfBirth")}
          >
            <Input
              id="guest-place-of-birth"
              value={form.placeOfBirth ?? ""}
              onChange={(event) => set("placeOfBirth", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField id="guest-maiden-name" label={t("bookingDrawer.policeDeclaration.maidenName")}>
            <Input
              id="guest-maiden-name"
              value={form.maidenName ?? ""}
              onChange={(event) => set("maidenName", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField id="guest-occupation" label={t("bookingDrawer.policeDeclaration.occupation")}>
            <Input
              id="guest-occupation"
              value={form.occupation ?? ""}
              onChange={(event) => set("occupation", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField id="guest-arriving-from" label={t("bookingDrawer.policeDeclaration.arrivingFrom")}>
            <Input
              id="guest-arriving-from"
              value={form.arrivingFrom ?? ""}
              onChange={(event) => set("arrivingFrom", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DrawerField
            id="guest-next-destination"
            label={t("bookingDrawer.policeDeclaration.nextDestination")}
          >
            <Input
              id="guest-next-destination"
              value={form.nextDestination ?? ""}
              onChange={(event) => set("nextDestination", event.target.value)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField
            id="guest-purpose-of-visit"
            label={t("bookingDrawer.policeDeclaration.purposeOfVisit")}
          >
            <Select
              value={form.purposeOfVisit ?? EMPTY}
              onValueChange={(value) =>
                set("purposeOfVisit", value === EMPTY ? undefined : (value as PurposeOfVisit))
              }
            >
              <SelectTrigger id="guest-purpose-of-visit" className={drawerInputClassName}>
                <SelectValue placeholder={t("bookingDrawer.policeDeclaration.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="border-border bg-[#141414]">
                <SelectItem value={EMPTY} className="py-2 text-xs">
                  {t("bookingDrawer.policeDeclaration.selectPlaceholder")}
                </SelectItem>
                {PURPOSES.map((value) => (
                  <SelectItem key={value} value={value} className="py-2 text-xs">
                    {t(`bookingDrawer.policeDeclaration.purposeName.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerField>

          <div className="sm:col-span-2">
            <DrawerField
              id="guest-residence-address"
              label={t("bookingDrawer.policeDeclaration.residenceAddress")}
            >
              <Input
                id="guest-residence-address"
                value={form.residenceAddress ?? ""}
                onChange={(event) => set("residenceAddress", event.target.value)}
                className={drawerInputClassName}
              />
            </DrawerField>
          </div>

          <div className="sm:col-span-2">
            <DrawerField
              id="guest-accompanying-minors"
              label={t("bookingDrawer.policeDeclaration.accompanyingMinors")}
              hint={t("bookingDrawer.policeDeclaration.accompanyingMinorsHint")}
            >
              <Textarea
                id="guest-accompanying-minors"
                value={form.accompanyingMinors ?? ""}
                onChange={(event) => set("accompanyingMinors", event.target.value)}
                rows={2}
                className="border-border/80 bg-[#121212] text-xs"
              />
            </DrawerField>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
        {canWrite && (
          <ReadOnlyGuard>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={save.isPending}
              onClick={submit}
              className="h-9"
            >
              {save.isPending ? t("forms.saving") : t("bookingDrawer.policeDeclaration.saveDetails")}
            </Button>
          </ReadOnlyGuard>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={downloading}
          onClick={() => void downloadPdf()}
          className="h-9 border-primary/50 text-primary"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-3.5" aria-hidden="true" />
          )}
          {t("bookingDrawer.policeDeclaration.generate")}
        </Button>
      </div>
    </section>
  );
}
