import type { CardBack, CardDesign } from "./card-design.ts";

const LIMIT = 50;

export type Snapshot = {
  design: CardDesign;
  back: CardBack;
};

export type HistoryState = Snapshot & {
  past: Snapshot[];
  future: Snapshot[];
};

/**
 * `live-*` updates the view during a drag or slider move without an undo step.
 * `replace-*` is a whole edit with its own undo step.
 * `commit-*` closes a live gesture, recording where it started.
 */
export type HistoryAction =
  | { type: "live"; design: CardDesign }
  | { type: "replace"; design: CardDesign }
  | { type: "commit"; before: CardDesign }
  | { type: "live-back"; back: CardBack }
  | { type: "replace-back"; back: CardBack }
  | { type: "commit-back"; before: CardBack }
  | { type: "undo" }
  | { type: "redo" };

export function startHistory(design: CardDesign, back: CardBack): HistoryState {
  return { design, back, past: [], future: [] };
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  const current = snapshot(state);
  switch (action.type) {
    case "live":
      return { ...state, design: action.design };
    case "live-back":
      return { ...state, back: action.back };
    case "replace":
      return record(state, { ...current, design: action.design }, current);
    case "replace-back":
      return record(state, { ...current, back: action.back }, current);
    case "commit":
      return record(state, current, { ...current, design: action.before });
    case "commit-back":
      return record(state, current, { ...current, back: action.before });
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }
      return {
        ...previous,
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) {
        return state;
      }
      return {
        ...next,
        past: [...state.past, current].slice(-LIMIT),
        future: state.future.slice(1),
      };
    }
  }
}

function record(
  state: HistoryState,
  next: Snapshot,
  before: Snapshot,
): HistoryState {
  if (sameSnapshot(next, before)) {
    return state;
  }
  return { ...next, past: [...state.past, before].slice(-LIMIT), future: [] };
}

function snapshot(state: HistoryState): Snapshot {
  return { design: state.design, back: state.back };
}

function sameSnapshot(a: Snapshot, b: Snapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}
