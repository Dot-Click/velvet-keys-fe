import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface InvoiceToCreate {
  id: string;
  tenantName: string;
  unitLabel: string;
}

const TICK_MS = 380;

/**
 * Progress for "Generate this month's invoices": the list ticks off one tenant at a time while
 * the invoices are issued, then a success state with the count.
 */
export function GenerateInvoicesDialog({
  open,
  onClose,
  month,
  items,
  run,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  items: InvoiceToCreate[];
  /** Issues the invoices; resolves with how many were created */
  run: () => Promise<number>;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl">
        {open && <Progress month={month} items={items} run={run} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function Progress({
  month,
  items: initialItems,
  run,
  onClose,
}: {
  month: string;
  items: InvoiceToCreate[];
  run: () => Promise<number>;
  onClose: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  const reduceMotion = useReducedMotion();
  // The page refreshes once the invoices exist; keep the list it opened with
  const [items] = React.useState(initialItems);
  const [ticked, setTicked] = React.useState(0);
  const [created, setCreated] = React.useState<number | null>(null);
  const [failed, setFailed] = React.useState(false);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    run().then(setCreated, () => setFailed(true));
  }, [run]);

  // Tick the list off while the write runs; the success state also waits for the result
  React.useEffect(() => {
    if (failed) return;
    if (reduceMotion && created !== null) {
      setTicked(items.length);
      return;
    }
    if (ticked >= items.length) return;
    const timer = setTimeout(() => setTicked((count) => count + 1), TICK_MS);
    return () => clearTimeout(timer);
  }, [ticked, items.length, created, failed, reduceMotion]);

  const done = created !== null && ticked >= items.length;
  const count = created ?? items.length;

  return (
    <div className="space-y-5">
      <DialogHeader className="space-y-1.5 pe-8 text-start rtl:ps-8 sm:text-start">
        <DialogTitle className="font-serif text-2xl normal-case tracking-normal text-foreground">
          {done
            ? t("rentInvoices.generateModal.doneTitle", { count, month })
            : t("rentInvoices.generateModal.title", { count: items.length || count })}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {done ? t("rentInvoices.generateModal.doneBody") : month}
        </DialogDescription>
      </DialogHeader>

      {failed ? (
        <p
          role="alert"
          className="rounded-xl border border-[#FF85A1]/40 bg-destructive/15 p-4 text-sm text-[#FF85A1]"
        >
          {t("rentInvoices.generateModal.failed")}
        </p>
      ) : (
        <>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{
                width: `${items.length ? (ticked / items.length) * 100 : done ? 100 : 30}%`,
              }}
              transition={{ duration: 0.35, ease: LUXURY_EASE }}
            />
          </div>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pe-1" aria-live="polite">
            {items.map((item, index) => {
              const finished = index < ticked;
              const active = index === ticked && !done;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors",
                    finished
                      ? "border-[#A2E8DD]/30 bg-[#A2E8DD]/[0.06]"
                      : active
                        ? "border-primary/40 bg-primary/[0.06]"
                        : "border-border/50 opacity-50",
                  )}
                >
                  <span className="grid size-5 shrink-0 place-items-center">
                    <AnimatePresence mode="wait" initial={false}>
                      {finished ? (
                        <motion.span
                          key="done"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[#A2E8DD]"
                        >
                          <Check className="size-4" aria-hidden="true" />
                        </motion.span>
                      ) : active ? (
                        <Loader2
                          key="busy"
                          className="size-4 animate-spin text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          key="wait"
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{item.tenantName}</span>
                  <span className="truncate text-muted-foreground">{item.unitLabel}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant={done || failed ? "default" : "ghost"}
          disabled={!done && !failed}
          onClick={onClose}
          className="h-9 px-5"
        >
          {done || failed
            ? t("rentInvoices.generateModal.close")
            : t("rentInvoices.generateModal.working")}
        </Button>
      </div>
    </div>
  );
}
