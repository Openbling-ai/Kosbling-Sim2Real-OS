import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import type { AppConfig } from "../config.js";
import { createDefaultScenario } from "../helpers.js";
import { createBraveOnlySnapshot } from "./google-trends.js";
import { GoogleTrendsGroundingProvider } from "./google-trends.js";

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

test("groundScenario uses Brave-only grounding by default when Google Trends is disabled", async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), "kosbling-grounding-test-"));
  const config: AppConfig = {
    cwd,
    runsDir: path.join(cwd, "runs"),
    locale: "en-US",
    defaultGeo: "US",
    enableGoogleTrends: false,
    executionMode: "shadow",
    braveSearchApiKey: "test-key",
  };

  const provider = new GoogleTrendsGroundingProvider(config);
  ((provider as unknown) as { buildWebContext: (query: string) => Promise<{ query: string; results: Array<{ title: string; url: string; description: string; extraSnippets: string[] }> } | null> }).buildWebContext =
    async (query: string) => ({
      query,
      results: [
        {
          title: "Example result",
          url: "https://example.com",
          description: "Portable ice bath pricing and competitor guide",
          extraSnippets: [],
        },
      ],
    });

  const scenario = createDefaultScenario({
    id: "scenario-grounding-brave-only",
    identity: {
      name: "ArcticPlunge",
      category: "Recovery",
      target_market: "Cold therapy shoppers",
      region: "North America",
    },
    business: {
      product_name: "Portable Ice Bath",
      product_category: "Recovery Tub",
      positioning: "Entry luxury",
      initial_price: 149,
      unit_cost: 70,
    },
  });

  const snapshot = await provider.groundScenario(scenario);

  assert.equal(snapshot.source, "brave-web");
  assert.equal(snapshot.query, "Portable Ice Bath");
  assert.equal(snapshot.webContext.length, 1);
});
