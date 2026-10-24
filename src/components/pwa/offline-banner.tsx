import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/use-online-status";

/** A slim bar across the top of a panel while the device has no connection. */
export function OfflineBanner() {
  const { t } = useTranslation("common");
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className="border-b border-primary/40 bg-[#141414] text-foreground">
      <div className="flex items-center gap-2.5 px-4 py-1.5 sm:px-8 lg:px-12">
        <WifiOff className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-xs font-medium">{t("pwa.offline.banner")}</p>
      </div>
    </div>
  );
}
