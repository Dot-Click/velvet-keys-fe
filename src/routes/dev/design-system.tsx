import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  ArchitecturalDoorway,
  ArchitecturalTools,
  ArchitecturalLedger,
  ArchitecturalArch404,
} from "@/components/illustrations/architectural-illustrations";
import { formatMAD } from "@/lib/currency";

export const Route = createFileRoute("/dev/design-system")({
  // Development tooling: not served by production builds
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Design System & Primitives (Dev Only) — Velvet Keys" },
      {
        name: "description",
        content: "Quiet luxury design tokens, foundation primitives, and base component library.",
      },
    ],
  }),
  component: DevDesignSystemPage,
});

function DevDesignSystemPage() {
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(
    new Date("2026-10-15T00:00:00"),
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: new Date("2026-10-18T00:00:00"),
    to: new Date("2026-10-24T00:00:00"),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDropdownVal, setActiveDropdownVal] = useState("aurora");
  const [showLogoLoader, setShowLogoLoader] = useState(false);

  const triggerToast = (type: "gold" | "ruby" | "jade") => {
    if (type === "gold") {
      toast("Portfolio Telemetry Synchronized", {
        description: `Gross revenue of ${formatMAD(349800)} verified across all Moroccan units.`,
        action: {
          label: "View Ledger",
          onClick: () => console.log("Ledger clicked"),
        },
      });
    } else if (type === "jade") {
      toast.success("Stay Confirmed & Locked", {
        description: "VIP Resident Sophia Laurent check-in finalized for Penthouse 4A.",
      });
    } else {
      toast.error("Critical Pressure Warning Dispatched", {
        description: "Chiller compressor valve triggered immediate engineer dispatch.",
      });
    }
  };

  return (
    <AppShell>
      <div className="reveal-up mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 space-y-16">
        {/* System Header */}
        <div className="border-b border-border/80 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-primary">
            <Compass className="size-3" />
            <span>Developer Component Lab · Internal Reference</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-[0.14em] text-foreground">
            Design System Lab
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
            Quiet luxury tokens, typography, architectural line art, motion easing, and Moroccan
            Dirham components.
          </p>
        </div>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="text-label-caps text-primary">Foundational Tokens</p>
            <h2 className="font-display text-2xl uppercase tracking-[0.12em] text-foreground">
              Color Architecture
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-border/60 bg-[#0B0B0B] p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#0B0B0B] border border-border" />
              <div>
                <p className="text-xs font-semibold text-foreground">Deep Charcoal</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">#0B0B0B · Canvas</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-[#141414] p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#141414] border border-border" />
              <div>
                <p className="text-xs font-semibold text-foreground">Surface Card</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">#141414 · Card</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
              <div>
                <p className="text-xs font-semibold text-[#D4AF37]">Burnished Gold</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">#D4AF37 · Primary</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#8B002B] shadow-[0_0_20px_rgba(139,0,43,0.3)]" />
              <div>
                <p className="text-xs font-semibold text-[#FF85A1]">Muted Ruby</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">
                  #8B002B · Destructive
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#A2E8DD] shadow-[0_0_20px_rgba(162,232,221,0.3)]" />
              <div>
                <p className="text-xs font-semibold text-[#A2E8DD]">Jade Mint</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">#A2E8DD · Success</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="h-14 rounded-lg bg-[#F8F9FA]" />
              <div>
                <p className="text-xs font-semibold text-foreground">Bone White</p>
                <p className="text-[0.65rem] font-mono text-muted-foreground">
                  #F8F9FA · Foreground
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Toasts & Feedback */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="text-label-caps text-primary">Micro-Interactions</p>
            <h2 className="font-display text-2xl uppercase tracking-[0.12em] text-foreground">
              Luxury Sonner Toasts
            </h2>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => triggerToast("gold")}
              className="btn-shimmer bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold"
            >
              Trigger Gold Progress Toast
            </Button>
            <Button
              onClick={() => triggerToast("jade")}
              className="bg-[#A2E8DD] text-[#0B0B0B] hover:brightness-110 text-xs uppercase tracking-wider font-semibold"
            >
              Trigger Jade Success Toast
            </Button>
            <Button
              onClick={() => triggerToast("ruby")}
              className="bg-destructive text-destructive-foreground hover:brightness-110 text-xs uppercase tracking-wider font-semibold"
            >
              Trigger Ruby Warning Toast
            </Button>
          </div>
        </section>

        {/* 3. Architectural Illustrations Demo */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="text-label-caps text-primary">Architectural Identity</p>
            <h2 className="font-display text-2xl uppercase tracking-[0.12em] text-foreground">
              Bespoke Line-Art SVGs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 text-center space-y-4">
              <div className="flex justify-center">
                <ArchitecturalDoorway className="size-24" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Doorway &amp; Transom
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 text-center space-y-4">
              <div className="flex justify-center">
                <ArchitecturalTools className="size-24" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Engineering Compass
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 text-center space-y-4">
              <div className="flex justify-center">
                <ArchitecturalLedger className="size-24" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Cadastral Ledger
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 text-center space-y-4">
              <div className="flex justify-center">
                <ArchitecturalArch404 className="size-24" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Uncharted Horizon Arch
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
