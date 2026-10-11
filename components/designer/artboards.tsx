"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  type CardImages,
  drawBack,
  drawDesign,
  type LayerHit,
  loadHtmlImage,
} from "@/components/designer/card-canvas";
import { useCanvasPaint } from "@/components/designer/use-canvas-paint";
import {
  type CardBack,
  type CardDesign,
  FRONT_GUIDES,
  type LayerId,
  type MovableLayerId,
} from "@/lib/card-design";
import { clampUnit, layerPoint } from "@/lib/design-edits";

const NO_IMAGES: CardImages = { background: null, photo: null };

export function Artboard({
  design,
  guides,
  selected,
  zoom,
  onSelect,
  onBegin,
  onMove,
  onCommit,
}: {
  design: CardDesign;
  guides: boolean;
  selected: LayerId;
  zoom: number;
  onSelect: (id: LayerId) => void;
  onBegin: () => void;
  onMove: (id: MovableLayerId, x: number, y: number) => void;
  onCommit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hits = useRef<LayerHit[]>([]);
  const images = useDesignImages(design);
  const drag = useRef<{
    id: MovableLayerId;
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);

  useCanvasPaint(canvasRef, (ctx, width, height) => {
    hits.current = drawDesign(ctx, design, images, width, height, {
      guides,
      selected,
    });
  });

  return (
    <ZoomFrame zoom={zoom}>
      <canvas
        ref={canvasRef}
        aria-label="Card artboard"
        className="aspect-[2024/1276] w-full cursor-default rounded-xl shadow-lg"
        onPointerDown={(event) => {
          const { x, y } = pointerIn(event);
          const hit = topHit(hits.current, x, y);
          onSelect(hit?.id ?? "background");
          if (!hit) {
            return;
          }
          const layer = layerPoint(design, hit.id);
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: hit.id, ...layer, pointerX: x, pointerY: y };
          onBegin();
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) {
            return;
          }
          const { x, y, rect } = pointerIn(event);
          onMove(
            current.id,
            clampUnit(current.x + (x - current.pointerX) / rect.width),
            clampUnit(current.y + (y - current.pointerY) / rect.height),
          );
        }}
        onPointerUp={() => {
          if (!drag.current) {
            return;
          }
          drag.current = null;
          onCommit();
        }}
      />
    </ZoomFrame>
  );
}

export function ImportPlate({
  url,
  guides,
  zoom,
  onUpload,
}: {
  url: string | null;
  guides: boolean;
  zoom: number;
  onUpload: () => void;
}) {
  return (
    <ZoomFrame zoom={zoom}>
      <div className="relative aspect-[2024/1276] overflow-hidden rounded-xl bg-zinc-800 shadow-lg">
        {url ? (
          // biome-ignore lint/performance/noImgElement: the art is a signed or local crop, not a static asset
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={onUpload}
            className="flex h-full w-full items-center justify-center text-sm text-white"
          >
            Upload an image to crop
          </button>
        )}
        {guides ? <GuideOverlay /> : null}
      </div>
    </ZoomFrame>
  );
}

export function BackArtboard({
  back,
  url,
  selected,
  zoom,
}: {
  back: CardBack;
  url: string;
  selected: boolean;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasPaint(canvasRef, (ctx, width, height) =>
    drawBack(ctx, back, width, height, { url, selected }),
  );

  return (
    <ZoomFrame zoom={zoom}>
      <canvas
        ref={canvasRef}
        aria-label="Back of the card"
        className="aspect-[2024/1276] w-full rounded-xl shadow-lg"
      />
    </ZoomFrame>
  );
}

function GuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {FRONT_GUIDES.map((zone) => (
        <span
          key={zone.id}
          className="absolute border border-dashed border-[#FF2BD6] px-1 text-[10px] leading-4 text-[#FF2BD6]"
          style={{
            left: `${zone.x * 100}%`,
            top: `${zone.y * 100}%`,
            width: `${zone.w * 100}%`,
            height: `${zone.h * 100}%`,
          }}
        >
          {zone.label}
        </span>
      ))}
    </div>
  );
}

function ZoomFrame({ zoom, children }: { zoom: number; children: ReactNode }) {
  return (
    <div className="mx-auto" style={{ width: `${zoom * 100}%` }}>
      {children}
    </div>
  );
}

/** The background and photo images, loaded once per URL. A failed load paints as empty. */
function useDesignImages(design: CardDesign) {
  const backgroundUrl = design.backgroundUrl;
  const photoUrl = design.photo?.url ?? null;
  const [images, setImages] = useState<CardImages>(NO_IMAGES);

  useEffect(() => {
    let cancel = false;
    Promise.allSettled([
      backgroundUrl ? loadHtmlImage(backgroundUrl) : null,
      photoUrl ? loadHtmlImage(photoUrl) : null,
    ]).then(([background, photo]) => {
      if (!cancel) {
        setImages({
          background:
            background.status === "fulfilled" ? background.value : null,
          photo: photo.status === "fulfilled" ? photo.value : null,
        });
      }
    });
    return () => {
      cancel = true;
    };
  }, [backgroundUrl, photoUrl]);

  return images;
}

function pointerIn(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
}

/** The last-drawn layer under the point, which is the one on top. */
function topHit(hits: LayerHit[], x: number, y: number) {
  return hits.findLast(
    (hit) =>
      x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h,
  );
}
