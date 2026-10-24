import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useFileUrl } from "@/hooks/use-file-url";
import { isApiError } from "@/lib/apiClient";
import { hasCapability } from "@/lib/roles";
import { filesService } from "@/services/ops-service";
import type { FilePurpose } from "@/types/ops";

/** Matches the backend's allowed image types and size limit (app/services/files.py). */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Backend codes that have their own message (forms.upload.errors.<CODE>). */
const EXPLAINED_CODES = [
  "FILE_TOO_LARGE",
  "FILE_TYPE_NOT_ALLOWED",
  "R2_NOT_CONFIGURED",
  "UPLOAD_NOT_FOUND",
  "ACCOUNT_READ_ONLY",
];

interface ImageUploadFieldProps {
  id: string;
  label: string;
  purpose: Extract<FilePurpose, "property_image" | "unit_image">;
  /** Id of the stored photo, null when there is none */
  value: string | null;
  /** Called with the new file id once the upload is confirmed, or null when the photo is removed */
  onChange: (fileId: string | null) => void;
  /** Lets the form hold its submit button while a photo is on its way */
  onUploadingChange?: (uploading: boolean) => void;
  /** Shown faded when nothing is uploaded, e.g. the property photo for a new unit */
  fallback?: ReactNode;
}

/**
 * Photo picker that uploads straight to storage. The chosen photo shows at once from the local
 * file; its id is reported only after the backend confirmed the upload. Needs the operations
 * capability, so it renders nothing without it.
 */
export function ImageUploadField(props: ImageUploadFieldProps) {
  const { session } = useAuth();
  if (!session || !hasCapability(session.profile, "operations")) return null;
  return <UploadField {...props} />;
}

function UploadField({
  id,
  label,
  purpose,
  value,
  onChange,
  onUploadingChange,
  fallback,
}: ImageUploadFieldProps) {
  const { t } = useTranslation("conciergerie");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const remote = useFileUrl(value);

  // Release the local preview when it is replaced or the field goes away
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // The form was reset or the photo removed: forget the local preview
  useEffect(() => {
    if (!value) setLocalPreview(null);
  }, [value]);

  const preview = localPreview ?? remote.data ?? null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("forms.upload.errors.FILE_TYPE_NOT_ALLOWED"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("forms.upload.errors.FILE_TOO_LARGE"));
      return;
    }
    const previous = localPreview;
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    onUploadingChange?.(true);
    try {
      onChange(await filesService.upload(file, purpose));
    } catch (caught) {
      // Keep whatever photo was there before
      setLocalPreview(previous);
      const code = isApiError(caught) ? caught.code : "";
      setError(
        t(
          EXPLAINED_CODES.includes(code)
            ? `forms.upload.errors.${code}`
            : "forms.upload.errors.generic",
        ),
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-caps text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 bg-[#121212] p-3">
        <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/70 bg-[#161616]">
          {preview ? (
            <img src={preview} alt={t("forms.imagePreview")} className="size-full object-cover" />
          ) : fallback ? (
            <div className="size-full opacity-40">{fallback}</div>
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-black/60">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[0.68rem] text-muted-foreground" aria-live="polite">
            {uploading
              ? t("forms.upload.uploading")
              : value
                ? t("forms.upload.uploaded")
                : t("forms.imageHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="h-8 text-[0.68rem] uppercase tracking-wider"
            >
              <ImagePlus className="size-3.5" />
              {value ? t("forms.replaceImage") : t("forms.uploadImage")}
            </Button>
            {value && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
                className="h-8 text-[0.68rem] uppercase tracking-wider"
              >
                <X className="size-3.5" />
                {t("forms.removeImage")}
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
