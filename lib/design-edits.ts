import type {
  CardDesign,
  LayerId,
  MovableLayerId,
  TextLayer,
} from "./card-design.ts";

export function setText(
  design: CardDesign,
  id: "name" | "subtitle",
  patch: Partial<TextLayer>,
): CardDesign {
  return { ...design, [id]: { ...design[id], ...patch } };
}

export function clearPhoto(design: CardDesign): CardDesign {
  return { ...design, photo: null };
}

export function layerPoint(design: CardDesign, id: MovableLayerId) {
  if (id === "photo") {
    return design.photo
      ? { x: design.photo.x, y: design.photo.y }
      : { x: 0, y: 0 };
  }
  return { x: design[id].x, y: design[id].y };
}

/** Puts a layer's anchor at a point on the card, in 0–1 units. */
export function placeLayer(
  design: CardDesign,
  id: MovableLayerId,
  x: number,
  y: number,
): CardDesign {
  if (id === "photo") {
    return design.photo
      ? { ...design, photo: { ...design.photo, x, y } }
      : design;
  }
  return setText(design, id, { x, y });
}

/** Nudges a layer, keeping its anchor on the card. */
export function moveLayer(
  design: CardDesign,
  id: LayerId,
  dx: number,
  dy: number,
): CardDesign {
  if (id === "background") {
    return design;
  }
  const point = layerPoint(design, id);
  return placeLayer(
    design,
    id,
    clampUnit(point.x + dx),
    clampUnit(point.y + dy),
  );
}

export function arrowDelta(key: string, step: number) {
  switch (key) {
    case "ArrowLeft":
      return { x: -step, y: 0 };
    case "ArrowRight":
      return { x: step, y: 0 };
    case "ArrowUp":
      return { x: 0, y: -step };
    case "ArrowDown":
      return { x: 0, y: step };
    default:
      return null;
  }
}

export function clampUnit(value: number) {
  return clamp(value, 0, 1);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundZoom(value: number) {
  return Math.round(value * 10) / 10;
}
