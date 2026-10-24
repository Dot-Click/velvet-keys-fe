import { z } from "zod";

/**
 * Schemas return i18n keys (auth namespace) as messages; forms translate them on render.
 */

export const PASSWORD_MIN_LENGTH = 8;

const emailSchema = z.string().trim().email("validation.emailInvalid");

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "validation.passwordTooShort")
  .refine((value) => /[A-Za-z؀-ۿ]/.test(value) && /\d/.test(value), "validation.passwordWeak");

const languageSchema = z.enum(["en", "fr", "ar"]);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]+$/, "validation.phoneInvalid")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 9 && digits <= 15;
  }, "validation.phoneInvalid");

const passwordPair = {
  password: passwordSchema,
  confirmPassword: z.string().min(1, "validation.passwordRequired"),
};

function passwordsMatch(values: { password: string; confirmPassword: string }) {
  return values.password === values.confirmPassword;
}

const mismatch = { path: ["confirmPassword"], message: "validation.passwordMismatch" };

export const signupDetailsSchema = z
  .object({
    role: z.enum(["owner", "conciergerie"]),
    fullName: z.string().trim().min(2, "validation.fullNameRequired"),
    companyName: z.string().trim(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    language: languageSchema,
    acceptTerms: z.boolean().refine((value) => value, "validation.termsRequired"),
  })
  .superRefine((values, ctx) => {
    if (values.role === "conciergerie" && values.companyName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "validation.companyRequired",
      });
    }
  });

export type SignupDetailsValues = z.infer<typeof signupDetailsSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object(passwordPair).refine(passwordsMatch, mismatch);

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const acceptInvitationSchema = z
  .object({
    name: z.string().trim().min(2, "validation.fullNameRequired"),
    ...passwordPair,
    language: languageSchema,
  })
  .refine(passwordsMatch, mismatch);

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "validation.fullNameRequired"),
  phone: phoneSchema,
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.currentPasswordRequired"),
    ...passwordPair,
  })
  .refine(passwordsMatch, mismatch)
  .refine((values) => values.password !== values.currentPassword, {
    path: ["password"],
    message: "validation.passwordUnchanged",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

/** 0–4 score for the strength meter; independent of the minimum rules above. */
export function scorePassword(password: string): { score: number; level: PasswordStrengthLevel } {
  if (!password) return { score: 0, level: "empty" };
  let points = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 1) return { score: 1, level: "weak" };
  if (points === 2) return { score: 2, level: "fair" };
  if (points === 3) return { score: 3, level: "good" };
  return { score: 4, level: "strong" };
}
