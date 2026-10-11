export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 12_000_000;

/** Null when the file can be cropped onto a card. */
export function imageFileProblem(file: { type: string; size: number }) {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Use a PNG, JPEG, or WebP image.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "That image is larger than 12 MB.";
  }
  return null;
}
