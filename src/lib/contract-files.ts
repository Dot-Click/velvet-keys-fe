/**
 * Uploaded contracts are kept as data URLs in the demo store, which lives in the browser
 * session, so they stay small. A real API would upload the file and keep its URL.
 */
export const MAX_CONTRACT_BYTES = 2 * 1024 * 1024;

export type ContractFileError = "not_pdf" | "too_large" | "unreadable";

export class ContractReadError extends Error {
  readonly code: ContractFileError;

  constructor(code: ContractFileError) {
    super(code);
    this.name = "ContractReadError";
    this.code = code;
  }
}

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** Reads an uploaded contract PDF as a data URL. */
export function readPdfFile(file: File): Promise<string> {
  if (!isPdfFile(file)) return Promise.reject(new ContractReadError("not_pdf"));
  if (file.size > MAX_CONTRACT_BYTES) return Promise.reject(new ContractReadError("too_large"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result.replace(/^data:[^;,]*/, "data:application/pdf"))
        : reject(new ContractReadError("unreadable"));
    reader.onerror = () => reject(new ContractReadError("unreadable"));
    reader.readAsDataURL(file);
  });
}

/** Turns a base64 data URL back into a file, so the browser can preview it from a blob URL. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta = "", payload = ""] = dataUrl.split(",");
  const type = meta.slice(5).split(";")[0] || "application/pdf";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}
