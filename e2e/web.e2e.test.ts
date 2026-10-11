import assert from "node:assert/strict";
import { test } from "node:test";

const base = process.env.SMART_TAP_E2E_URL ?? "http://127.0.0.1:3000";

test("the home page loads", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Smart Tap/);
});

test("an unknown tap link says the card is off", async () => {
  const response = await fetch(`${base}/t/not-a-real-card`);
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.match(html, /This card is off/);
});

test("the card list rejects a signed-out phone", async () => {
  const response = await fetch(`${base}/api/cards`);
  assert.equal(response.status, 401);
  const body = (await response.json()) as { error?: string };
  assert.equal(body.error, "Sign in required.");
});
