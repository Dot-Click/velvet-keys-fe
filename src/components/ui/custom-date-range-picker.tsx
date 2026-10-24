import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CustomDateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CustomDateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  minDate,
  maxDate,
  disabled = false,
  className,
  id,
}: CustomDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatRange = () => {
    if (!value?.from) return placeholder;
    if (value.from && !value.to) {
      return `${format(value.from, "MMM d, yyyy")} – Select return`;
    }
    if (value.from && value.to) {
      return `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`;
    }
    return placeholder;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  const selectPreset = (days: number) => {
    const from = new Date();
    const to = new Date();
    to.setDate(from.getDate() + days);
    onChange?.({ from, to });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "group flex h-11 w-full items-center justify-between rounded-md border border-input bg-card/60 px-3.5 py-2 text-sm text-foreground transition-all duration-300",
            "hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/70",
            disabled && "cursor-not-allowed opacity-50",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon className="size-4 shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="truncate font-sans">{formatRange()}</span>
          </div>

          <div className="flex items-center gap-1">
            {value?.from && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                aria-label="Clear range"
                className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border-border bg-card p-3 shadow-2xl backdrop-blur-md"
      >
        <div className="space-y-3">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
            className="rounded-md border-0 bg-transparent text-foreground"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 px-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectPreset(7)}
                className="rounded border border-border/80 bg-background/50 px-2 py-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                Next 7 days
              </button>
              <button
                type="button"
                onClick={() => selectPreset(14)}
                className="rounded border border-border/80 bg-background/50 px-2 py-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                Next 14 days
              </button>
              <button
                type="button"
                onClick={() => selectPreset(30)}
                className="rounded border border-border/80 bg-background/50 px-2 py-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                Next 30 days
              </button>
            </div>
            {value?.from && (
              <button
                type="button"
                onClick={() => {
                  onChange?.(undefined);
                }}
                className="text-muted-foreground hover:text-destructive-foreground transition-colors"
              >
                Reset range
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
