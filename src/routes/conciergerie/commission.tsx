import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import {
  commissionErrorMessage,
  InlineCommissionCell,
} from "@/components/conciergerie/commission-rate-input";
import { noSpinnerClassName } from "@/components/conciergerie/drawer-field";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { MediaImage } from "@/components/media/media-image";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommission, usePanelMutation } from "@/hooks/use-portfolio-data";
import {
  useServerPageControls,
  useServerPagination,
  type ServerPageControls,
} from "@/hooks/use-server-pagination";
import { formatPercent } from "@/lib/currency";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { commissionService } from "@/services/portfolio-service";
import type { CommissionList, CommissionRow } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/commission")({
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "commission"));
  },
  component: CommissionPage,
});

function CommissionPage() {
  const controls = useServerPageControls();
  const query = useCommission(controls.page, controls.pageSize);
  return (
    <QueryView query={query} skeleton="table">
      {(list) => (
        <Commission list={list} controls={controls} refreshing={query.isPlaceholderData} />
      )}
    </QueryView>
  );
}

/** Commission % suggested when adding a property. */
function DefaultRateEditor({ defaultPct }: { defaultPct: number }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [value, setValue] = React.useState(String(defaultPct));
  const [invalid, setInvalid] = React.useState(false);
  const save = usePanelMutation((pct: number) => commissionService.setDefault(pct));

  React.useEffect(() => setValue(String(defaultPct)), [defaultPct]);

  const pct = Number(value);
  const dirty = value.trim() !== "" && pct !== defaultPct;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (value.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    save.mutate(pct, {
      onSuccess: (saved) =>
        toast.success(t("commission.defaultSaved", { pct: formatPercent(saved) })),
      onError: (error) => {
        setValue(String(defaultPct));
        toast.error(commissionErrorMessage(t, error));
      },
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-primary/30 bg-[linear-gradient(160deg,rgba(212,175,55,0.08),transparent_60%),#141414] p-5"
    >
      <div className="space-y-1">
        <label htmlFor="default-commission" className="font-serif text-xl text-[#F8F9FA]">
          {t("commission.defaultLabel")}
        </label>
        <p className="max-w-md text-xs text-muted-foreground">{t("commission.defaultHint")}</p>
        {invalid && (
          <p className="text-[0.66rem] text-destructive-foreground">
            {t("forms.errors.commissionRange")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-28">
          <ReadOnlyGuard className="flex w-full">
            <Input
              id="default-commission"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              value={value}
              aria-invalid={invalid}
              onChange={(event) => setValue(event.target.value)}
              className={`h-11 border-border/80 bg-[#161616] pe-8 text-base font-semibold tabular-nums text-primary aria-[invalid=true]:border-destructive ${noSpinnerClassName}`}
            />
          </ReadOnlyGuard>
          <span className="pointer-events-none absolute end-3 top-3 text-sm text-muted-foreground">
            %
          </span>
        </div>
        <ReadOnlyGuard>
          <Button
            type="submit"
            disabled={!dirty || save.isPending}
            className="btn-shimmer h-11 bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            {save.isPending && <Loader2 className="size-4 me-1.5 animate-spin" />}
            {t("common:actions.save")}
          </Button>
        </ReadOnlyGuard>
      </div>
    </form>
  );
}

function PropertyCell({ row }: { row: CommissionRow }) {
  return (
    <Link
      to="/conciergerie/properties/$propertyId"
      params={{ propertyId: row.propertyId }}
      onClick={(event) => event.stopPropagation()}
      className="group flex min-w-0 items-center gap-3"
    >
      <span className="overflow-hidden rounded-lg">
        <MediaImage
          kind="property"
          id={row.propertyId}
          name={row.propertyName}
          variant="thumb"
          className="hover-zoom size-10 shrink-0 rounded-lg"
        />
      </span>
      <span className="block min-w-0 truncate font-serif text-[0.98rem] text-[#F8F9FA] transition-colors group-hover:text-primary">
        {row.propertyName}
      </span>
    </Link>
  );
}

function Commission({
  list,
  controls,
  refreshing,
}: {
  list: CommissionList;
  controls: ServerPageControls;
  refreshing: boolean;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const pager = useServerPagination(list, controls);

  const columns: DataTableColumn<CommissionRow>[] = [
    {
      id: "property",
      header: t("commission.colProperty"),
      hideOnMobile: true,
      cell: (row) => <PropertyCell row={row} />,
    },
    {
      id: "rate",
      header: t("commission.colRate"),
      align: "end",
      cell: (row) => (
        <InlineCommissionCell
          property={{
            id: row.propertyId,
            name: row.propertyName,
            commissionPct: row.commissionPct,
          }}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.portfolio") },
          { label: t("common:nav.commission") },
        ]}
        title={t("commission.pageTitle")}
        description={t("commission.subtitleRates")}
      />

      <div className="max-w-xl">
        <DefaultRateEditor defaultPct={list.defaultCommissionPct} />
      </div>

      {list.total === 0 ? (
        <EmptyState
          illustrationName="empty-commission"
          title={t("commission.emptyTitle")}
          description={t("commission.emptyLine")}
        />
      ) : (
        <section
          className={cn("space-y-3 transition-opacity", refreshing && "opacity-60")}
          aria-busy={refreshing}
        >
          <div className="space-y-0.5">
            <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
              {t("commission.ratesTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("commission.appliesNext")}</p>
          </div>
          <DataTable
            label={t("commission.ratesTitle")}
            columns={columns}
            pagination={pager}
            getRowId={(row) => row.propertyId}
            mobileTitle={(row) => <PropertyCell row={row} />}
          />
        </section>
      )}
    </div>
  );
}
