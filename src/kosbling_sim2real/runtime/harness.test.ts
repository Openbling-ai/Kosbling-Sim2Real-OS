import assert from "node:assert/strict";
import test from "node:test";

import type { ActionProposal, EventEntry } from "../domain.js";
import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import { applyActionsToState, applyEventsToState } from "./harness.js";

test("applyActionsToState updates marketing and inventory state", () => {
  const scenario = createDefaultScenario({
    id: "scenario-1",
    identity: {
      name: "Ice Bath",
      category: "Recovery",
      target_market: "Cold therapy shoppers",
      region: "North America",
    },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-1", scenarioId: scenario.id, scenario, seed: 1 });

  const actions: ActionProposal[] = [
    {
      action_id: "a1",
      actor: "kos-ceo",
      domain: "marketing",
      action_type: "set_total_budget",
      target_type: "budget",
      target_ref: null,
      reason: "Scale carefully",
      payload: { total_daily_budget: 120 },
      risk_level: "medium",
      expected_effect: null,
    },
    {
      action_id: "a2",
      actor: "kos-ceo",
      domain: "supply",
      action_type: "reorder_inventory",
      target_type: "inventory",
      target_ref: null,
      reason: "Restock",
      payload: { quantity: 100, estimated_unit_cost: 50 },
      risk_level: "medium",
      expected_effect: null,
    },
  ];

  applyActionsToState({ state, actions, currentDay: 1 });

  assert.equal(state.marketing.total_daily_budget, 120);
  assert.equal(state.supply_chain.inventory_in_transit, 100);
  assert.equal(state.finance.total_cost, 5000);
});

test("applyEventsToState updates trend and fatigue signals", () => {
  const scenario = createDefaultScenario({
    id: "scenario-2",
    identity: {
      name: "Ice Bath",
      category: "Recovery",
      target_market: "Cold therapy shoppers",
      region: "North America",
    },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-2", scenarioId: scenario.id, scenario, seed: 1 });

  const events: EventEntry[] = [
    {
      event_id: "e1",
      day: 5,
      type: "trend_shift",
      source: "grounding",
      desc: "Trend rises",
      payload: { direction: "up", score_delta: 10 },
      severity: "medium",
    },
    {
      event_id: "e2",
      day: 5,
      type: "creative_fatigue_rise",
      source: "runtime",
      desc: "Fatigue rises",
      payload: { fatigue_delta: 0.2 },
      severity: "medium",
    },
  ];

  applyEventsToState(state, events);

  assert.equal(state.market_data.trends_direction, "up");
  assert.equal(state.market_data.trends_score, 60);
  assert.equal(state.marketing.creative_fatigue, 0.2);
});
