import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OwnerAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-primary/40 bg-[#1C1A14] font-mono font-bold text-primary",
        size === "sm" && "size-7 text-[0.6rem]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-16 text-lg",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
