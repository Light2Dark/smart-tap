import assert from "node:assert/strict";
import { test } from "node:test";
import { qrModules } from "./qr-matrix.ts";
import { tapUrl } from "./tap-url.ts";

test("a card link becomes a scannable QR symbol", () => {
  const url = tapUrl("400c6b7b4660b7a09dcb8aae");
  assert.equal(
    url,
    "https://smart-tap-woad.vercel.app/t/400c6b7b4660b7a09dcb8aae",
  );
  const modules = qrModules(url);
  assert.ok(modules.length >= 21);
  assert.equal(modules.length, modules[0]?.length);
  assert.equal(modules[0]?.[0], true);
});
