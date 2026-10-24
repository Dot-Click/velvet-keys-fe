export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ImageReadError = "not_image" | "too_large" | "unreadable";

export class ImageFileError extends Error {
  readonly code: ImageReadError;

  constructor(code: ImageReadError) {
    super(code);
    this.name = "ImageFileError";
    this.code = code;
  }
}

/**
 * Reads an uploaded photo as a JPEG data URL, scaled down so its longest side is at most
 * `maxSize` pixels. Keeps mock uploads small enough to store in the browser session.
 */
export async function readImageFile(file: File, maxSize = 1600): Promise<string> {
  if (!file.type.startsWith("image/")) throw new ImageFileError("not_image");
  if (file.size > MAX_IMAGE_BYTES) throw new ImageFileError("too_large");
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new ImageFileError("unreadable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    if (error instanceof ImageFileError) throw error;
    throw new ImageFileError("unreadable");
  }
}
