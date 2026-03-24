import assert from "node:assert/strict";
import test from "node:test";

import { createBraveOnlySnapshot } from "./google-trends.js";

test("createBraveOnlySnapshot returns degraded but real grounding metadata", () => {
  const snapshot = createBraveOnlySnapshot({
    query: "portable ice bath",
    geo: "US",
    braveSnapshot: {
      query: "portable ice bath ecommerce competitor pricing demand",
      results: [
        {
          title: "Example result",
          url: "https://example.com",
          description: "Portable ice bath pricing and competitor guide",
          extraSnippets: [],
        },
      ],
    },
  });

  assert.equal(snapshot.source, "brave-web");
  assert.equal(snapshot.query, "portable ice bath");
  assert.equal(snapshot.webContext.length, 1);
  assert.equal(snapshot.competitivePosture.length > 0, true);
});
