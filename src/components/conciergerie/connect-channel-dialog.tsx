import * as React from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { LogoMark } from "@/components/brand";
import { ChannelMark } from "@/components/conciergerie/channel-badges";
import type { ChannelUnitRow } from "@/components/conciergerie/channels/channel-unit-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { channexErrorKey } from "@/lib/channex-errors";
import { channexService } from "@/services/channex-service";
import type { ChannelPlatform } from "@/types/channel";
import type { Channel, ConnectChannelResult } from "@/types/channex";

export type ConnectMode = "connect" | "reconnect";

/** Maps a real Channex channel to the display/i18n platform key the rest of the UI already uses. */
function displayPlatform(channel: Channel): ChannelPlatform {
  return channel === "booking" ? "bookingCom" : "airbnb";
}

interface ConnectChannelDialogProps {
  unit: ChannelUnitRow | null;
  mode: ConnectMode;
  channel: Channel;
  /** The errored connection being replaced; required when `mode` is "reconnect". */
  connectionId?: string;
  onClose: () => void;
}

/**
 * Starts (or restarts) one unit's connection to one channel. Unlike the old mocked flow, Channex
 * owns sign-in and listing mapping entirely on its own hosted page -- the backend only ever hands
 * back a `channexAuthUrl`, so this dialog's whole job is to kick that off in a new tab and explain
 * what happens next. The unit's card (ChannelUnitCard) polls `useUnitConnections` on its own and
 * updates itself once Channex marks the connection active, so this dialog never has to wait for
 * that to happen.
 */
export function ConnectChannelDialog({
  unit,
  mode,
  channel,
  connectionId,
  onClose,
}: ConnectChannelDialogProps) {
  return (
    <Dialog open={Boolean(unit)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-primary/30 bg-[#141414] sm:rounded-2xl">
        {unit && (
          <ConnectFlow
            key={`${unit.unitId}:${mode}:${channel}`}
            unit={unit}
            mode={mode}
            channel={channel}
            connectionId={connectionId}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectFlow({
  unit,
  mode,
  channel,
  connectionId,
  onClose,
}: {
  unit: ChannelUnitRow;
  mode: ConnectMode;
  channel: Channel;
  connectionId: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [step, setStep] = React.useState<"intro" | "redirected">("intro");
  const [authUrl, setAuthUrl] = React.useState<string | null>(null);
  const platform = displayPlatform(channel);
  const platformName = t(`channels.platform.${platform}`);
  const unitLabel = unit.unitName;

  const connect = usePanelMutation((_: void) => {
    // Reconnecting after an error: the backend allows only one non-disconnected connection per
    // unit/channel, so the old one must be cleared before a fresh authorization can start.
    if (mode === "reconnect" && connectionId) {
      return channexService
        .disconnect(connectionId)
        .then(() => channexService.connect(unit.unitId, channel));
    }
    return channexService.connect(unit.unitId, channel);
  });

  function start() {
    connect.mutate(undefined, {
      onSuccess: (result: ConnectChannelResult) => {
        setAuthUrl(result.channexAuthUrl);
        setStep("redirected");
        // External redirect by design: Channex's hosted page is where the manager actually signs
        // in to Airbnb/Booking.com and picks the listing; we never see those credentials.
        window.open(result.channexAuthUrl, "_blank", "noopener,noreferrer");
        toast.success(
          t(
            mode === "reconnect" ? "channels.dialog.reconnectedToast" : "channels.dialog.connectedToast",
            { unit: unitLabel, platform: platformName },
          ),
        );
      },
      onError: (error) => toast.error(t(channexErrorKey(error))),
    });
  }

  return (
    <>
      <DialogHeader className="space-y-3 pe-8 text-start rtl:ps-8 sm:text-start">
        <DialogTitle className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
          {t(mode === "reconnect" ? "channels.dialog.reconnectTitle" : "channels.dialog.title", {
            unit: unitLabel,
          })}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {unit.propertyName}
        </DialogDescription>
      </DialogHeader>

      {step === "intro" ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-[#161616] p-4">
            <ChannelMark platform={platform} className="size-8 rounded-lg text-sm" />
            <div className="min-w-0 space-y-0.5">
              <p className="font-serif text-base font-semibold text-foreground">{platformName}</p>
              <p className="truncate text-[0.7rem] text-muted-foreground">{unitLabel}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(mode === "reconnect" ? "channels.dialog.reconnectIntro" : "channels.dialog.intro", {
              brand: t("common:brand.name"),
              platform: platformName,
              unit: unitLabel,
            })}
          </p>
          {connect.isError && (
            <p role="alert" className="text-xs text-destructive-foreground">
              {t(channexErrorKey(connect.error))}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              {t("common:actions.cancel")}
            </Button>
            <ReadOnlyGuard>
              <Button
                size="sm"
                onClick={start}
                disabled={connect.isPending}
                className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
              >
                {connect.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                )}
                {connect.isPending
                  ? t("channels.dialog.opening", { platform: platformName })
                  : t("channels.dialog.continueButton", { platform: platformName })}
              </Button>
            </ReadOnlyGuard>
          </div>
        </div>
      ) : (
        <div className="space-y-5 text-center">
          <div
            dir="ltr"
            className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-primary/60 shadow-[0_0_18px_rgba(212,175,55,0.2)]"
          >
            <LogoMark size="sm" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {t("channels.dialog.redirectedTitle", { platform: platformName })}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("channels.dialog.redirectedBody", { platform: platformName, unit: unitLabel })}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            {authUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(authUrl, "_blank", "noopener,noreferrer")}
                className="text-xs"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {t("channels.dialog.reopen", { platform: platformName })}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onClose}
              className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
            >
              {t("channels.dialog.done")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
