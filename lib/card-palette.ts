/** Placeholder card colors. Keep in step with `cardColors` in the Android `CardFace.kt`. */
export const CARD_COLORS = [
  "#1B3A4B",
  "#3D2B1F",
  "#1F3D2B",
  "#2C2C54",
  "#4A2C2A",
  "#14342B",
] as const;

/** Java's `String.hashCode`, so the web and the phone pick the same color. */
export function javaStringHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return hash;
}

export function cardColor(title: string) {
  const count = CARD_COLORS.length;
  const index = ((javaStringHash(title.toLowerCase()) % count) + count) % count;
  return CARD_COLORS[index];
}
