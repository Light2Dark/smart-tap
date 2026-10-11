import {
  BACK_CAPTION_Y,
  BACK_QR,
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardBack,
  type CardDesign,
  cropCoverScale,
  FRONT_GUIDES,
  type LayerId,
  type MovableLayerId,
  type PhotoPlacement,
  type TextLayer,
} from "@/lib/card-design";
import { qrModules } from "@/lib/qr-matrix";

export type CardImages = {
  background: CanvasImageSource | null;
  photo: CanvasImageSource | null;
};

export type CropSettings = {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
};

export type LayerHit = {
  id: MovableLayerId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function paintCrop(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  crop: CropSettings,
) {
  const zoom = Math.min(4, Math.max(1, crop.zoom));
  const scale =
    cropCoverScale(
      imageWidth,
      imageHeight,
      frameWidth,
      frameHeight,
      crop.rotation,
    ) * zoom;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, frameWidth, frameHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, frameWidth, frameHeight);
  ctx.clip();
  ctx.translate(
    frameWidth / 2 + crop.panX * frameWidth,
    frameHeight / 2 + crop.panY * frameHeight,
  );
  ctx.rotate((crop.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2);
  ctx.restore();
}

export function drawDesign(
  ctx: CanvasRenderingContext2D,
  design: CardDesign,
  images: CardImages,
  width: number,
  height: number,
  extras: { guides: boolean; selected: LayerId | null },
) {
  const hits: LayerHit[] = [];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = design.background;
  ctx.fillRect(0, 0, width, height);
  if (images.background) {
    ctx.drawImage(images.background, 0, 0, width, height);
  }
  if (design.photo && images.photo) {
    const box = photoBox(design.photo, width, height);
    ctx.save();
    ctx.beginPath();
    if (design.photo.shape === "circle") {
      ctx.arc(box.cx, box.cy, box.side / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(box.x, box.y, box.side, box.side, box.side * 0.16);
    }
    ctx.clip();
    ctx.drawImage(images.photo, box.x, box.y, box.side, box.side);
    ctx.restore();
    hits.push({ id: "photo", x: box.x, y: box.y, w: box.side, h: box.side });
  }
  paintText(ctx, design.subtitle, width, height);
  paintText(ctx, design.name, width, height);
  hits.push(textHit("subtitle", design.subtitle, width, height));
  hits.push(textHit("name", design.name, width, height));
  if (extras.guides) {
    paintGuides(ctx, width, height, FRONT_GUIDES);
  }
  if (extras.selected && extras.selected !== "background") {
    const hit = hits.find((item) => item.id === extras.selected);
    if (hit) {
      ctx.save();
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 2;
      ctx.strokeRect(hit.x - 4, hit.y - 4, hit.w + 8, hit.h + 8);
      ctx.restore();
    }
  }
  return hits;
}

export function drawBack(
  ctx: CanvasRenderingContext2D,
  back: CardBack,
  width: number,
  height: number,
  extras: { url: string; selected: boolean },
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = back.background;
  ctx.fillRect(0, 0, width, height);
  const zone = {
    x: BACK_QR.x * width,
    y: BACK_QR.y * height,
    w: BACK_QR.w * width,
    h: BACK_QR.h * height,
  };
  paintQr(ctx, extras.url, zone);
  const caption = {
    ...back.note,
    align: "center" as const,
    x: 0.5,
    y: BACK_CAPTION_Y,
  };
  paintText(ctx, caption, width, height);
  if (extras.selected && caption.text) {
    const note = textBox(caption, width, height);
    ctx.save();
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(note.x - 4, note.y - 4, note.w + 8, note.h + 8);
    ctx.restore();
  }
}

export async function renderBackPng(back: CardBack, url: string) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not draw the back of the card.");
  }
  drawBack(ctx, back, CARD_WIDTH, CARD_HEIGHT, { url, selected: false });
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("Could not export the back of the card.");
  }
  return blob;
}

export async function renderCardPng(design: CardDesign) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not draw the card.");
  }
  const background = design.backgroundUrl
    ? await loadBitmap(design.backgroundUrl)
    : null;
  const photo = design.photo ? await loadBitmap(design.photo.url) : null;
  try {
    drawDesign(ctx, design, { background, photo }, CARD_WIDTH, CARD_HEIGHT, {
      guides: false,
      selected: null,
    });
  } finally {
    background?.close();
    photo?.close();
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("Could not export the card.");
  }
  return blob;
}

export async function renderCropPng(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  crop: CropSettings,
  outputWidth: number,
  outputHeight: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not crop that image.");
  }
  paintCrop(
    ctx,
    image,
    imageWidth,
    imageHeight,
    outputWidth,
    outputHeight,
    crop,
  );
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("Could not crop that image.");
  }
  return blob;
}

export function loadHtmlImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!url.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = url;
  });
}

async function loadBitmap(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not read that image.");
  }
  return createImageBitmap(await response.blob());
}

function paintQr(
  ctx: CanvasRenderingContext2D,
  url: string,
  zone: { x: number; y: number; w: number; h: number },
) {
  const modules = qrModules(url);
  const count = modules.length;
  const quiet = 4;
  const cells = count + quiet * 2;
  const cell = Math.min(zone.w, zone.h) / cells;
  const originX = zone.x + (zone.w - cell * cells) / 2;
  const originY = zone.y + (zone.h - cell * cells) / 2;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(originX, originY, cell * cells, cell * cells);
  ctx.fillStyle = "#111111";
  for (let row = 0; row < count; row += 1) {
    const line = modules[row] ?? [];
    for (let col = 0; col < count; col += 1) {
      if (!line[col]) {
        continue;
      }
      ctx.fillRect(
        originX + (col + quiet) * cell,
        originY + (row + quiet) * cell,
        cell + 0.4,
        cell + 0.4,
      );
    }
  }
  ctx.restore();
}

function paintText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  width: number,
  height: number,
) {
  if (!layer.text) {
    return;
  }
  const size = (layer.size / CARD_WIDTH) * width;
  ctx.save();
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.weight} ${size}px ${fontFamily(layer.font)}`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";
  ctx.letterSpacing = `${layer.tracking}em`;
  ctx.fillText(layer.text, layer.x * width, layer.y * height);
  ctx.restore();
}

function paintGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zones: readonly {
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[],
) {
  ctx.save();
  ctx.strokeStyle = "#FF2BD6";
  ctx.fillStyle = "#FF2BD6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.font = `${Math.max(11, width * 0.018)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const zone of zones) {
    const x = zone.x * width;
    const y = zone.y * height;
    const w = zone.w * width;
    const h = zone.h * height;
    ctx.strokeRect(x, y, w, h);
    ctx.fillText(zone.label, x + 6, y + 6);
  }
  ctx.restore();
}

function textHit(
  id: "name" | "subtitle",
  layer: TextLayer,
  width: number,
  height: number,
): LayerHit {
  return { id, ...textBox(layer, width, height) };
}

function textBox(layer: TextLayer, width: number, height: number) {
  const size = (layer.size / CARD_WIDTH) * width;
  const boxW = Math.max(size * 2, layer.text.length * size * 0.56);
  const boxH = size * 1.35;
  let x = layer.x * width;
  if (layer.align === "center") {
    x -= boxW / 2;
  }
  if (layer.align === "right") {
    x -= boxW;
  }
  return { x, y: layer.y * height, w: boxW, h: boxH };
}

function photoBox(photo: PhotoPlacement, width: number, height: number) {
  const side = photo.size * height;
  return {
    side,
    cx: photo.x * width,
    cy: photo.y * height,
    x: photo.x * width - side / 2,
    y: photo.y * height - side / 2,
  };
}

function fontFamily(font: TextLayer["font"]) {
  const root = getComputedStyle(document.documentElement);
  if (font === "serif") {
    return "Georgia, serif";
  }
  if (font === "mono") {
    return root.getPropertyValue("--font-geist-mono").trim() || "monospace";
  }
  return root.getPropertyValue("--font-geist-sans").trim() || "sans-serif";
}
