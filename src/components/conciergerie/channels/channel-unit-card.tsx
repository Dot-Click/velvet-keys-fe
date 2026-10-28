import * as React from "react";
import { AlertTriangle, Link2, RefreshCw, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { ChannelMark, LiveSyncDot } from "@/components/conciergerie/channel-badges";
import { MediaImage } from "@/components/media/media-image";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePanelMutation, useUnitConnections } from "@/hooks/use-portfolio-data";
import { channexErrorKey } from "@/lib/channex-errors";
import { formatRelativeTime } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { channexService } from "@/services/channex-service";
import type { ChannelPlatform } from "@/types/channel";
import type { Channel, ChannelConnection } from "@/types/channex";

/** The two channels the backend supports (velvet-keys-be/app/models/enums.py Channel). */
export const REAL_CHANNELS: readonly Channel[] = ["airbnb", "booking"];

/** An STR unit as listed on the Channels screen (from the calendar roster, not a channel type). */
export interface ChannelUnitRow {
  unitId: string;
  unitName: string;
  propertyId: string;
  propertyName: string;
}

/** Maps a real Channex channel to the display/i18n platform key the rest of the UI already uses. */
function displayPlatform(channel: Channel): ChannelPlatform {
  return channel === "booking" ? "bookingCom" : "airbnb";
}

/** How long a connection can sit in "Pending" before we offer to cancel it (see
 * velvet-keys-be/app/services/channex.py `pending_since`). Abandoned Channex/Airbnb
 * authorization flows otherwise leave the unit stuck with no way to retry. */
const PENDING_TIMEOUT_MS = 2 * 60 * 1000;

/** True once `pendingSince` is more than PENDING_TIMEOUT_MS in the past. Re-evaluates itself with
 * a single timer scheduled for the exact moment the threshold is crossed, so the "Cancel" option
 * appears live without polling or a page reload. */
function usePendingTimedOut(pendingSince: string | null | undefined): boolean {
  const elapsedAtMount = pendingSince ? Date.now() - new Date(pendingSince).getTime() : 0;
  const [timedOut, setTimedOut] = React.useState(() => elapsedAtMount >= PENDING_TIMEOUT_MS);

  React.useEffect(() => {
    if (!pendingSince) {
      setTimedOut(false);
      return;
    }
    const elapsed = Date.now() - new Date(pendingSince).getTime();
    if (elapsed >= PENDING_TIMEOUT_MS) {
      setTimedOut(true);
      return;
    }
    setTimedOut(false);
    const timer = window.setTimeout(() => setTimedOut(true), PENDING_TIMEOUT_MS - elapsed);
    return () => window.clearTimeout(timer);
  }, [pendingSince]);

  return timedOut;
}

/** The connection that represents the unit's current link on a channel: the latest one that isn't disconnected. */
export function currentConnection(
  connections: ChannelConnection[] | undefined,
  channel: Channel,
): ChannelConnection | undefined {
  if (!connections) return undefined;
  for (let i = connections.length - 1; i >= 0; i -= 1) {
    const candidate = connections[i]!;
    if (candidate.channel === channel && candidate.status !== "disconnected") return candidate;
  }
  return undefined;
}

export function unitHasError(connections: ChannelConnection[] | undefined) {
  return REAL_CHANNELS.some(
    (channel) => currentConnection(connections, channel)?.status === "error",
  );
}

/**
 * One STR unit and its two channel links. Connections are fetched per unit (the backend has no
 * cross-unit connections list), so each card loads its own `useUnitConnections` and renders
 * independently of the others.
 */
export function ChannelUnitCard({
  unit,
  onConnect,
  onReconnect,
}: {
  unit: ChannelUnitRow;
  onConnect: (unit: ChannelUnitRow, channel: Channel) => void;
  onReconnect: (unit: ChannelUnitRow, channel: Channel, connectionId: string) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const connections = useUnitConnections(unit.unitId);
  const error = unitHasError(connections.data);

  return (
    <article
      className={cn(
        "group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border bg-[#141414]",
        error ? "border-[#FF85A1]/35 border-s-[3px] border-s-[#FF85A1]" : "border-border/70",
      )}
    >
      <div className="relative h-32 overflow-hidden">
        <MediaImage
          kind="unit"
          id={unit.unitId}
          name={unit.unitName}
          variant="card"
          className="hover-zoom size-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
        <div className="absolute inset-x-4 bottom-2.5 min-w-0">
          <h3 className="truncate font-serif text-lg leading-tight tracking-normal text-[#F8F9FA]">
            {unit.unitName}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{unit.propertyName}</p>
        </div>
      </div>

      {connections.isPending ? (
        <div className="flex-1 space-y-2 p-3" aria-busy="true">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : connections.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("channels.dialog.failed")}</p>
          <Button variant="outline" size="sm" onClick={() => void connections.refetch()}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t("common:states.retry")}
          </Button>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-border/50">
          {REAL_CHANNELS.map((channel) => (
            <ConnectionRow
              key={channel}
              unit={unit}
              channel={channel}
              connection={currentConnection(connections.data, channel)}
              onConnect={() => onConnect(unit, channel)}
              onReconnect={(connectionId) => onReconnect(unit, channel, connectionId)}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

function ConnectionRow({
  unit,
  channel,
  connection,
  onConnect,
  onReconnect,
}: {
  unit: ChannelUnitRow;
  channel: Channel;
  connection: ChannelConnection | undefined;
  onConnect: () => void;
  onReconnect: (connectionId: string) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const platform = displayPlatform(channel);
  const platformName = t(`channels.platform.${platform}`);
  const status = connection?.status ?? "disconnected";
  const pendingTimedOut = usePendingTimedOut(
    status === "pending" ? connection?.pendingSince : null,
  );

  const disconnect = usePanelMutation((connectionId: string) =>
    channexService.disconnect(connectionId),
  );

  function confirmAndDisconnect() {
    if (!connection) return;
    disconnect.mutate(connection.id, {
      onSuccess: () => {
        setConfirmDisconnect(false);
        toast.success(
          t("channels.disconnectedToast", { unit: unit.unitName, platform: platformName }),
        );
      },
      onError: (error) => {
        setConfirmDisconnect(false);
        toast.error(t(channexErrorKey(error)));
      },
    });
  }

  function cancelPending() {
    if (!connection) return;
    disconnect.mutate(connection.id, {
      onSuccess: () => {
        toast.success(
          t("channels.pendingCancelledToast", { unit: unit.unitName, platform: platformName }),
        );
      },
      onError: (error) => {
        toast.error(t(channexErrorKey(error)));
      },
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <ChannelMark platform={platform} className="size-6 rounded-md text-[0.62rem]" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs">
          {status === "connected" ? (
            <>
              <LiveSyncDot />
              <span className="text-[#A2E8DD]">{t("channels.status.connected")}</span>
            </>
          ) : status === "error" ? (
            <>
              <AlertTriangle className="size-3.5 text-[#FF85A1]" aria-hidden="true" />
              <span className="text-[#FF85A1]">{t("channels.status.error")}</span>
            </>
          ) : status === "pending" ? (
            <>
              <RefreshCw className="size-3 animate-spin text-primary" aria-hidden="true" />
              <span className="text-primary">{t("channels.status.pending")}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
              <span className="text-muted-foreground">{t("channels.status.disconnected")}</span>
            </>
          )}
        </p>
        <p className="truncate text-[0.7rem] text-muted-foreground">
          {connection?.listingName ?? platformName}
          {connection?.lastSyncAt && (
            <>
              {" · "}
              <time dateTime={connection.lastSyncAt}>
                {formatRelativeTime(connection.lastSyncAt)}
              </time>
            </>
          )}
        </p>
        {status === "error" && (
          <p className="truncate text-[0.68rem] text-[#FF85A1]">
            {connection?.errorMessage ?? t("channels.errorRow", { platform: platformName })}
          </p>
        )}
        {status === "pending" && pendingTimedOut && connection && (
          <p className="flex items-center gap-1.5 truncate text-[0.68rem] text-muted-foreground">
            {t("channels.pendingTimeout")}
            <ReadOnlyGuard>
              <button
                type="button"
                onClick={cancelPending}
                disabled={disconnect.isPending}
                className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
              >
                {t("channels.cancelPending")}
              </button>
            </ReadOnlyGuard>
          </p>
        )}
      </div>

      {status === "error" && connection ? (
        <ReadOnlyGuard>
          <Button
            size="sm"
            variant="outlineRuby"
            onClick={() => onReconnect(connection.id)}
            className="h-8 px-2.5 text-[0.7rem]"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            {t("channels.reconnect")}
          </Button>
        </ReadOnlyGuard>
      ) : status === "disconnected" ? (
        <ReadOnlyGuard>
          <Button
            size="sm"
            variant="outlineGold"
            onClick={onConnect}
            className="h-8 px-2.5 text-[0.7rem]"
          >
            <Link2 className="size-3" aria-hidden="true" />
            {t("channels.connect")}
          </Button>
        </ReadOnlyGuard>
      ) : status === "connected" ? (
        <ReadOnlyGuard>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmDisconnect(true)}
            className="h-8 px-2.5 text-[0.7rem]"
          >
            <Unlink className="size-3" aria-hidden="true" />
            {t("channels.disconnect")}
          </Button>
        </ReadOnlyGuard>
      ) : null}

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent className="border-primary/30 bg-[#141414]">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle className="font-display uppercase tracking-[0.12em]">
              {t("channels.disconnectTitle", { unit: unit.unitName, platform: platformName })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {t("channels.disconnectBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs">{t("common:actions.cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="outlineRuby"
              onClick={confirmAndDisconnect}
              disabled={disconnect.isPending}
              className="text-xs"
            >
              {disconnect.isPending ? t("forms.saving") : t("channels.disconnect")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
