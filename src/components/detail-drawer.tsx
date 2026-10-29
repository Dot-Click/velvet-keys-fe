import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { LUXURY_EASE } from "@/lib/motion";
import { Button } from "@/components/ui/button";

/** Elements Tab can reach inside the drawer. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = "max-w-[480px]",
}: DetailDrawerProps) {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.language === "ar";
  const slideInitial = isRTL ? "-100%" : "100%";
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Callers pass a new onClose on every render; the keyboard handling must not restart for it
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  // Like a modal dialog: focus moves in, Tab stays inside, Escape closes, focus returns on close
  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) {
        closeRef.current();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (e.shiftKey && (active === first || active === panel || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [open]);

  // Rendered at document.body via a portal (like the Sheet/Dialog primitives), not inline in the
  // page tree: AppShell's fixed mobile bottom nav bar shares this z-index and sits after the page
  // content in the DOM, so an inline-rendered drawer (equal z-index, earlier in the DOM) lost the
  // stacking order and had its bottom -- including the submit button -- painted over by the nav bar.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: LUXURY_EASE }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Panel (480px end slide-in) */}
          <div className="fixed inset-y-0 end-0 flex ps-10 pointer-events-none">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              initial={{ x: slideInitial }}
              animate={{ x: 0 }}
              exit={{ x: slideInitial }}
              transition={{ duration: 0.4, ease: LUXURY_EASE }}
              className={`w-screen ${width} flex flex-col border-s border-primary/25 bg-[#141414] shadow-[-20px_0_60px_rgba(0,0,0,0.85)] z-10 pointer-events-auto focus:outline-none`}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border/80 px-6 py-5 bg-[#111111]/90">
                <div className="space-y-1 pe-4">
                  <div className="flex items-center gap-2.5">
                    <h3
                      id={titleId}
                      className="font-display text-xl uppercase tracking-[0.12em] text-[#F8F9FA]"
                    >
                      {title}
                    </h3>
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground tracking-wide font-normal">
                      {subtitle}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="size-8 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                  <span className="sr-only">{t("drawer.closeDrawer")}</span>
                </Button>
              </div>

              {/* Body: extra bottom padding clears the iOS home indicator / Android gesture bar
                  when a form puts its own submit button at the end of this scrollable area
                  instead of the fixed footer below. */}
              <div
                className="flex-1 overflow-y-auto px-6 pt-6 space-y-6"
                style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className="border-t border-border/80 px-6 pt-4 bg-[#111111]/95"
                  style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
