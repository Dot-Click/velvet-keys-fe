import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Compact filter with an "All" choice first. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const { t } = useTranslation("admin");
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-9 border-border/80 bg-[#121212] text-[13px] xl:w-48"
      >
        <span className="me-1 shrink-0 text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-[#141414] text-[13px]">
        <SelectItem value="all">{t("filters.all")}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
