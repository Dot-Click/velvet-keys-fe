import { BrushCleaning, LogIn, LogOut, type LucideIcon } from "lucide-react";
import type { TodayItemKind } from "./today-items";

/** Icon, chip colours and micro-animation for each kind of task on the day. */
export const TASK_META: Record<
  TodayItemKind,
  { icon: LucideIcon; chip: string; text: string; motion: string }
> = {
  check_in: {
    icon: LogIn,
    chip: "border-primary/40 bg-primary/10 text-primary",
    text: "text-primary",
    motion: "icon-nudge",
  },
  check_out: {
    icon: LogOut,
    chip: "border-[#E8C9A8]/30 bg-[#E8C9A8]/8 text-[#E8C9A8]",
    text: "text-[#E8C9A8]",
    motion: "icon-nudge",
  },
  housekeeping: {
    icon: BrushCleaning,
    chip: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
    text: "text-[#A2E8DD]",
    motion: "icon-wiggle",
  },
};

export const TASK_KINDS: TodayItemKind[] = ["check_in", "check_out", "housekeeping"];
