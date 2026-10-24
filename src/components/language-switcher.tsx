import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  setAppLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/lib/i18n";
import { useAuth } from "@/components/auth-provider";

interface LanguageSwitcherProps {
  variant?: "segmented" | "dropdown" | "pill";
  className?: string;
}

export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation("common");
  const currentLang = (i18n.language || "en").substring(0, 2) as SupportedLanguage;
  const { updateLanguage } = useAuth();
  const [isFading, setIsFading] = useState(false);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    if (code === currentLang) return;

    // Trigger smooth 200ms fade transition on root app container
    const contentTarget =
      document.getElementById("app-content-root") ||
      document.querySelector("main") ||
      document.body;

    if (contentTarget) {
      contentTarget.classList.add("is-switching");
      setIsFading(true);
      setTimeout(() => {
        setAppLanguage(code);
        try {
          updateLanguage?.(code);
        } catch {
          // no-op
        }
        setTimeout(() => {
          contentTarget.classList.remove("is-switching");
          setIsFading(false);
        }, 100);
      }, 100);
    } else {
      setAppLanguage(code);
      try {
        updateLanguage?.(code);
      } catch {
        // no-op
      }
    }
  };

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center rounded-lg border border-[rgba(212,175,55,0.22)] bg-[#121212]/90 p-1 shadow-sm backdrop-blur-md ${className}`}
        role="group"
        aria-label={t("language.select")}
      >
        {SUPPORTED_LANGUAGES.map(({ code, nativeName }) => {
          const isActive = currentLang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleSelectLanguage(code)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              aria-label={nativeName}
              aria-pressed={isActive}
              lang={code}
            >
              {code.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  const activeMeta = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ?? {
    code: "en",
    nativeName: "English",
  };

  const isPill = variant === "pill";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            isPill
              ? `group flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.22)] bg-[#141414]/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-foreground/90 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-[#1a1a1a] hover:text-foreground ${className}`
              : `group flex items-center gap-2 rounded-lg border border-[rgba(212,175,55,0.22)] bg-[#141414]/90 px-3 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-[#1a1a1a] hover:text-foreground ${className}`
          }
          aria-label={t("language.switcher")}
        >
          {isPill ? (
            <>
              <span className="font-semibold uppercase tracking-wider font-sans tabular-nums">
                {activeMeta.code}
              </span>
              <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" />
            </>
          ) : (
            <>
              <Globe className="size-3.5 text-primary transition-transform duration-300 group-hover:rotate-45" />
              <span className="font-semibold uppercase tracking-wider">{activeMeta.code}</span>
              <span className="text-[10px] text-muted-foreground hidden xl:inline">
                ({activeMeta.nativeName})
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 border border-[rgba(212,175,55,0.22)] bg-[#141414]/95 p-1.5 backdrop-blur-xl"
      >
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("language.select")}
        </div>
        {SUPPORTED_LANGUAGES.map(({ code, nativeName }) => {
          const isActive = currentLang === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleSelectLanguage(code)}
              className={`flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 font-sans tabular-nums text-[11px] font-bold uppercase text-primary">
                  {code}
                </span>
                <span className="font-sans text-xs">{nativeName}</span>
              </div>
              {isActive && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
