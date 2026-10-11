export const TAP_ORIGIN = "https://smart-tap-woad.vercel.app";

export function tapUrl(publicId: string) {
  return `${TAP_ORIGIN}/t/${publicId}`;
}
