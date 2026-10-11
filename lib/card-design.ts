export const CARD_WIDTH = 2024;
export const CARD_HEIGHT = 1276;

/** Blank spots on the front, for a printed card. They are not drawn into the PNG. */
export const FRONT_GUIDES = [
  { id: "chip", label: "Chip", x: 0.055, y: 0.36, w: 0.145, h: 0.3 },
  { id: "tap", label: "Tap mark", x: 0.78, y: 0.08, w: 0.15, h: 0.24 },
] as const;

const BACK_QR_SIDE = 960;
const BACK_QR_TOP = 72;

/** Large white plate for the QR, including its quiet zone. */
export const BACK_QR = {
  id: "qr",
  label: "QR",
  x: (CARD_WIDTH - BACK_QR_SIDE) / 2 / CARD_WIDTH,
  y: BACK_QR_TOP / CARD_HEIGHT,
  w: BACK_QR_SIDE / CARD_WIDTH,
  h: BACK_QR_SIDE / CARD_HEIGHT,
} as const;

/** Top of the caption that sits under the code. */
export const BACK_CAPTION_Y = (BACK_QR_TOP + BACK_QR_SIDE + 36) / CARD_HEIGHT;

const HEX = /^#[0-9a-fA-F]{6}$/;

export type FontId = "sans" | "serif" | "mono";
export type TextAlign = "left" | "center" | "right";
export type TextWeight = 400 | 500 | 600 | 700;

export type TextLayer = {
  text: string;
  color: string;
  font: FontId;
  size: number;
  weight: TextWeight;
  align: TextAlign;
  x: number;
  y: number;
  tracking: number;
};

export type PhotoPlacement = {
  shape: "circle" | "rounded";
  x: number;
  y: number;
  size: number;
};

export type StoredTemplate = {
  background: string;
  name: TextLayer;
  subtitle: TextLayer;
  hasBackgroundImage: boolean;
  photo: PhotoPlacement | null;
};

export type StoredBack = {
  background: string;
  note: TextLayer;
};

export type CardBack = StoredBack;

export type StoredCardDesign = {
  version: 1;
  template: StoredTemplate | null;
  back: StoredBack | null;
};

export type CardDesign = {
  version: 1;
  background: string;
  backgroundUrl: string | null;
  name: TextLayer;
  subtitle: TextLayer;
  photo: (PhotoPlacement & { url: string }) | null;
};

export type LayerId = "background" | "name" | "subtitle" | "photo";

/** A layer that can be dragged and nudged on the artboard. */
export type MovableLayerId = Exclude<LayerId, "background">;

export function defaultDesign(title: string): CardDesign {
  return {
    version: 1,
    background: "#1B3A4B",
    backgroundUrl: null,
    name: {
      text: title.slice(0, 48),
      color: "#FFFFFF",
      font: "sans",
      size: 92,
      weight: 600,
      align: "left",
      x: 0.07,
      y: 0.62,
      tracking: 0,
    },
    subtitle: {
      text: "",
      color: "#D5DDE3",
      font: "sans",
      size: 40,
      weight: 400,
      align: "left",
      x: 0.07,
      y: 0.78,
      tracking: 0.04,
    },
    photo: null,
  };
}

export function defaultBack(title = ""): CardBack {
  return {
    background: "#111111",
    note: {
      text: title.slice(0, 48),
      color: "#F4F1EA",
      font: "sans",
      size: 48,
      weight: 500,
      align: "center",
      x: 0.5,
      y: BACK_CAPTION_Y,
      tracking: 0.02,
    },
  };
}

export function serializeDesign(design: CardDesign): StoredTemplate {
  return {
    background: design.background,
    name: { ...design.name },
    subtitle: { ...design.subtitle },
    hasBackgroundImage: design.backgroundUrl != null,
    photo: design.photo
      ? {
          shape: design.photo.shape,
          x: design.photo.x,
          y: design.photo.y,
          size: design.photo.size,
        }
      : null,
  };
}

export function serializeBack(back: CardBack): StoredBack {
  return {
    background: back.background,
    note: { ...back.note },
  };
}

export function hydrateDesign(
  stored: StoredTemplate,
  assets: { backgroundUrl: string | null; photoUrl: string | null },
): CardDesign {
  return {
    version: 1,
    background: stored.background,
    backgroundUrl: stored.hasBackgroundImage ? assets.backgroundUrl : null,
    name: stored.name,
    subtitle: stored.subtitle,
    photo:
      stored.photo && assets.photoUrl
        ? { ...stored.photo, url: assets.photoUrl }
        : null,
  };
}

export function parseStoredDesign(value: unknown): StoredCardDesign | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== 1) {
    return null;
  }
  const back = record.back == null ? null : parseBack(record.back);
  if (record.back != null && !back) {
    return null;
  }
  if ("template" in record) {
    if (record.template == null) {
      return { version: 1, template: null, back };
    }
    const template = parseTemplate(record.template);
    if (!template) {
      return null;
    }
    return { version: 1, template, back };
  }
  const template = parseTemplate(record);
  if (!template) {
    return null;
  }
  return { version: 1, template, back };
}

export function designHasBack(value: unknown) {
  return parseStoredDesign(value)?.back != null;
}

export function cardPngPath(userId: string, cardId: number) {
  return `${userId}/${cardId}.png`;
}

export function cardBackPath(userId: string, cardId: number) {
  return `${userId}/${cardId}/back.png`;
}

export function cardAssetPath(
  userId: string,
  cardId: number,
  asset: "background" | "photo",
) {
  return `${userId}/${cardId}/${asset}.png`;
}

export function pngSize(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24) {
    return null;
  }
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) {
      return null;
    }
  }
  const type = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (type !== "IHDR") {
    return null;
  }
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

/** Scale that keeps a rotated image covering the crop frame. */
export function cropCoverScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  rotationDeg: number,
) {
  const cover = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const radians = (Math.abs(rotationDeg) * Math.PI) / 180;
  const boost = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
  return cover * boost;
}

function parseTemplate(value: unknown): StoredTemplate | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.background !== "string" || !HEX.test(record.background)) {
    return null;
  }
  const name = parseText(record.name);
  const subtitle = parseText(record.subtitle);
  if (!name || !subtitle || typeof record.hasBackgroundImage !== "boolean") {
    return null;
  }
  if (record.photo == null) {
    return {
      background: record.background,
      name,
      subtitle,
      hasBackgroundImage: record.hasBackgroundImage,
      photo: null,
    };
  }
  const photo = parsePhoto(record.photo);
  if (!photo) {
    return null;
  }
  return {
    background: record.background,
    name,
    subtitle,
    hasBackgroundImage: record.hasBackgroundImage,
    photo,
  };
}

function parseBack(value: unknown): StoredBack | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.background !== "string" || !HEX.test(record.background)) {
    return null;
  }
  const note = parseText(record.note);
  if (!note) {
    return null;
  }
  return { background: record.background, note };
}

function parseText(value: unknown): TextLayer | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const layer = value as Record<string, unknown>;
  if (typeof layer.text !== "string" || layer.text.length > 80) {
    return null;
  }
  if (typeof layer.color !== "string" || !HEX.test(layer.color)) {
    return null;
  }
  if (
    layer.font !== "sans" &&
    layer.font !== "serif" &&
    layer.font !== "mono"
  ) {
    return null;
  }
  if (typeof layer.size !== "number" || layer.size < 12 || layer.size > 240) {
    return null;
  }
  if (
    layer.weight !== 400 &&
    layer.weight !== 500 &&
    layer.weight !== 600 &&
    layer.weight !== 700
  ) {
    return null;
  }
  if (
    layer.align !== "left" &&
    layer.align !== "center" &&
    layer.align !== "right"
  ) {
    return null;
  }
  if (!unit(layer.x) || !unit(layer.y)) {
    return null;
  }
  if (
    typeof layer.tracking !== "number" ||
    layer.tracking < -0.08 ||
    layer.tracking > 0.4
  ) {
    return null;
  }
  return {
    text: layer.text,
    color: layer.color,
    font: layer.font,
    size: layer.size,
    weight: layer.weight,
    align: layer.align,
    x: layer.x,
    y: layer.y,
    tracking: layer.tracking,
  };
}

function parsePhoto(value: unknown): PhotoPlacement | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const photo = value as Record<string, unknown>;
  if (photo.shape !== "circle" && photo.shape !== "rounded") {
    return null;
  }
  if (!unit(photo.x) || !unit(photo.y)) {
    return null;
  }
  if (
    typeof photo.size !== "number" ||
    photo.size < 0.12 ||
    photo.size > 0.72
  ) {
    return null;
  }
  return { shape: photo.shape, x: photo.x, y: photo.y, size: photo.size };
}

function unit(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}
