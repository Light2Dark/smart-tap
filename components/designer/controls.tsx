import type { ReactNode } from "react";

const SWATCHES = [
  "#1B3A4B",
  "#14342B",
  "#2C2C54",
  "#3D2B1F",
  "#4A2C2A",
  "#111111",
  "#F4F1EA",
  "#FFFFFF",
];

/**
 * Swatches record one undo step each. The free color input is a live gesture:
 * it begins on focus and commits on blur.
 */
export function ColorPicker({
  value,
  onPick,
  onLive,
  onBegin,
  onCommit,
}: {
  value: string;
  onPick: (color: string) => void;
  onLive: (color: string) => void;
  onBegin: () => void;
  onCommit: () => void;
}) {
  return (
    <>
      <Swatches value={value} onChange={onPick} />
      <Field label="Color">
        <input
          type="color"
          value={value}
          onFocus={onBegin}
          onChange={(event) => onLive(event.target.value)}
          onBlur={onCommit}
          className="h-9 w-full bg-transparent"
        />
      </Field>
    </>
  );
}

function Swatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value.toLowerCase() === color.toLowerCase()}
          onClick={() => onChange(color)}
          className="h-7 w-7 rounded-full border border-black/15 aria-pressed:ring-2 aria-pressed:ring-foreground"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs text-zinc-500">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function LayerButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="h-9 rounded-lg px-2 text-left text-sm aria-pressed:bg-foreground aria-pressed:text-background"
    >
      {children}
    </button>
  );
}

export function ModeButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="rounded-full px-3 py-1 aria-pressed:bg-foreground aria-pressed:text-background"
    >
      {children}
    </button>
  );
}

export function ToolButton({
  label,
  disabled,
  pressed,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="h-9 rounded-full border border-black/10 px-3 text-sm disabled:opacity-40 aria-pressed:bg-foreground aria-pressed:text-background dark:border-white/15"
    >
      {children}
    </button>
  );
}

export const control =
  "h-9 rounded-lg border border-black/10 bg-transparent px-2 text-sm dark:border-white/15";
export const secondaryButton =
  "h-9 rounded-full border border-black/10 px-3 text-sm dark:border-white/15";
