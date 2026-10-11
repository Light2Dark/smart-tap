export type FieldState = "clean" | "unsaved" | "invalid";

export function fieldState(dirty: boolean, problem: string | null): FieldState {
  if (problem) {
    return "invalid";
  }
  return dirty ? "unsaved" : "clean";
}

export function fieldClass(state: FieldState) {
  const tone =
    state === "invalid"
      ? "border-red-500 bg-red-50 dark:border-red-400/70 dark:bg-red-400/10"
      : state === "unsaved"
        ? "border-amber-500 bg-amber-50 dark:border-amber-400/70 dark:bg-amber-400/10"
        : "border-black/[.08] bg-transparent focus:border-black/30 dark:border-white/[.12] dark:focus:border-white/40";
  return `rounded-lg border px-3 outline-none transition-colors disabled:opacity-60 ${tone}`;
}
