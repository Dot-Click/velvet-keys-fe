import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, UserCheck, Wrench, Receipt, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { Button } from "@/components/ui/button";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FloatingQuickActionsProps {
  onAction: (action: "booking" | "repair" | "expense") => void;
  /** Overrides the bottom offset, e.g. to sit above a phone tab bar */
  className?: string;
}

const MODAL_SELECTOR = '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [role="alertdialog"]';

/**
 * True while a modal dialog, drawer or sheet is open. The app's drawers render inside the page
 * content (a lower stacking context than this button), so without this the button floats over
 * their footers, e.g. on top of the lease wizard's Next / Confirm buttons.
 */
function useModalOpen() {
  const [modalOpen, setModalOpen] = React.useState(false);
  React.useEffect(() => {
    const update = () => setModalOpen(document.querySelector(MODAL_SELECTOR) !== null);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role", "aria-modal", "data-state"],
    });
    return () => observer.disconnect();
  }, []);
  return modalOpen;
}

export function FloatingQuickActions({ onAction, className }: FloatingQuickActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation("common");
  const modalOpen = useModalOpen();

  // Collapse any open menu once a dialog takes over.
  React.useEffect(() => {
    if (modalOpen) setIsOpen(false);
  }, [modalOpen]);

  if (modalOpen) return null;

  return (
    <div className={cn("fixed bottom-6 end-6 z-40 flex flex-col items-end gap-2.5", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: LUXURY_EASE }}
            className="flex flex-col items-end gap-2"
          >
            <ReadOnlyGuard side="start">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onAction("booking");
                }}
                size="sm"
                className="h-10 rounded-full border border-primary/40 bg-[#161616] px-4 text-xs font-medium text-foreground shadow-xl hover:border-primary hover:bg-[#1E1C15] flex items-center gap-2 group"
              >
                <UserCheck className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
                <span>{t("floatingActions.newBooking")}</span>
              </Button>
            </ReadOnlyGuard>

            <ReadOnlyGuard side="start">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onAction("repair");
                }}
                size="sm"
                className="h-10 rounded-full border border-destructive/40 bg-[#161616] px-4 text-xs font-medium text-foreground shadow-xl hover:border-destructive hover:bg-[#201115] flex items-center gap-2 group"
              >
                <Wrench className="size-3.5 text-destructive-foreground group-hover:scale-110 transition-transform" />
                <span>{t("floatingActions.logRepair")}</span>
              </Button>
            </ReadOnlyGuard>

            <ReadOnlyGuard side="start">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onAction("expense");
                }}
                size="sm"
                className="h-10 rounded-full border border-[#A2E8DD]/40 bg-[#161616] px-4 text-xs font-medium text-foreground shadow-xl hover:border-[#A2E8DD] hover:bg-[#121A18] flex items-center gap-2 group"
              >
                <Receipt className="size-3.5 text-[#A2E8DD] group-hover:scale-110 transition-transform" />
                <span>{t("floatingActions.recordExpense")}</span>
              </Button>
            </ReadOnlyGuard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button with Gold/Jade Gradient Accent */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`size-13 rounded-full border border-primary/50 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.25)] transition-all duration-300 ${
          isOpen
            ? "bg-[#181818] text-foreground rotate-45 border-primary/70"
            : "bg-gradient-to-br from-[#D4AF37] to-[#B89225] text-[#0B0B0B] hover:brightness-110"
        }`}
        aria-label={t("floatingActions.menuLabel")}
      >
        <Plus className="size-6 stroke-[2.2]" />
      </Button>
    </div>
  );
}
