import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BACK_QR,
  CARD_HEIGHT,
  CARD_WIDTH,
  cropCoverScale,
  defaultDesign,
  FRONT_GUIDES,
  parseStoredDesign,
  pngSize,
  serializeDesign,
} from "./card-design.ts";

test("the plate matches a business card", () => {
  assert.equal(CARD_WIDTH, 2024);
  assert.equal(CARD_HEIGHT, 1276);
  assert.ok(Math.abs(CARD_WIDTH / CARD_HEIGHT - 1.586) < 0.001);
});

test("a stored design round-trips and drops image bytes", () => {
  const design = defaultDesign("Marimo");
  design.backgroundUrl = "blob:background";
  design.photo = {
    url: "blob:photo",
    shape: "circle",
    x: 0.8,
    y: 0.28,
    size: 0.3,
  };
  const template = serializeDesign(design);
  assert.equal("backgroundUrl" in template, false);
  assert.equal(template.hasBackgroundImage, true);
  assert.equal(template.photo?.shape, "circle");
  assert.equal(template.name.text, "Marimo");
  const stored = { version: 1 as const, template, back: null };
  assert.deepEqual(parseStoredDesign(stored), stored);
  assert.deepEqual(parseStoredDesign({ version: 1, ...template }), stored);
  assert.equal(parseStoredDesign({ version: 2 }), null);
});

test("the QR is a square on the back, and the front only reserves chip and tap", () => {
  assert.deepEqual(
    FRONT_GUIDES.map((zone) => zone.id),
    ["chip", "tap"],
  );
  assert.ok(Math.abs(BACK_QR.w * CARD_WIDTH - BACK_QR.h * CARD_HEIGHT) < 0.01);
});

test("png dimensions come from the IHDR", () => {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([0, 0, 0, 13], 8);
  bytes.set([73, 72, 68, 82], 12);
  bytes[16] = 0;
  bytes[17] = 0;
  bytes[18] = 7;
  bytes[19] = 232;
  bytes[20] = 0;
  bytes[21] = 0;
  bytes[22] = 4;
  bytes[23] = 252;
  assert.deepEqual(pngSize(bytes), { width: 2024, height: 1276 });
  assert.equal(pngSize(new Uint8Array([1, 2, 3])), null);
});

test("crop zoom covers the frame even when the image is rotated", () => {
  const flat = cropCoverScale(4000, 2000, 2024, 1276, 0);
  assert.ok(flat * 4000 >= 2024);
  assert.ok(flat * 2000 >= 1276);
  const turned = cropCoverScale(4000, 2000, 2024, 1276, 30);
  assert.ok(turned > flat);
});
