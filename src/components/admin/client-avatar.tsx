import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? [words[0]![0], words[1]![0]] : [...(words[0] ?? "?")].slice(0, 2);
  return letters.join("").toUpperCase();
}

/** Initials in a gold-outline circle, used wherever a client is listed. */
export function ClientAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-primary/60 bg-primary/5 font-semibold text-primary",
        size === "sm" && "size-7 text-[0.62rem]",
        size === "md" && "size-8 text-[0.7rem]",
        size === "lg" && "size-12 text-base",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
