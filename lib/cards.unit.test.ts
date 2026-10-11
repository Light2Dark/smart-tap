import assert from "node:assert/strict";
import { test } from "node:test";
import {
  destinationUnchanged,
  httpsUrl,
  parseCreateBody,
  parseDestinationBody,
  parseId,
  TITLE_ERROR,
  titleProblem,
} from "./cards.ts";

test("https links are accepted and other schemes are rejected", () => {
  assert.equal(httpsUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(httpsUrl("http://example.com"), null);
  assert.equal(httpsUrl("not a url"), null);
});

test("a new card needs a title and an https destination", () => {
  assert.deepEqual(
    parseCreateBody({
      title: " GitHub ",
      destinationUrl: "https://github.com/Light2Dark",
    }),
    {
      title: "GitHub",
      destinationUrl: "https://github.com/Light2Dark",
    },
  );
  assert.deepEqual(
    parseCreateBody({ title: "", destinationUrl: "https://example.com" }),
    {
      error: "Give the card a title, up to 80 characters.",
    },
  );
  assert.deepEqual(
    parseCreateBody({ title: "Notes", destinationUrl: "http://example.com" }),
    {
      error: "The destination has to be an https link.",
    },
  );
  assert.equal("error" in parseCreateBody(null), true);
});

test("an unchanged destination stays disabled for save", () => {
  assert.equal(
    destinationUnchanged(
      "https://github.com/Light2Dark",
      "https://github.com/Light2Dark",
    ),
    true,
  );
  assert.equal(
    destinationUnchanged(
      "  https://github.com/Light2Dark  ",
      "https://github.com/Light2Dark",
    ),
    true,
  );
  assert.equal(
    destinationUnchanged("https://marimo.io", "https://marimo.io/"),
    true,
  );
  assert.equal(
    destinationUnchanged("https://marimo.io/docs", "https://marimo.io/"),
    false,
  );
});

test("card ids are positive whole numbers", () => {
  assert.equal(parseId("42"), 42);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("-1"), null);
  assert.equal(parseId("1.5"), null);
  assert.equal(parseId("abc"), null);
  assert.equal(parseId("99999999999999999999"), null);
});

test("titles are 1 to 80 characters after trimming", () => {
  assert.equal(titleProblem("GitHub"), null);
  assert.equal(titleProblem("   "), TITLE_ERROR);
  assert.equal(titleProblem("x".repeat(81)), TITLE_ERROR);
});

test("destination edits must stay on https", () => {
  const parsed = parseDestinationBody({ destinationUrl: "https://marimo.io" });
  assert.equal("destinationUrl" in parsed, true);
  if ("destinationUrl" in parsed) {
    assert.match(parsed.destinationUrl, /^https:\/\/marimo\.io\/?$/);
  }
  assert.deepEqual(parseDestinationBody({ destinationUrl: "mailto:a@b.co" }), {
    error: "The destination has to be an https link.",
  });
});
