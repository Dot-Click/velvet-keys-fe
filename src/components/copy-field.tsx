import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SuccessCheck } from "@/components/motion/success-check";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A value people need to type elsewhere, such as a RIB or a transfer reference, with a copy button. */
export function CopyField({
  value,
  label,
  copiedMessage,
  className,
  animated = false,
}: {
  value: string;
  /** Accessible name of the copy button, e.g. "Copy RIB" */
  label: string;
  copiedMessage: string;
  className?: string;
  /** The check draws itself in and the button glows jade once copied */
  animated?: boolean;
}) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await writeClipboard(value);
      setCopied(true);
      toast.success(copiedMessage);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("actions.copyFailed"));
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-primary/30 bg-[#111111] p-2 ps-3",
        className,
      )}
    >
      <span className="min-w-0 flex-1 break-all font-mono text-sm text-foreground" dir="ltr">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void copy()}
        aria-label={label}
        className={cn(
          "h-9 shrink-0 text-[0.68rem] uppercase tracking-wider transition-colors",
          animated && copied && "border-[#A2E8DD]/60 text-[#A2E8DD]",
        )}
      >
        {copied && animated ? (
          <SuccessCheck className="size-3.5 text-[#A2E8DD]" />
        ) : copied ? (
          <Check className="size-3.5 text-[#A2E8DD]" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        {copied ? t("actions.copied") : t("actions.copy")}
      </Button>
    </div>
  );
}

/** Clipboard API first; embedded previews often block it, so fall back to a hidden selection. */
export async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Fall through to the selection-based copy
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy failed");
}
