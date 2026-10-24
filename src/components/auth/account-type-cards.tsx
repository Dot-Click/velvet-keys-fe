import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ArchitecturalDoorway,
  ArchitecturalKey,
} from "@/components/illustrations/architectural-illustrations";
import type { SignupRole } from "@/types/auth";

interface AccountTypeCardsProps {
  value: SignupRole | null;
  onChange: (role: SignupRole) => void;
}

const OPTIONS: { role: SignupRole; titleKey: string; descriptionKey: string }[] = [
  {
    role: "owner",
    titleKey: "signup.ownerCardTitle",
    descriptionKey: "signup.ownerCardDescription",
  },
  {
    role: "conciergerie",
    titleKey: "signup.conciergerieCardTitle",
    descriptionKey: "signup.conciergerieCardDescription",
  },
];

export function AccountTypeCards({ value, onChange }: AccountTypeCardsProps) {
  const { t } = useTranslation("auth");

  return (
    <RadioGroupPrimitive.Root
      value={value ?? ""}
      onValueChange={(next) => onChange(next as SignupRole)}
      aria-label={t("signup.typeTitle")}
      className="grid gap-4"
    >
      {OPTIONS.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.role}
          value={option.role}
          className="group relative flex w-full items-center gap-5 rounded-2xl border border-border/80 bg-[#121212] p-5 text-start transition-all duration-300 hover:border-primary/40 hover:bg-[#151515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary/[0.06] data-[state=checked]:shadow-[0_0_24px_rgba(212,175,55,0.12)] sm:p-6"
        >
          <span className="grid size-20 shrink-0 place-items-center rounded-xl border border-primary/20 bg-[#0E0E0E] sm:size-24">
            {option.role === "owner" ? (
              <ArchitecturalDoorway className="size-16 sm:size-20" opacity={0.85} />
            ) : (
              <ArchitecturalKey className="size-14 sm:size-16" />
            )}
          </span>
          <span className="min-w-0 flex-1 space-y-1.5 pe-6">
            <span className="block font-display text-base uppercase tracking-[0.12em] text-foreground">
              {t(option.titleKey)}
            </span>
            <span className="block text-xs leading-relaxed text-muted-foreground">
              {t(option.descriptionKey)}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="absolute end-4 top-4 grid size-5 place-items-center rounded-full border border-border text-transparent transition-colors group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground"
          >
            <Check className="size-3" />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
