"use client";

import {
  ColorPicker,
  control,
  Field,
  secondaryButton,
} from "@/components/designer/controls";
import type {
  CardBack,
  CardDesign,
  LayerId,
  TextLayer,
} from "@/lib/card-design";
import { clearPhoto, setText } from "@/lib/design-edits";

export type BackLayer = "background" | "note";

type Gesture = {
  onBegin: () => void;
  onCommit: () => void;
};

type DesignEdits = Gesture & {
  onLive: (design: CardDesign) => void;
  onRecord: (design: CardDesign) => void;
};

type BackEdits = Gesture & {
  onLive: (back: CardBack) => void;
  onRecord: (back: CardBack) => void;
};

const ALIGN_X = { left: 0.07, center: 0.5, right: 0.93 } as const;

export function Inspector({
  design,
  selected,
  onUpload,
  ...edits
}: DesignEdits & {
  design: CardDesign;
  selected: LayerId;
  onUpload: () => void;
}) {
  const { onLive, onRecord, onBegin, onCommit } = edits;
  if (selected === "background") {
    return (
      <Panel title="Background">
        <ColorPicker
          value={design.background}
          onPick={(background) => onRecord({ ...design, background })}
          onLive={(background) => onLive({ ...design, background })}
          onBegin={onBegin}
          onCommit={onCommit}
        />
        <button type="button" onClick={onUpload} className={secondaryButton}>
          {design.backgroundUrl ? "Replace image" : "Upload image"}
        </button>
        {design.backgroundUrl ? (
          <TextButton
            onClick={() => onRecord({ ...design, backgroundUrl: null })}
          >
            Remove image
          </TextButton>
        ) : null}
        <Hint>
          Chip and tap mark stay off the saved image. They are print
          reservations, not logos.
        </Hint>
      </Panel>
    );
  }
  if (selected === "photo") {
    return (
      <Panel title="Photo">
        <button type="button" onClick={onUpload} className={secondaryButton}>
          {design.photo ? "Replace photo" : "Upload photo"}
        </button>
        {design.photo ? (
          <PhotoControls design={design} photo={design.photo} {...edits} />
        ) : (
          <Hint>A photo is cropped square, then placed on the card.</Hint>
        )}
      </Panel>
    );
  }
  return <TextInspector design={design} id={selected} {...edits} />;
}

function TextInspector({
  design,
  id,
  onLive,
  onRecord,
  onBegin,
  onCommit,
}: DesignEdits & {
  design: CardDesign;
  id: "name" | "subtitle";
}) {
  const layer = design[id];
  const live = (patch: Partial<TextLayer>) =>
    onLive(setText(design, id, patch));
  const record = (patch: Partial<TextLayer>) =>
    onRecord(setText(design, id, patch));

  return (
    <Panel title={id === "name" ? "Name" : "Subtitle"}>
      <Field label="Text">
        <input
          value={layer.text}
          maxLength={80}
          onFocus={onBegin}
          onBlur={onCommit}
          onChange={(event) => live({ text: event.target.value })}
          className={control}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Font">
          <select
            value={layer.font}
            onChange={(event) =>
              record({ font: event.target.value as TextLayer["font"] })
            }
            className={control}
          >
            <option value="sans">Sans</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
          </select>
        </Field>
        <Field label="Weight">
          <select
            value={layer.weight}
            onChange={(event) =>
              record({
                weight: Number(event.target.value) as TextLayer["weight"],
              })
            }
            className={control}
          >
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </Field>
      </div>
      <Slider
        label="Size"
        min={18}
        max={180}
        value={layer.size}
        onChange={(size) => live({ size })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <Slider
        label="Tracking"
        min={-0.05}
        max={0.2}
        step={0.01}
        value={layer.tracking}
        onChange={(tracking) => live({ tracking })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <ColorPicker
        value={layer.color}
        onPick={(color) => record({ color })}
        onLive={(color) => live({ color })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <div className="flex gap-2">
        {(["left", "center", "right"] as const).map((align) => (
          <button
            key={align}
            type="button"
            aria-pressed={layer.align === align}
            onClick={() => record({ align, x: ALIGN_X[align] })}
            className="h-9 flex-1 rounded-lg border border-black/10 text-xs capitalize dark:border-white/15 aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {align}
          </button>
        ))}
      </div>
      <Hint>Drag the text on the card. Arrow keys nudge it.</Hint>
    </Panel>
  );
}

export function BackInspector({
  back,
  selected,
  onLive,
  onRecord,
  onBegin,
  onCommit,
}: BackEdits & {
  back: CardBack;
  selected: BackLayer;
}) {
  if (selected === "background") {
    return (
      <Panel title="Background">
        <ColorPicker
          value={back.background}
          onPick={(background) => onRecord({ ...back, background })}
          onLive={(background) => onLive({ ...back, background })}
          onBegin={onBegin}
          onCommit={onCommit}
        />
        <Hint>
          The code is printed on this color, with a white margin so it still
          scans.
        </Hint>
      </Panel>
    );
  }
  const note = back.note;
  const live = (patch: Partial<TextLayer>) =>
    onLive({ ...back, note: { ...note, ...patch } });
  return (
    <Panel title="Line">
      <Field label="Text">
        <input
          value={note.text}
          maxLength={80}
          onFocus={onBegin}
          onBlur={onCommit}
          onChange={(event) => live({ text: event.target.value })}
          className={control}
        />
      </Field>
      <Slider
        label="Size"
        min={18}
        max={96}
        value={note.size}
        onChange={(size) => live({ size })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <ColorPicker
        value={note.color}
        onPick={(color) => onRecord({ ...back, note: { ...note, color } })}
        onLive={(color) => live({ color })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <Hint>This line sits under the code. It does not move into the QR.</Hint>
    </Panel>
  );
}

export function ImportInspector({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Imported image</h2>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        The crop is locked to the business-card ratio. Zoom, pan, and rotate,
        then apply. Chip and tap mark show where a printed card keeps clear. The
        QR lives on the back.
      </p>
      <button type="button" onClick={onUpload} className={secondaryButton}>
        Upload image
      </button>
    </div>
  );
}

function PhotoControls({
  design,
  photo,
  onLive,
  onRecord,
  onBegin,
  onCommit,
}: DesignEdits & {
  design: CardDesign;
  photo: NonNullable<CardDesign["photo"]>;
}) {
  return (
    <>
      <Field label="Shape">
        <select
          value={photo.shape}
          onChange={(event) =>
            onRecord({
              ...design,
              photo: {
                ...photo,
                shape: event.target.value === "rounded" ? "rounded" : "circle",
              },
            })
          }
          className={control}
        >
          <option value="circle">Circle</option>
          <option value="rounded">Rounded</option>
        </select>
      </Field>
      <Slider
        label="Size"
        min={0.12}
        max={0.72}
        step={0.01}
        value={photo.size}
        onChange={(size) => onLive({ ...design, photo: { ...photo, size } })}
        onBegin={onBegin}
        onCommit={onCommit}
      />
      <TextButton onClick={() => onRecord(clearPhoto(design))}>
        Remove photo
      </TextButton>
    </>
  );
}

/** A range input whose drag is one undo step. */
function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  onBegin,
  onCommit,
}: Gesture & {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onBegin}
        onPointerUp={onCommit}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-zinc-500">{children}</p>;
}

function TextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-sm text-zinc-500 underline-offset-2 hover:underline"
    >
      {children}
    </button>
  );
}
