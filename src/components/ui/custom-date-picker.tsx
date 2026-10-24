import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CustomDatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  className,
  id,
}: CustomDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize string to Date
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return undefined;
    if (minDate instanceof Date) return isValid(minDate) ? minDate : undefined;
    const parsed = parseISO(minDate);
    return isValid(parsed) ? parsed : undefined;
  }, [minDate]);

  const parsedMaxDate = React.useMemo(() => {
    if (!maxDate) return undefined;
    if (maxDate instanceof Date) return isValid(maxDate) ? maxDate : undefined;
    const parsed = parseISO(maxDate);
    return isValid(parsed) ? parsed : undefined;
  }, [maxDate]);

  const handleSelect = (selectedDate: Date | undefined) => {
    onChange?.(selectedDate);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
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
            !parsedDate && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon className="size-4 shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="truncate">
              {parsedDate ? format(parsedDate, "MMM d, yyyy") : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {parsedDate && !disabled && (
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
                aria-label="Clear date"
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
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={(date) => {
              if (parsedMinDate && date < parsedMinDate) return true;
              if (parsedMaxDate && date > parsedMaxDate) return true;
              return false;
            }}
            initialFocus
            className="rounded-md border-0 bg-transparent text-foreground"
          />

          <div className="flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="text-primary hover:underline font-medium py-1 px-1.5 rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleSelect(tomorrow);
              }}
              className="text-muted-foreground hover:text-foreground py-1 px-1.5 rounded transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                handleSelect(nextWeek);
              }}
              className="text-muted-foreground hover:text-foreground py-1 px-1.5 rounded transition-colors"
            >
              +7 Days
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
