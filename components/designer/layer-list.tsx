"use client";

import { LayerButton } from "@/components/designer/controls";
import type { BackLayer } from "@/components/designer/inspectors";
import type { LayerId } from "@/lib/card-design";

const FRONT_LAYERS: { id: LayerId; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "photo", label: "Photo" },
  { id: "subtitle", label: "Subtitle" },
  { id: "name", label: "Name" },
];

const BACK_LAYERS: { id: BackLayer; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "note", label: "Line" },
];

export function FrontLayers({
  selected,
  onSelect,
}: {
  selected: LayerId;
  onSelect: (id: LayerId) => void;
}) {
  return FRONT_LAYERS.map((layer) => (
    <LayerButton
      key={layer.id}
      pressed={selected === layer.id}
      onClick={() => onSelect(layer.id)}
    >
      {layer.label}
    </LayerButton>
  ));
}

export function BackLayers({
  selected,
  onSelect,
}: {
  selected: BackLayer;
  onSelect: (id: BackLayer) => void;
}) {
  return (
    <>
      {BACK_LAYERS.map((layer) => (
        <LayerButton
          key={layer.id}
          pressed={selected === layer.id}
          onClick={() => onSelect(layer.id)}
        >
          {layer.label}
        </LayerButton>
      ))}
      <p className="px-2 py-2 text-xs leading-5 text-zinc-500">
        The QR is this card’s link. It stays large, with a white margin, so a
        printed card can be scanned.
      </p>
    </>
  );
}
