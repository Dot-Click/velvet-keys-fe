import * as React from "react";
import { FileText, FileUp, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/currency";
import { isApiError } from "@/lib/apiClient";
import { filesService } from "@/services/ops-service";
import { cn } from "@/lib/utils";

/** Matches the backend's allowed contract type and size limit (app/services/files.py). */
const ACCEPTED_TYPES = ["application/pdf"];
const MAX_CONTRACT_BYTES = 15 * 1024 * 1024;

/** Backend codes that have their own message (forms.upload.errors.<CODE>). */
const EXPLAINED_CODES = [
  "FILE_TOO_LARGE",
  "FILE_TYPE_NOT_ALLOWED",
  "R2_NOT_CONFIGURED",
  "UPLOAD_NOT_FOUND",
  "ACCOUNT_READ_ONLY",
];

export interface ContractFile {
  /** Id of the uploaded file on the backend, sent as `contractFileId` when creating the lease. */
  fileId: string;
  name: string;
  size: number;
}

interface ContractUploadFieldProps {
  id: string;
  value: ContractFile | null;
  onChange: (value: ContractFile | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  /** Already translated */
  error?: string | undefined;
}

/**
 * PDF picker that uploads straight to storage (presigned URL, same flow as photo uploads). The
 * contract is not previewable locally once uploaded -- only its name and size are shown; the
 * lease detail page previews it afterwards via the signed download URL.
 */
export function ContractUploadField({
  id,
  value,
  onChange,
  onUploadingChange,
  error,
}: ContractUploadFieldProps) {
  const { t } = useTranslation("conciergerie");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(t("forms.upload.errors.FILE_TYPE_NOT_ALLOWED"));
      return;
    }
    if (file.size > MAX_CONTRACT_BYTES) {
      setUploadError(t("forms.upload.errors.FILE_TOO_LARGE"));
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const fileId = await filesService.upload(file, "contract");
      onChange({ fileId, name: file.name, size: file.size });
    } catch (caught) {
      const code = isApiError(caught) ? caught.code : "";
      setUploadError(
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

  const message = uploadError ?? error;

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#A2E8DD]/40 bg-[#A2E8DD]/5 p-3">
          <FileText className="size-8 shrink-0 text-[#A2E8DD]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-[0.68rem] text-muted-foreground">
              {formatFileSize(value.size / 1024)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-8 text-[0.68rem] uppercase tracking-wider"
          >
            {t("forms.replaceImage")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading}
            onClick={() => onChange(null)}
            aria-label={t("forms.removeImage")}
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFile(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/10"
              : message
                ? "border-destructive/60 bg-destructive/5"
                : "border-border/80 bg-[#121212] hover:border-primary/50",
          )}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <FileUp className="size-8 text-primary" aria-hidden="true" />
          )}
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              {t("leaseForm.contractDrop")}
            </span>
            <span className="block text-[0.68rem] text-muted-foreground">
              {t("leaseForm.contractHint", { size: formatFileSize(MAX_CONTRACT_BYTES / 1024) })}
            </span>
          </span>
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {message && (
        <p role="alert" className="text-xs text-destructive-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
