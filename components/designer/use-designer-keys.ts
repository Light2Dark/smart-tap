"use client";

import { type Dispatch, useEffect, useRef } from "react";
import type { CardDesign, LayerId } from "@/lib/card-design";
import { arrowDelta, clearPhoto, moveLayer } from "@/lib/design-edits";
import type { HistoryAction } from "@/lib/design-history";

const NUDGE = 0.005;
const NUDGE_LARGE = 0.02;

/**
 * Cmd/Ctrl+Z undoes and Shift redoes, anywhere. On the front template, arrows
 * nudge the selected layer and Delete removes the photo.
 */
export function useDesignerKeys(
  dispatch: Dispatch<HistoryAction>,
  current: { design: CardDesign; selected: LayerId; editingLayers: boolean },
) {
  const latest = useRef(current);
  latest.current = current;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }
      const { design, selected, editingLayers } = latest.current;
      if (!editingLayers || typing(event.target)) {
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        if (selected === "photo") {
          event.preventDefault();
          dispatch({ type: "replace", design: clearPhoto(design) });
        }
        return;
      }
      const delta = arrowDelta(event.key, event.shiftKey ? NUDGE_LARGE : NUDGE);
      if (!delta || selected === "background") {
        return;
      }
      event.preventDefault();
      dispatch({
        type: "replace",
        design: moveLayer(design, selected, delta.x, delta.y),
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);
}

function typing(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
