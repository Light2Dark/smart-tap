import assert from "node:assert/strict";
import { test } from "node:test";
import { IMAGE_MAX_BYTES, imageFileProblem } from "./image-upload.ts";

test("PNG, JPEG, and WebP up to 12 MB can be cropped", () => {
  assert.equal(imageFileProblem({ type: "image/png", size: 1000 }), null);
  assert.equal(imageFileProblem({ type: "image/jpeg", size: 1000 }), null);
  assert.equal(
    imageFileProblem({ type: "image/webp", size: IMAGE_MAX_BYTES }),
    null,
  );
});

test("other types and larger files are turned away", () => {
  assert.equal(
    imageFileProblem({ type: "image/gif", size: 1000 }),
    "Use a PNG, JPEG, or WebP image.",
  );
  assert.equal(
    imageFileProblem({ type: "image/png", size: IMAGE_MAX_BYTES + 1 }),
    "That image is larger than 12 MB.",
  );
});
