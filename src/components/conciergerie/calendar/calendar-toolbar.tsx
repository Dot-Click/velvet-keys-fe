import { BrushCleaning, ChevronLeft, ChevronRight, Info, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ListSearch } from "@/components/list-controls";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SourceGlyph } from "./calendar-bars";
import {
  TYPE_FILTERS,
  VIEW_MODES,
  ZOOMS,
  type CalendarViewMode,
  type CalendarZoom,
  type TypeFilter,
} from "./calendar-model";

interface CalendarToolbarProps {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  zoom: CalendarZoom;
  onZoomChange: (zoom: CalendarZoom) => void;
  label: string;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  property: string;
  onPropertyChange: (propertyId: string) => void;
  properties: { id: string; name: string }[];
  search: string;
  onSearchChange: (value: string) => void;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  render,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
  render: (option: T) => React.ReactNode;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-[#121212] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-8 rounded-md px-2.5 text-xs transition-colors",
            value === option
              ? "bg-primary/15 font-medium text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {render(option)}
        </button>
      ))}
    </div>
  );
}

/** Navigation, view, zoom and filters for the calendar, with the legend in a popover. */
export function CalendarToolbar({
  view,
  onViewChange,
  zoom,
  onZoomChange,
  label,
  onToday,
  onPrevious,
  onNext,
  type,
  onTypeChange,
  property,
  onPropertyChange,
  properties,
  search,
  onSearchChange,
}: CalendarToolbarProps) {
  const { t } = useTranslation(["conciergerie", "common"]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outlineGold" size="sm" onClick={onToday} className="h-9">
        {t("calendar.today")}
      </Button>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onPrevious}
          aria-label={t("calendar.previous")}
        >
          <ChevronLeft className="size-4 rtl-flip" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onNext}
          aria-label={t("calendar.next")}
        >
          <ChevronRight className="size-4 rtl-flip" />
        </Button>
      </div>
      <p className="min-w-0 font-serif text-lg text-[#F8F9FA]" aria-live="polite">
        {label}
      </p>

      <div className="ms-auto flex flex-wrap items-center gap-2">
        <Segmented
          value={view}
          options={VIEW_MODES}
          onChange={onViewChange}
          label={t("calendar.viewLabel")}
          render={(option) => t(`calendar.view.${option}`)}
        />
        {view === "timeline" && (
          <Segmented
            value={zoom}
            options={ZOOMS}
            onChange={onZoomChange}
            label={t("calendar.zoomLabel")}
            render={(option) => t(`calendar.zoom.${option}`)}
          />
        )}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label={t("calendar.filterLabel")}
          className="flex shrink-0 gap-1.5"
        >
          {TYPE_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => onTypeChange(option)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
                type === option
                  ? option === "LTR"
                    ? "border-[#A2E8DD]/60 bg-[#A2E8DD]/10 text-[#A2E8DD]"
                    : "border-primary/60 bg-primary/12 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`calendar.filter.${option}`)}
            </button>
          ))}
        </div>

        <Select value={property} onValueChange={onPropertyChange}>
          <SelectTrigger
            aria-label={t("calendar.propertyFilter")}
            className="h-8 min-w-0 flex-1 border-border/70 bg-[#121212] text-xs sm:w-48 sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-[#141414] text-xs">
            <SelectItem value="all">{t("calendar.allProperties")}</SelectItem>
            {properties.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ListSearch
          value={search}
          onChange={onSearchChange}
          placeholder={t("calendar.searchUnits")}
          className="min-w-0 flex-1 sm:w-56 sm:flex-none"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("calendar.legendButton")}
              className="h-8 shrink-0 gap-1.5 px-2 text-xs sm:ms-auto"
            >
              <Info className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t("calendar.legendButton")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 border-border bg-[#141414] p-3 text-xs">
            <CalendarLegend />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function CalendarLegend() {
  const { t } = useTranslation("conciergerie");
  const item = (swatch: React.ReactNode, label: string) => (
    <li className="flex items-center gap-2.5">
      <span className="flex w-10 shrink-0 justify-center">{swatch}</span>
      <span className="text-muted-foreground">{label}</span>
    </li>
  );
  return (
    <div className="space-y-2.5">
      <p className="font-serif text-base text-[#F8F9FA]">{t("calendar.legendButton")}</p>
      <ul className="space-y-2">
        {item(
          <span className="h-3.5 w-9 rounded border border-primary/25 border-s-[3px] border-s-primary bg-primary/12" />,
          t("calendar.legend.stay"),
        )}
        {item(
          <span className="flex gap-1">
            <SourceGlyph kind="airbnb" />
            <SourceGlyph kind="booking" />
            <SourceGlyph kind="direct" />
          </span>,
          t("calendar.legend.sources"),
        )}
        {item(<span className="size-1.5 rounded-full bg-[#FF85A1]" />, t("calendar.unpaid"))}
        {item(
          <span className="grid size-5 place-items-center rounded-full border border-[#A2E8DD]/60 text-[#A2E8DD]">
            <BrushCleaning className="size-3" />
          </span>,
          t("calendar.legend.housekeeping"),
        )}
        {item(
          <span className="h-3.5 w-9 rounded border border-[#A2E8DD]/45 bg-[#A2E8DD]/10" />,
          t("calendar.legend.lease"),
        )}
        {item(
          <span className="hatch-ruby grid h-3.5 w-9 place-items-center rounded border border-[#FF85A1]/25 text-[#FFB8C8]">
            <Wrench className="size-2.5" />
          </span>,
          t("calendar.legend.block"),
        )}
        {item(
          <span className="h-3.5 w-9 rounded border border-dashed border-[#A2E8DD]/40" />,
          t("calendar.legend.available"),
        )}
        {item(
          <span className="h-3.5 w-4 border-x border-[#A2E8DD]/60 bg-[#A2E8DD]/10" />,
          t("calendar.legend.today"),
        )}
        {item(<span className="h-3.5 w-4 bg-[#C8964A]/15" />, t("calendar.legend.weekend"))}
      </ul>
      <p className="border-t border-border/60 pt-2 text-[0.68rem] leading-relaxed text-muted-foreground">
        {t("calendar.legend.dragHint")}
      </p>
    </div>
  );
}
