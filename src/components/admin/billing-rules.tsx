import { Bell, CalendarClock, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { INVOICE_DUE_DAYS, PAYMENT_REMINDER_DAY, READ_ONLY_DAY } from "@/lib/billing";
import { formatNumber } from "@/lib/currency";

/** The payment schedule every subscription invoice follows. Fixed, so shown but not editable. */
export function BillingRules() {
  const { t } = useTranslation("admin");
  const rules = [
    {
      icon: <CalendarClock className="size-4" aria-hidden="true" />,
      label: t("settings.rules.due"),
      value: t("settings.rules.dueValue", { days: formatNumber(INVOICE_DUE_DAYS) }),
    },
    {
      icon: <Bell className="size-4" aria-hidden="true" />,
      label: t("settings.rules.reminder"),
      value: t("settings.rules.reminderValue", { day: formatNumber(PAYMENT_REMINDER_DAY) }),
    },
    {
      icon: <Lock className="size-4" aria-hidden="true" />,
      label: t("settings.rules.readOnly"),
      value: t("settings.rules.readOnlyValue", { day: formatNumber(READ_ONLY_DAY) }),
    },
  ];

  return (
    <div className="rounded-lg border border-border/80 bg-[#121212] px-4 py-2">
      <dl className="divide-y divide-border/50">
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-center gap-3 py-2.5">
            <span className="text-primary">{rule.icon}</span>
            <dt className="flex-1 text-muted-foreground">{rule.label}</dt>
            <dd className="font-medium text-foreground">{rule.value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border/50 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {t("settings.rules.hint")}
      </p>
    </div>
  );
}
