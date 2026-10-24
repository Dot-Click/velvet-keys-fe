import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { AppLanguage } from "@/types/auth";
import { cn } from "@/lib/utils";
import { authInputClassName } from "./auth-field";

interface LanguageSelectProps {
  id: string;
  value: AppLanguage;
  onChange: (value: AppLanguage) => void;
}

export function LanguageSelect({ id, value, onChange }: LanguageSelectProps) {
  const { t } = useTranslation("auth");
  return (
    <Select value={value} onValueChange={(next) => onChange(next as AppLanguage)}>
      <SelectTrigger
        id={id}
        aria-label={t("fields.language")}
        className={cn(authInputClassName, "w-full")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-[#141414]">
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code} className="cursor-pointer">
            <span lang={language.code} dir={language.dir}>
              {language.nativeName}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
