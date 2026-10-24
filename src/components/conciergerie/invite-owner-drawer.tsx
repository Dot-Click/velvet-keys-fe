import { motion, useReducedMotion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { LanguageSelect } from "@/components/auth/language-select";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Illustration } from "@/components/media/illustration";
import { MediaImage } from "@/components/media/media-image";
import { usePanelMutation, useProperties } from "@/hooks/use-portfolio-data";
import { hasErrorCode } from "@/lib/apiClient";
import { formatDate } from "@/lib/currency";
import { getInitialLanguage } from "@/lib/i18n";
import { ownersService } from "@/services/portfolio-service";
import type { AppLanguage } from "@/types/auth";
import type { InviteOwnerInput, OwnerInvite } from "@/types/portfolio";
import { DrawerField, drawerInputClassName } from "./drawer-field";

interface InviteOwnerDrawerProps {
  open: boolean;
  onClose: () => void;
}

type Errors = Partial<Record<"name" | "email", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Invite an Owner by email and hand them the properties they own. */
export function InviteOwnerDrawer({ open, onClose }: InviteOwnerDrawerProps) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const invite = usePanelMutation((input: InviteOwnerInput) => ownersService.invite(input));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage());
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  // The invite just created: the drawer shows the sent state until it is closed
  const [sent, setSent] = useState<OwnerInvite | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setPropertyIds([]);
    setErrors({});
    setSent(null);
  }

  function close() {
    reset();
    onClose();
  }

  function toggle(id: string, checked: boolean) {
    setPropertyIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = t("forms.errors.nameRequired");
    if (!EMAIL_PATTERN.test(email.trim())) next.email = t("forms.errors.emailInvalid");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    invite.mutate(
      { name: name.trim(), email: email.trim(), language, propertyIds },
      {
        onSuccess: (owner) => {
          toast.success(t("owners.invitationSent"), {
            description: t("owners.invitationSentDesc", { email: owner.email }),
          });
          setSent(owner);
        },
        onError: (error) => {
          if (hasErrorCode(error, "EMAIL_TAKEN")) {
            setErrors({ email: t("forms.errors.emailTaken") });
          } else if (hasErrorCode(error, "ACCOUNT_READ_ONLY")) {
            toast.error(t("owners.errors.readOnly"));
          } else if (hasErrorCode(error, "PROPERTY_NOT_FOUND", "OWNER_NOT_MEMBER")) {
            toast.error(t("owners.errors.propertyUnavailable"));
          } else {
            toast.error(t("common:states.errorBody"));
          }
        },
      },
    );
  }

  return (
    <DetailDrawer
      open={open}
      onClose={close}
      title={t("owners.inviteOwner")}
      subtitle={t("owners.inviteSubtitle")}
    >
      {sent ? (
        <InviteSent invite={sent} onAnother={reset} onDone={close} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <DrawerField id="owner-name" label={t("forms.fullName")} error={errors.name}>
            <Input
              id="owner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("forms.fullNamePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField id="owner-email" label={t("forms.email")} error={errors.email}>
            <Input
              id="owner-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("forms.emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              className={drawerInputClassName}
            />
          </DrawerField>

          <DrawerField id="owner-language" label={t("forms.language")}>
            <LanguageSelect id="owner-language" value={language} onChange={setLanguage} />
          </DrawerField>

          <fieldset className="space-y-2">
            <legend className="text-label-caps text-muted-foreground">
              {t("forms.assignProperties")}
            </legend>
            <p className="text-[0.68rem] text-muted-foreground">
              {t("forms.assignPropertiesHint")}
            </p>
            <PropertyPicker propertyIds={propertyIds} onToggle={toggle} />
          </fieldset>

          <ReadOnlyGuard className="flex w-full">
            <Button
              type="submit"
              disabled={invite.isPending}
              className="w-full btn-shimmer bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider h-11"
            >
              {invite.isPending ? t("forms.saving") : t("owners.sendInvitation")}
            </Button>
          </ReadOnlyGuard>
        </form>
      )}
    </DetailDrawer>
  );
}

/** Sent state: the envelope line-art draws itself, then flies off with the invitation. */
function InviteSent({
  invite,
  onAnother,
  onDone,
}: {
  invite: OwnerInvite;
  onAnother: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const reduceMotion = useReducedMotion();
  // The invite id only exists right after creating it, so this is the one place to resend from
  const resend = usePanelMutation(() => ownersService.resendInvite(invite.id));
  const email = invite.email;
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="relative grid h-40 w-full place-items-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: [0, 1, 1, 0],
                  scale: [0.92, 1, 1, 0.7],
                  x: [0, 0, 0, 140],
                  y: [0, 0, 0, -90],
                  rotate: [0, 0, -4, -14],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.3 }
              : { duration: 2.6, times: [0, 0.15, 0.62, 1], ease: [0.25, 1, 0.5, 1] }
          }
        >
          <Illustration name="invite-envelope" size={120} animate className="text-primary" />
        </motion.div>
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.7, 0], scaleX: [0, 1, 1] }}
            transition={{ delay: 1.6, duration: 1 }}
            className="absolute left-1/2 top-1/2 h-px w-40 origin-left -rotate-[32deg] bg-gradient-to-r from-primary/60 to-transparent"
          />
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 1.9, duration: 0.4 }}
        className="space-y-1.5"
      >
        <p className="font-serif text-2xl text-[#F8F9FA]">{t("owners.invitationSent")}</p>
        <p className="text-sm text-muted-foreground">{t("owners.invitationSentDesc", { email })}</p>
      </motion.div>
      <p className="text-xs text-muted-foreground">
        {t("owners.inviteExpires", { date: formatDate(invite.expiresAt) })}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <ReadOnlyGuard>
          <Button
            variant="outline"
            size="sm"
            disabled={resend.isPending}
            onClick={() =>
              resend.mutate(undefined, {
                onSuccess: () =>
                  toast.success(t("owners.resent", { email }), {
                    description: t("owners.resentBody"),
                  }),
                onError: (error) =>
                  toast.error(
                    hasErrorCode(error, "ACCOUNT_READ_ONLY")
                      ? t("owners.errors.readOnly")
                      : t("common:states.errorBody"),
                  ),
              })
            }
            className="h-9"
          >
            {t("owners.resend")}
          </Button>
        </ReadOnlyGuard>
        <Button variant="outlineGold" size="sm" onClick={onAnother} className="h-9">
          {t("owners.inviteAnother")}
        </Button>
        <Button size="sm" onClick={onDone} className="h-9 px-5">
          {t("common:actions.done")}
        </Button>
      </div>
    </div>
  );
}

/** Properties to hand to the new owner, loaded from the API with their own loading and error states. */
function PropertyPicker({
  propertyIds,
  onToggle,
}: {
  propertyIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const query = useProperties();

  return (
    <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border/70 bg-[#121212] p-2">
      {query.isError ? (
        <div role="alert" className="space-y-2 p-3 text-center text-xs text-muted-foreground">
          <p>{t("common:states.errorBody")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            {t("common:states.retry")}
          </Button>
        </div>
      ) : query.isPending ? (
        <div className="space-y-1.5" aria-busy="true" aria-label={t("common:states.loading")}>
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded-lg bg-[#181818]" />
          ))}
        </div>
      ) : query.data.length === 0 ? (
        <p className="p-3 text-center text-xs text-muted-foreground">
          {t("properties.emptyTitle")}
        </p>
      ) : (
        query.data.map((property) => (
          <label
            key={property.id}
            htmlFor={`assign-${property.id}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-[#181818]"
          >
            <Checkbox
              id={`assign-${property.id}`}
              checked={propertyIds.includes(property.id)}
              onCheckedChange={(value) => onToggle(property.id, value === true)}
            />
            <MediaImage
              kind="property"
              id={property.id}
              name={property.name}
              variant="thumb"
              className="size-9 shrink-0 rounded-md border border-border/70"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-foreground">
                {property.name}
              </span>
              <span className="block truncate text-[0.66rem] text-muted-foreground">
                {property.city}
                {property.ownerUserId
                  ? ` · ${t("forms.currentOwner", { name: property.ownerName })}`
                  : ""}
              </span>
            </span>
          </label>
        ))
      )}
    </div>
  );
}
