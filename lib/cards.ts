export type CardRecord = {
  id: number;
  title: string;
  destinationUrl: string;
  publicId: string;
  deletedAt: string | null;
  updatedAt: string;
};

export type CardActionState = { error: string } | { ok: true } | null;

const TITLE_MAX = 80;

export function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseCardFields(
  formData: FormData,
): { title: string; destinationUrl: string } | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const destinationUrl = httpsUrl(
    String(formData.get("destination") ?? "").trim(),
  );

  if (title.length < 1 || title.length > TITLE_MAX) {
    return { error: "Give the card a title, up to 80 characters." };
  }
  if (!destinationUrl) {
    return { error: "The destination has to be an https link." };
  }
  return { title, destinationUrl };
}

export function parseCardId(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) {
    return null;
  }
  return Number(id);
}
