import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { ArrowLeft, Archive, BedDouble, Banknote, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { SwitchUnitTypeButton } from "@/components/conciergerie/switch-unit-type";
import { UnitArchivedBadge, UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { UnitFormDrawer } from "@/components/conciergerie/unit-form-drawer";
import { MediaImage } from "@/components/media/media-image";
import { PanelEmptyState, QueryView } from "@/components/panel-states";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePanelMutation, usePortfolioProperty } from "@/hooks/use-portfolio-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { hasErrorCode } from "@/lib/apiClient";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { portfolioErrorKey } from "@/lib/portfolio-errors";
import { unitsService } from "@/services/portfolio-service";
import type { PropertyDetail, Unit } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/properties/$propertyId/units/$unitId")({
  component: UnitDetailPage,
});

function UnitDetailPage() {
  const { propertyId, unitId } = Route.useParams();
  const { t } = useTranslation("conciergerie");
  const navigate = useNavigate();
  // A unit is read through its property, which lists all of its units
  const query = usePortfolioProperty(propertyId);
  const notFound = () => (
    <PanelEmptyState
      illustrationName="empty-properties"
      title={t("units.notFoundTitle")}
      description={t("units.notFoundBody")}
      action={t("properties.backToProperties")}
      onAction={() => void navigate({ to: "/conciergerie/properties" })}
    />
  );

  if (hasErrorCode(query.error, "PROPERTY_NOT_FOUND", "NOT_FOUND")) return notFound();

  return (
    <QueryView query={query} skeleton="split">
      {(property) => {
        const unit = property.units.find((row) => row.id === unitId);
        return unit ? <UnitDetail property={property} unit={unit} /> : notFound();
      }}
    </QueryView>
  );
}

function UnitDetail({ property, unit }: { property: PropertyDetail; unit: Unit }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const archive = usePanelMutation((id: string) => unitsService.remove(id));
  const archived = unit.archivedAt !== null;

  function confirmArchive() {
    archive.mutate(unit.id, {
      onSuccess: () => {
        setArchiveOpen(false);
        toast.success(t("units.archivedToast", { name: unit.name }));
        void navigate({
          to: "/conciergerie/properties/$propertyId",
          params: { propertyId: property.id },
        });
      },
      onError: (error) => {
        setArchiveOpen(false);
        const key = portfolioErrorKey(error);
        toast.error(key ? t(key) : t("units.archiveFailed"));
      },
    });
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-8">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary ps-0"
      >
        <Link to="/conciergerie/properties/$propertyId" params={{ propertyId: property.id }}>
          <ArrowLeft className="size-4 me-2 rtl-flip" />
          <span>{property.name}</span>
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="relative h-64 overflow-hidden rounded-2xl border border-primary/30 shadow-2xl sm:h-80 xl:col-span-7">
          <MediaImage
            kind="unit"
            id={unit.id}
            fileId={unit.imageFileId}
            name={unit.name}
            variant="card"
            loading="eager"
            className="size-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
          <div className="absolute bottom-6 inset-x-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <UnitTypeBadge type={unit.type} />
              {archived && <UnitArchivedBadge />}
            </div>
            <h1 className="font-serif text-3xl tracking-wide text-[#F8F9FA] sm:text-4xl">
              {unit.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {property.name} · {property.city}
            </p>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <section className="space-y-5 rounded-2xl border border-primary/20 bg-[#141414] p-6 shadow-xl">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <dt className="text-label-caps text-muted-foreground">{t("units.colBedrooms")}</dt>
                <dd className="flex items-center gap-1.5 font-mono text-foreground">
                  <BedDouble className="size-4 text-primary" />
                  {unit.bedrooms}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-label-caps text-muted-foreground">{t("units.colType")}</dt>
                <dd className="text-foreground">{t(`units.typeName.${unit.type}`)}</dd>
              </div>
              {unit.type === "STR" && (
                <div className="col-span-2 space-y-1">
                  <dt className="text-label-caps text-muted-foreground">
                    {t("units.colNightlyRate")}
                  </dt>
                  <dd dir="ltr" className="flex items-center gap-1.5 font-mono text-foreground">
                    <Banknote className="size-4 text-primary" />
                    {unit.nightlyRateMinor === null
                      ? t("units.noRate")
                      : formatMoney(unit.nightlyRateMinor, ACCOUNT_CURRENCY)}
                  </dd>
                </div>
              )}
              {archived && unit.archivedAt && (
                <div className="col-span-2 space-y-1">
                  <dt className="text-label-caps text-muted-foreground">
                    {t("units.colArchivedOn")}
                  </dt>
                  <dd className="text-foreground">{formatDate(unit.archivedAt)}</dd>
                </div>
              )}
            </dl>
            {archived ? (
              <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
                {t("units.archivedNote")}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                <ReadOnlyGuard>
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(true)}
                    className="border-primary/40 text-xs uppercase tracking-wider text-primary hover:bg-primary/10"
                  >
                    <Pencil className="size-4 me-1.5" />
                    {t("units.editUnit")}
                  </Button>
                </ReadOnlyGuard>
                <SwitchUnitTypeButton unit={unit} size="default" />
                <ReadOnlyGuard>
                  <Button
                    variant="ghost"
                    onClick={() => setArchiveOpen(true)}
                    className="text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive-foreground"
                  >
                    <Archive className="size-4 me-1.5" />
                    {t("units.archive")}
                  </Button>
                </ReadOnlyGuard>
              </div>
            )}
          </section>
        </div>
      </div>

      <UnitFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        propertyId={property.id}
        unit={unit}
      />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="border-primary/30 bg-[#141414]">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle className="font-display uppercase tracking-[0.12em]">
              {t("units.archiveTitle", { name: unit.name })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {t("units.archiveBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs">{t("common:actions.cancel")}</AlertDialogCancel>
            <Button
              type="button"
              onClick={confirmArchive}
              disabled={archive.isPending}
              className="bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold"
            >
              {archive.isPending ? t("forms.saving") : t("units.archive")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
