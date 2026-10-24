import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { authInputClassName } from "./auth-field";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<"input">, "type">>(
  ({ className, ...props }, ref) => {
    const { t } = useTranslation("auth");
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(authInputClassName, "pe-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t("fields.hidePassword") : t("fields.showPassword")}
          aria-pressed={visible}
          className="absolute inset-y-0 end-0 grid w-12 place-items-center rounded-e-xl text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
