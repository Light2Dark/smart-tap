import assert from "node:assert/strict";
import { test } from "node:test";
import { CARD_COLORS, cardColor, javaStringHash } from "./card-palette.ts";

test("the title hash matches Java's String.hashCode", () => {
  assert.equal(javaStringHash(""), 0);
  assert.equal(javaStringHash("hello"), 99162322);
  assert.equal(javaStringHash("polygenelubricants"), -2147483648);
});

test("a title always gets the same palette color, ignoring case", () => {
  assert.equal(cardColor("GitHub"), cardColor("github"));
  assert.ok(CARD_COLORS.includes(cardColor("Calendar")));
  assert.ok(CARD_COLORS.includes(cardColor("polygenelubricants")));
});
