export type CardRecord = {
  id: number;
  title: string;
  destinationUrl: string;
  publicId: string;
  deletedAt: string | null;
  updatedAt: string;
  imageUrl: string | null;
  backImageUrl: string | null;
};

export type CardActionState = { error: string } | { ok: true } | null;

const TITLE_MAX = 80;

export const TITLE_ERROR = `Give the card a title, up to ${TITLE_MAX} characters.`;
export const DESTINATION_ERROR = "The destination has to be an https link.";

export function titleProblem(value: string) {
  const length = value.trim().length;
  return length < 1 || length > TITLE_MAX ? TITLE_ERROR : null;
}

export function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** True when the field still matches the stored link, including https normalization. */
export function destinationUnchanged(current: string, saved: string) {
  const trimmed = current.trim();
  const savedTrimmed = saved.trim();
  if (trimmed === savedTrimmed) {
    return true;
  }
  const normalized = httpsUrl(trimmed);
  return normalized != null && normalized === savedTrimmed;
}

export function parseTitleAndDestination(
  titleValue: string,
  destinationValue: string,
): { title: string; destinationUrl: string } | { error: string } {
  const title = titleValue.trim();
  const destinationUrl = httpsUrl(destinationValue.trim());

  if (titleProblem(title)) {
    return { error: TITLE_ERROR };
  }
  if (!destinationUrl) {
    return { error: DESTINATION_ERROR };
  }
  return { title, destinationUrl };
}

export function parseDestination(
  value: string,
): { destinationUrl: string } | { error: string } {
  const destinationUrl = httpsUrl(value.trim());
  return destinationUrl ? { destinationUrl } : { error: DESTINATION_ERROR };
}

export function parseCardFields(
  formData: FormData,
): { title: string; destinationUrl: string } | { error: string } {
  return parseTitleAndDestination(
    String(formData.get("title") ?? ""),
    String(formData.get("destination") ?? ""),
  );
}

export function parseCreateBody(
  body: unknown,
): { title: string; destinationUrl: string } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: TITLE_ERROR };
  }
  const record = body as { title?: unknown; destinationUrl?: unknown };
  return parseTitleAndDestination(
    typeof record.title === "string" ? record.title : "",
    typeof record.destinationUrl === "string" ? record.destinationUrl : "",
  );
}

export function parseDestinationBody(
  body: unknown,
): { destinationUrl: string } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: DESTINATION_ERROR };
  }
  const value = (body as { destinationUrl?: unknown }).destinationUrl;
  return parseDestination(typeof value === "string" ? value : "");
}

/** A positive card id from a path segment or form field, or null. */
export function parseId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseCardId(formData: FormData) {
  return parseId(String(formData.get("id") ?? ""));
}
