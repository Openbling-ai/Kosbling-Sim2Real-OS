import assert from "node:assert/strict";
import test from "node:test";

import { buildDynamicModelsConfig } from "./pi.js";

test("buildDynamicModelsConfig includes custom provider routing", () => {
  const config = buildDynamicModelsConfig({
    providerName: "anthropic",
    modelBaseUrl: "https://api.example.com",
    modelId: "claude-sonnet-4.6",
  });

  assert.deepEqual(config, {
    providers: {
      anthropic: {
        baseUrl: "https://api.example.com",
        api: "anthropic-messages",
        apiKey: "KOSBLING_MODEL_API_KEY",
        models: [{ id: "claude-sonnet-4.6" }],
      },
    },
  });
});
