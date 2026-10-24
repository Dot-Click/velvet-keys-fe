import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CustomTimePickerProps {
  /** "HH:mm", 24-hour */
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  invalid?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, step) => String(step * 5).padStart(2, "0"));
// 23:59 is a common "end of day" deadline, so it gets its own shortcut
const END_OF_DAY = "23:59";

/** Time field that opens an hour and minute list, in place of the browser's native time input. */
export function CustomTimePicker({
  value,
  onChange,
  placeholder = "--:--",
  disabled = false,
  className,
  id,
  invalid = false,
}: CustomTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? "");
  const hour = match?.[1];
  const minute = match?.[2];

  const pick = (nextHour: string, nextMinute: string) => onChange?.(`${nextHour}:${nextMinute}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "group flex h-11 w-full items-center justify-between rounded-md border border-input bg-card/60 px-3.5 py-2 text-sm text-foreground transition-all duration-300",
            "hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/70",
            "aria-[invalid=true]:border-destructive",
            disabled && "cursor-not-allowed opacity-50",
            !match && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
            <span dir="ltr" className="tabular-nums">
              {match ? value : placeholder}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-border bg-card p-2 shadow-2xl">
        <div dir="ltr" className="flex gap-2">
          <Column
            label="Hour"
            items={HOURS}
            selected={hour}
            onSelect={(next) => pick(next, minute ?? "00")}
          />
          <Column
            label="Minute"
            items={MINUTES}
            selected={minute}
            onSelect={(next) => {
              pick(hour ?? "00", next);
              setOpen(false);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            onChange?.(END_OF_DAY);
            setOpen(false);
          }}
          className="mt-2 w-full rounded px-2 py-1 text-start text-xs text-primary hover:underline"
        >
          {END_OF_DAY}
        </button>
      </PopoverContent>
    </Popover>
  );
}

function Column({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: string[];
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  return (
    <div role="listbox" aria-label={label} className="h-48 w-14 overflow-y-auto pe-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="option"
          aria-selected={item === selected}
          onClick={() => onSelect(item)}
          className={cn(
            "block w-full rounded px-2 py-1 text-center text-sm tabular-nums transition-colors",
            item === selected
              ? "bg-primary/20 font-semibold text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
