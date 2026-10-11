"use client";

import { useEffect, useRef, useState } from "react";
import {
  type CropSettings,
  loadHtmlImage,
  paintCrop,
  renderCropPng,
} from "@/components/designer/card-canvas";
import { useCanvasPaint } from "@/components/designer/use-canvas-paint";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/card-design";
import { clamp } from "@/lib/design-edits";

export type CropPurpose = "import" | "background" | "photo";

const START: CropSettings = { zoom: 1, panX: 0, panY: 0, rotation: 0 };
const PAN_LIMIT = 0.45;

export function Cropper({
  file,
  purpose,
  onApply,
  onCancel,
}: {
  file: File;
  purpose: CropPurpose;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropSettings>(START);
  const [grid, setGrid] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const output =
    purpose === "photo"
      ? { width: 800, height: 800, ratio: "1/1" }
      : { width: CARD_WIDTH, height: CARD_HEIGHT, ratio: "2024/1276" };

  useEffect(() => {
    const url = URL.createObjectURL(file);
    let cancel = false;
    loadHtmlImage(url)
      .then((loaded) => {
        if (!cancel) {
          setImage(loaded);
        }
      })
      .catch(() => {
        if (!cancel) {
          setFailed("Could not read that image.");
        }
      });
    return () => {
      cancel = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useCanvasPaint(canvasRef, (ctx, width, height) => {
    if (!image) {
      return;
    }
    paintCrop(
      ctx,
      image,
      image.naturalWidth,
      image.naturalHeight,
      width,
      height,
      crop,
    );
    if (grid) {
      paintThirds(ctx, width, height);
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCrop((current) => ({
        ...current,
        zoom: clamp(current.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 1, 4),
      }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <h2 className="font-medium">
          {purpose === "photo" ? "Crop photo" : "Crop to the card"}
        </h2>
        <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={crop.zoom}
            onChange={(event) =>
              setCrop((current) => ({
                ...current,
                zoom: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          Rotate
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={crop.rotation}
            onChange={(event) =>
              setCrop((current) => ({
                ...current,
                rotation: Number(event.target.value),
              }))
            }
          />
          <span className="w-10 text-xs">{crop.rotation}°</span>
        </label>
        <button
          type="button"
          onClick={() => setGrid((value) => !value)}
          className="rounded-full border border-black/10 px-3 py-1 dark:border-white/15"
          aria-pressed={grid}
        >
          Thirds
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto rounded-full px-3 py-1"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!image}
          onClick={async () => {
            if (!image) {
              return;
            }
            onApply(
              await renderCropPng(
                image,
                image.naturalWidth,
                image.naturalHeight,
                crop,
                output.width,
                output.height,
              ),
            );
          }}
          className="rounded-full bg-foreground px-4 py-1.5 text-background disabled:opacity-50"
        >
          Apply crop
        </button>
      </div>
      {failed ? <p className="text-sm text-red-600">{failed}</p> : null}
      <canvas
        ref={canvasRef}
        aria-label="Crop"
        className="w-full cursor-grab rounded-xl bg-black shadow-lg active:cursor-grabbing"
        style={{ aspectRatio: output.ratio }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            panX: crop.panX,
            panY: crop.panY,
          };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          setCrop((value) => ({
            ...value,
            panX: clamp(
              current.panX + (event.clientX - current.x) / rect.width,
              -PAN_LIMIT,
              PAN_LIMIT,
            ),
            panY: clamp(
              current.panY + (event.clientY - current.y) / rect.height,
              -PAN_LIMIT,
              PAN_LIMIT,
            ),
          }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      />
    </div>
  );
}

function paintThirds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const step of [1 / 3, 2 / 3]) {
    ctx.moveTo(step * width, 0);
    ctx.lineTo(step * width, height);
    ctx.moveTo(0, step * height);
    ctx.lineTo(width, step * height);
  }
  ctx.stroke();
  ctx.restore();
}
