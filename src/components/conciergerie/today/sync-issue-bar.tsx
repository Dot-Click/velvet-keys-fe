import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

const DISMISSED_KEY = "vk-sync-issues-dismissed";

/**
 * One-line ruby-edged bar for the backend's count of channel connections that stopped syncing.
 * Dismissing it hides this count for the browser session; a different count brings it back.
 */
export function SyncIssueBar({ count }: { count: number }) {
  const { t } = useTranslation("conciergerie");
  const signature = String(count);
  const [dismissed, setDismissed] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISSED_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  if (count <= 0 || dismissed === signature) return null;

  const dismiss = () => {
    setDismissed(signature);
    try {
      sessionStorage.setItem(DISMISSED_KEY, signature);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-border/70 border-s-[3px] border-s-[#FF85A1] bg-[#191214] px-3 py-2 text-xs"
    >
      <AlertTriangle className="size-4 shrink-0 text-[#FF85A1]" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate text-foreground/90">
        {t("today.syncCount", { count })}
      </p>
      <Link
        to="/conciergerie/channels"
        className="group inline-flex shrink-0 items-center gap-1 font-medium text-[#FF85A1] hover:underline"
      >
        {t("today.openChannels")}
        <ArrowRight
          className="size-3.5 rtl-flip transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("today.dismissSync")}
        className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
