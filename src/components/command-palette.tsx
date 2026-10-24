import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Compass, Plus, Receipt, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { useReadOnly } from "@/hooks/use-read-only";
import { getNavSections } from "@/lib/navigation";
import { canAccessOperations, roleAccent } from "@/lib/roles";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const QUICK_ACTIONS = [
  {
    id: "booking",
    labelKey: "common:commandPalette.newBooking",
    to: "/conciergerie/bookings",
    icon: Plus,
    iconClassName: "bg-primary/10 text-primary",
    shortcut: "B",
  },
  {
    id: "repair",
    labelKey: "common:commandPalette.logRepair",
    to: "/conciergerie/maintenance",
    icon: Wrench,
    iconClassName: "bg-destructive/15 text-destructive-foreground",
    shortcut: "R",
  },
  {
    id: "expense",
    labelKey: "common:commandPalette.recordExpense",
    to: "/conciergerie/expenses",
    icon: Receipt,
    iconClassName: "bg-primary/10 text-primary",
    shortcut: "E",
  },
] as const;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAction?: (action: "booking" | "repair" | "expense") => void;
}

export function CommandPalette({ open, onOpenChange, onQuickAction }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isReadOnly, isAccountReadOnly } = useReadOnly();
  const { t } = useTranslation(["common", "owner", "conciergerie"]);
  const profile = session?.profile;
  const sections = profile ? getNavSections(profile) : [];
  const hasOperations = profile ? canAccessOperations(profile) : false;
  const iconAccent =
    profile && roleAccent(profile.role) === "teal" ? "text-[#A2E8DD]" : "text-primary";

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative border border-primary/30 bg-[#141414] shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden rounded-xl">
        <CommandInput placeholder={t("common:commandPalette.searchPlaceholder")} />
        <CommandList className="max-h-96 py-2 text-foreground">
          <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
            {t("common:commandPalette.noResults")}
          </CommandEmpty>

          {/* Quick Actions (Conciergerie tools) */}
          {hasOperations && (
            <>
              <CommandGroup heading={t("common:commandPalette.quickActions")}>
                {QUICK_ACTIONS.map((action) => (
                  <CommandItem
                    key={action.id}
                    disabled={isReadOnly}
                    onSelect={() =>
                      handleSelect(() => {
                        if (onQuickAction) onQuickAction(action.id);
                        else void navigate({ to: action.to });
                      })
                    }
                    className="flex items-center gap-2.5 cursor-pointer py-2.5 data-[disabled=true]:cursor-not-allowed"
                  >
                    <div
                      className={`grid size-6 place-items-center rounded ${action.iconClassName}`}
                    >
                      <action.icon className="size-3.5" />
                    </div>
                    <span>{t(action.labelKey)}</span>
                    <span className="ms-auto text-[0.68rem] text-muted-foreground font-mono">
                      {isReadOnly
                        ? isAccountReadOnly
                          ? t("common:readOnly.commandSuffix")
                          : t("common:pwa.offline.commandSuffix")
                        : action.shortcut}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="bg-border/60" />
            </>
          )}

          {/* Navigation for the signed-in role only */}
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index > 0 && <CommandSeparator className="bg-border/60" />}
              <CommandGroup heading={t(`common:${section.titleKey}`)}>
                {section.items.map((item) => (
                  <CommandItem
                    key={`${section.id}-${item.id}`}
                    value={`${section.id} ${t(`common:${item.labelKey}`)}`}
                    onSelect={() => handleSelect(() => void navigate({ to: item.to }))}
                    className="flex items-center gap-2.5 cursor-pointer py-2"
                  >
                    <item.icon className={`size-4 ${iconAccent}`} />
                    <span>{t(`common:${item.labelKey}`)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}

          {import.meta.env.DEV && (
            <>
              <CommandSeparator className="bg-border/60" />
              <CommandGroup heading={t("common:nav.demoSimulator")}>
                <CommandItem
                  onSelect={() => handleSelect(() => void navigate({ to: "/dev/design-system" }))}
                  className="flex items-center gap-2.5 cursor-pointer py-2"
                >
                  <Compass className="size-4 text-primary/70" />
                  <span>{t("common:nav.designSystemLab")}</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
