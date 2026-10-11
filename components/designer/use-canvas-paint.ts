"use client";

import { type RefObject, useEffect, useRef } from "react";

type Paint = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

/**
 * Paints a canvas at device pixel ratio, in CSS pixel coordinates. It repaints
 * after every render and whenever the canvas's parent resizes.
 */
export function useCanvasPaint(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  paint: Paint,
) {
  const latest = useRef(paint);
  latest.current = paint;
  const repaint = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) {
      return;
    }
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width < 2 || height < 2) {
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      latest.current(ctx, width, height);
    };
    repaint.current = draw;
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => {
      observer.disconnect();
      repaint.current = () => {};
    };
  }, [canvasRef]);

  useEffect(() => {
    repaint.current();
  });
}
