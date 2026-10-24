import { initialsOf } from "@/lib/media";
import { cn } from "@/lib/utils";

const SIZE = { sm: "size-8 text-[0.68rem]", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;
const TONE = {
  gold: "border-primary/40 bg-[#1C1A14] text-primary",
  jade: "border-[#A2E8DD]/40 bg-[#101A18] text-[#A2E8DD]",
} as const;

/** Round avatar with a person's initials in Cormorant. */
export function InitialsAvatar({
  name,
  size = "md",
  tone = "gold",
  className,
}: {
  name: string;
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full border font-['Cormorant_Garamond',Georgia,serif] leading-none",
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {/* Letters only, so "Marc & Hélène Dubois" reads "MH" */}
      {initialsOf(name.replace(/[^\p{L}\s'’-]/gu, " ")).slice(0, 2)}
    </span>
  );
}
