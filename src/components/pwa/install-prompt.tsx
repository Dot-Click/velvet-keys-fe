import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlusSquare, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { LUXURY_EASE } from "@/lib/motion";

/**
 * A quiet bottom sheet on phones, from the second visit on, offering to install the app. Browsers
 * that can install it get an Install button; on iPhone and iPad, where only Share → Add to Home
 * Screen works, the sheet shows those steps instead.
 */
export function InstallPrompt() {
  const { t } = useTranslation("common");
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { mode, install, dismiss } = useInstallPrompt();
  const visible = isMobile && mode !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label={t("pwa.install.message")}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <div className="rounded-2xl border border-primary/30 bg-[#141414]/95 p-4 shadow-[0_-12px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <div className="flex items-start gap-3.5">
              <LogoMark size="sm" glow={false} className="mt-0.5" />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm font-medium leading-snug text-foreground">
                  {t("pwa.install.message")}
                </p>

                {mode === "ios" && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-[#0B0B0B] px-2.5 py-1.5 text-foreground">
                      <Share className="size-3.5 text-primary" aria-hidden="true" />
                      {t("pwa.install.share")}
                    </span>
                    <ArrowRight className="size-3.5 rtl-flip" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-[#0B0B0B] px-2.5 py-1.5 text-foreground">
                      <PlusSquare className="size-3.5 text-primary" aria-hidden="true" />
                      {t("pwa.install.addToHome")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {mode === "native" && (
                    <Button
                      size="sm"
                      onClick={() => void install()}
                      className="h-9 text-xs uppercase tracking-[0.14em]"
                    >
                      {t("pwa.install.install")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismiss}
                    className="h-9 text-xs uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {mode === "ios" ? t("pwa.install.gotIt") : t("pwa.install.notNow")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
