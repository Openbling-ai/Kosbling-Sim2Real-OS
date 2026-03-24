import assert from "node:assert/strict";
import test from "node:test";

import type { AppConfig } from "../config.js";
import { BraveSearchProvider } from "./brave-search.js";

test("BraveSearchProvider uses English search language for US market even when UI locale is Chinese", async () => {
  const config: AppConfig = {
    cwd: "/tmp/kosbling-brave-search-test",
    runsDir: "/tmp/kosbling-brave-search-test/runs",
    locale: "zh-CN",
    defaultGeo: "US",
    enableGoogleTrends: false,
    executionMode: "shadow",
    braveSearchApiKey: "test-key",
  };

  let requestedUrl = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input) => {
    requestedUrl = String(input);
    return new Response(
      JSON.stringify({
        web: {
          results: [
            {
              title: "Example result",
              url: "https://example.com",
              description: "Example",
              extra_snippets: [],
            },
          ],
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  try {
    const provider = new BraveSearchProvider(config);
    await provider.search("portable ice bath");
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.get("search_lang"), "en");
  assert.equal(url.searchParams.get("country"), "US");
});
