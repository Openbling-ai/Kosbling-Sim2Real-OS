import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import { shouldAutoStartFirstChunk } from "./app.js";

test("shouldAutoStartFirstChunk only triggers for the first chunk after snapshot approval", () => {
  const scenario = createDefaultScenario({
    id: "scenario-cli-auto-start",
    identity: {
      name: "AutoStart Bath",
      category: "Recovery",
      target_market: "Cold therapy shoppers",
      region: "North America",
    },
    simulation: {
      total_days: 30,
      chunk_days: 5,
      mode: "shadow",
    },
  });
  const state = createInitialWorldState({
    sessionId: "session-cli-auto-start",
    scenarioId: scenario.id,
    scenario,
    seed: 1,
  });

  assert.equal(
    shouldAutoStartFirstChunk(
      {
        launchFromSnapshot: true,
        state,
        chunkHistory: [],
      },
      1,
    ),
    true,
  );

  assert.equal(
    shouldAutoStartFirstChunk(
      {
        launchFromSnapshot: false,
        state,
        chunkHistory: [],
      },
      1,
    ),
    false,
  );

  assert.equal(
    shouldAutoStartFirstChunk(
      {
        launchFromSnapshot: true,
        state: {
          ...state,
          meta: {
            ...state.meta,
            current_day: 5,
          },
        },
        chunkHistory: [],
      },
      6,
    ),
    false,
  );
});
