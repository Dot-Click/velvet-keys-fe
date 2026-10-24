import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, CalendarCheck, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/brand";
import { formatMAD } from "@/lib/currency";
import { LUXURY_EASE } from "@/lib/motion";
import { Pill } from "./landing-mockups";
import { useLandingLocale } from "./use-landing-locale";

const COMMISSION_PCT = 20;

/** Monochrome marks of the two platforms; they take the colour of the text around them. */
function AirbnbMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 6c-3 0-5.2 2.2-6.6 5L8.5 31.5C6.2 36.5 8.8 42 14 42c3.6 0 6.4-2 10-6.5 3.6 4.5 6.4 6.5 10 6.5 5.2 0 7.8-5.5 5.5-10.5L30.6 11C29.2 8.2 27 6 24 6Z" />
      <circle cx="24" cy="29" r="4.5" />
    </svg>
  );
}

function BookingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="36" height="36" rx="9" />
      <path d="M18 14v20h7.5c4 0 6.5-2.2 6.5-5.5S29.5 23 25.5 23H18M18 23h6.5c3 0 5-1.8 5-4.5S27.5 14 24.5 14H18" />
      <circle cx="36.5" cy="35" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A thin line with dots travelling both ways along it, to show that the sync runs in two directions. */
function Connector({ animate }: { animate: boolean }) {
  return (
    <div className="relative h-px min-w-6 flex-1 bg-gradient-to-r from-white/10 via-primary/45 to-white/10">
      {animate ? (
        <>
          <motion.span
            className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.8)]"
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#FFF1BE] shadow-[0_0_10px_rgba(255,241,190,0.7)]"
            animate={{ left: ["100%", "0%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: 1.2 }}
          />
        </>
      ) : (
        <span className="absolute start-1/2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
    </div>
  );
}

function PlatformNode({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-[#0B0B0B] text-[#F8F9FA]/75 shadow-[0_10px_30px_rgba(0,0,0,0.6)] sm:size-20">
        {children}
      </div>
      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-muted-foreground">
        {name}
      </span>
    </div>
  );
}

/**
 * Bookings, availability and rates moving between Airbnb, Booking.com and Velvet Keys. The platform
 * marks stay monochrome and the Velvet Keys mark sits in the middle with a gold pulse.
 */
export function ConnectedStripSection() {
  const { t } = useTranslation("landing");
  const { dayOfMonth } = useLandingLocale();
  const reduced = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement>(null);
  const visible = useInView(sectionRef, { margin: "-20% 0px" });
  const animate = !reduced && visible;

  const events = [
    {
      id: "airbnb",
      inbound: true,
      title: t("channels.events.booking", { platform: "Airbnb" }),
      detail: t("channels.events.stay", { property: "The Aurora", nights: 5 }),
      amount: formatMAD(5_900),
      commission: formatMAD((5_900 * COMMISSION_PCT) / 100),
    },
    {
      id: "booking",
      inbound: true,
      title: t("channels.events.booking", { platform: "Booking.com" }),
      detail: t("channels.events.stay", { property: "Marina House", nights: 3 }),
      amount: formatMAD(3_540),
      commission: formatMAD((3_540 * COMMISSION_PCT) / 100),
    },
    {
      id: "availability",
      inbound: false,
      title: t("channels.events.availability"),
      detail: t("channels.events.blocked", {
        property: "Harbour House",
        from: dayOfMonth(12),
        to: dayOfMonth(15),
      }),
    },
    {
      id: "rate",
      inbound: false,
      title: t("channels.events.rate"),
      detail: t("channels.events.rateDetail", { property: "The Aurora", amount: formatMAD(1_450) }),
    },
  ];

  // Walk through the events one after another, so the page always looks like it is mid-sync
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (!animate) return;
    const timer = setInterval(() => setActive((prev) => (prev + 1) % events.length), 3200);
    return () => clearInterval(timer);
  }, [animate, events.length]);

  const points = [
    { icon: ArrowLeftRight, key: "twoWay" },
    { icon: CalendarCheck, key: "noDoubleBookings" },
    { icon: Coins, key: "commission" },
  ] as const;

  return (
    <section
      id="channels"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-border/70 bg-[#0B0B0B] px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto size-[620px] -translate-y-1/2 rounded-full bg-primary/4 blur-[180px]" />

      <div className="mx-auto max-w-5xl space-y-14">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">
            {t("channels.kicker")}
          </p>
          <h2 className="font-display text-3xl uppercase tracking-[0.12em] text-foreground sm:text-5xl">
            {t("channels.title")}
          </h2>
          <p className="text-[15px] font-light leading-relaxed text-muted-foreground sm:text-base">
            {t("channels.subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/25 bg-[#141414] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.85)] sm:p-8">
          {/* The two platforms and Velvet Keys; kept left to right so the sync reads the same in every language */}
          <div dir="ltr" className="flex items-center justify-between gap-2 sm:gap-6">
            <PlatformNode name="Airbnb">
              <AirbnbMark className="size-8 sm:size-10" />
            </PlatformNode>

            <Connector animate={animate} />

            <div className="relative flex flex-col items-center gap-3">
              <div className="relative grid size-20 place-items-center rounded-full border border-primary/50 bg-[#0B0B0B] shadow-[0_0_40px_rgba(212,175,55,0.25)] sm:size-24">
                {animate && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/60"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: LUXURY_EASE }}
                  />
                )}
                <LogoMark size="md" />
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-primary whitespace-nowrap">
                {t("channels.brand")}
              </span>
            </div>

            <Connector animate={animate} />

            <PlatformNode name="Booking.com">
              <BookingMark className="size-8 sm:size-10" />
            </PlatformNode>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#A2E8DD]">
            <span className="relative flex size-2">
              {animate && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#A2E8DD]/60" />
              )}
              <span className="relative inline-flex size-2 rounded-full bg-[#A2E8DD]" />
            </span>
            {t("channels.status")}
          </div>

          {/* What the sync is doing right now, with the money it brings in */}
          <div className="mt-8 space-y-2 border-t border-border/60 pt-6">
            {events.map((event, index) => {
              const isActive = index === active;
              return (
                <div
                  key={event.id}
                  className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-xs transition-all duration-500 ${
                    isActive
                      ? "border-primary/40 bg-primary/[0.06] opacity-100"
                      : "border-border/50 bg-[#0B0B0B]/60 opacity-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Pill tone={event.inbound ? "jade" : "gold"}>
                      {event.inbound ? t("channels.inbound") : t("channels.outbound")}
                    </Pill>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{event.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{event.detail}</p>
                    </div>
                  </div>
                  {event.amount && (
                    <div className="text-end font-mono">
                      <p className="text-foreground">{event.amount}</p>
                      <p className="text-[11px] text-primary">
                        {t("channels.events.commission", {
                          pct: COMMISSION_PCT,
                          amount: event.commission,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {points.map(({ icon: Icon, key }) => (
            <div key={key} className="space-y-3">
              <div className="grid size-10 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                {t(`channels.points.${key}.title`)}
              </h3>
              <p className="text-sm font-light leading-relaxed text-muted-foreground">
                {t(`channels.points.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
