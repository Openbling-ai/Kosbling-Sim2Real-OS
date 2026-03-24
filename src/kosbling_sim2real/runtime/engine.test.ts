import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import { executeStage, initializeStateFromGrounding } from "./engine.js";

test("executeStage produces deterministic chunk economics", () => {
  const scenario = createDefaultScenario({
    id: "scenario-3",
    identity: { name: "ArcticPlunge", category: "Recovery", target_market: "Cold therapy curious shoppers", region: "North America" },
    business: {
      product_name: "Portable Ice Bath",
      product_category: "Recovery Tub",
      positioning: "Entry luxury at-home recovery",
      initial_price: 149,
      unit_cost: 75,
    },
    budget: { starting_budget: 5000, reserve_cash: 750, daily_budget_cap: 100 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });

  const state = createInitialWorldState({ sessionId: "session-3", scenarioId: scenario.id, scenario, seed: 1 });
  initializeStateFromGrounding(state, scenario, {
    source: "google-trends+brave",
    query: "portable ice bath",
    geo: "US",
    trendsScore: 60,
    trendsDirection: "up",
    seasonalFactor: 1.05,
    topRegions: [],
    relatedQueries: ["ice bath tub"],
    relatedTopics: ["cold plunge"],
    competitivePosture: "Crowded but validated demand.",
    indicativeCostPosture: "Demand is warm.",
    webContext: [],
  });

  const outcome = executeStage({
    state,
    stageStartDay: 1,
    stageEndDay: 5,
  });

  assert.equal(outcome.orders > 0, true);
  assert.equal(outcome.revenue > 0, true);
  assert.equal(outcome.total_cost_delta > outcome.ad_spend, true);
  assert.equal(state.finance.total_revenue, outcome.revenue);
  assert.equal(state.meta.current_day, 5);
});

test("executeStage respects cash reserve when pacing ad spend", () => {
  const scenario = createDefaultScenario({
    id: "scenario-4",
    identity: { name: "LeanBath", category: "Recovery", target_market: "Budget cold plunge shoppers", region: "North America" },
    business: {
      product_name: "Compact Ice Tub",
      product_category: "Recovery Tub",
      positioning: "Cash-conscious testing",
      initial_price: 99,
      unit_cost: 48,
    },
    budget: { starting_budget: 1000, reserve_cash: 950, daily_budget_cap: 200 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });

  const state = createInitialWorldState({ sessionId: "session-4", scenarioId: scenario.id, scenario, seed: 1 });
  initializeStateFromGrounding(state, scenario, {
    source: "google-trends+brave",
    query: "compact ice tub",
    geo: "US",
    trendsScore: 52,
    trendsDirection: "flat",
    seasonalFactor: 1,
    topRegions: [],
    relatedQueries: ["portable cold plunge"],
    relatedTopics: ["ice bath"],
    competitivePosture: "Moderate competition signal with some visible market proof.",
    indicativeCostPosture: "Commercial intent is visible, but demand looks moderate enough for disciplined testing.",
    webContext: [],
  });

  const outcome = executeStage({
    state,
    stageStartDay: 1,
    stageEndDay: 5,
  });

  assert.equal(outcome.ad_spend <= 50, true);
  assert.equal(outcome.biggest_risk?.includes("Cash reserve"), true);
  assert.equal(state.finance.balance >= 0, true);
});

test("initializeStateFromGrounding uses grounded price signals when available", () => {
  const scenario = createDefaultScenario({
    id: "scenario-5",
    identity: { name: "SignalBath", category: "Recovery", target_market: "Price-sensitive shoppers", region: "North America" },
    business: {
      product_name: "Signal Ice Tub",
      product_category: "Recovery Tub",
      positioning: "Mid-market",
      initial_price: 149,
      unit_cost: 70,
    },
    budget: { starting_budget: 3000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });

  const state = createInitialWorldState({ sessionId: "session-5", scenarioId: scenario.id, scenario, seed: 1 });
  initializeStateFromGrounding(state, scenario, {
    source: "google-trends+brave",
    query: "signal ice tub",
    geo: "US",
    trendsScore: 55,
    trendsDirection: "flat",
    seasonalFactor: 1,
    topRegions: [],
    relatedQueries: [],
    relatedTopics: [],
    competitivePosture: "Moderate competition signal with some visible market proof.",
    indicativeCostPosture: "Commercial intent is visible, but demand looks moderate enough for disciplined testing.",
    webContext: [
      { title: "Signal Ice Tub sale", url: "https://example.com/a", note: "Top competitor offer at $129 today" },
      { title: "Another listing", url: "https://example.com/b", note: "Bundle available for $139 with cover" },
    ],
  });

  assert.equal(state.market_data.avg_competitor_price, 139);
});
