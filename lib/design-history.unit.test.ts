import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBack, defaultDesign } from "./card-design.ts";
import { moveLayer, placeLayer } from "./design-edits.ts";
import { historyReducer, startHistory } from "./design-history.ts";

const design = defaultDesign("GitHub");
const back = defaultBack("GitHub");

test("an edit can be undone and redone", () => {
  const moved = placeLayer(design, "name", 0.4, 0.6);
  let state = historyReducer(startHistory(design, back), {
    type: "replace",
    design: moved,
  });
  assert.equal(state.past.length, 1);

  state = historyReducer(state, { type: "undo" });
  assert.deepEqual(state.design, design);
  assert.equal(state.future.length, 1);

  state = historyReducer(state, { type: "redo" });
  assert.deepEqual(state.design, moved);
  assert.equal(state.future.length, 0);
});

test("a drag makes one undo step, and a drag that ends where it began makes none", () => {
  const start = startHistory(design, back);
  let state = historyReducer(start, {
    type: "live",
    design: placeLayer(design, "name", 0.2, 0.2),
  });
  state = historyReducer(state, {
    type: "live",
    design: placeLayer(design, "name", 0.3, 0.3),
  });
  assert.equal(state.past.length, 0);
  state = historyReducer(state, { type: "commit", before: design });
  assert.equal(state.past.length, 1);
  assert.deepEqual(state.past[0]?.design, design);

  const unchanged = historyReducer(start, { type: "commit", before: design });
  assert.equal(unchanged, start);
});

test("back edits share the same history as the front", () => {
  const darker = { ...back, background: "#000000" };
  let state = historyReducer(startHistory(design, back), {
    type: "replace-back",
    back: darker,
  });
  state = historyReducer(state, {
    type: "replace",
    design: placeLayer(design, "subtitle", 0.5, 0.5),
  });
  state = historyReducer(state, { type: "undo" });
  state = historyReducer(state, { type: "undo" });
  assert.deepEqual(state.back, back);
  assert.deepEqual(state.design, design);
});

test("history keeps the last 50 steps", () => {
  let state = startHistory(design, back);
  for (let step = 1; step <= 60; step += 1) {
    state = historyReducer(state, {
      type: "replace",
      design: placeLayer(design, "name", step / 100, 0.5),
    });
  }
  assert.equal(state.past.length, 50);
});

test("nudging keeps a layer on the card, and the background never moves", () => {
  const edge = placeLayer(design, "name", 0.99, 0.01);
  const nudged = moveLayer(edge, "name", 0.05, -0.05);
  assert.equal(nudged.name.x, 1);
  assert.equal(nudged.name.y, 0);
  assert.equal(moveLayer(design, "background", 0.1, 0.1), design);
  assert.equal(moveLayer(design, "photo", 0.1, 0.1), design);
});
