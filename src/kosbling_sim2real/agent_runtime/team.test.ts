import assert from "node:assert/strict";
import test from "node:test";

import type { ActionProposal, CommerceWorldState } from "../domain.js";
import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import type { RolePlan } from "./contracts.js";
import { MultiAgentActionOrchestrator } from "./team.js";

test("MultiAgentActionOrchestrator gathers role plans and delegates merge to CEO", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-team",
    identity: { name: "TeamBath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    business: { product_name: "Team Bath", product_category: "Recovery Tub", positioning: "Team test", initial_price: 99, unit_cost: 45 },
    budget: { starting_budget: 2000, reserve_cash: 300, daily_budget_cap: 50 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-team", scenarioId: scenario.id, scenario, seed: 1 });

  const rolePlans: RolePlan[] = [
    {
      role: "marketing",
      roleLabel: "Growth and Paid Media",
      summary: "Marketing wants a cautious launch.",
      watchouts: ["Do not scale spend before creative learns."],
      actions: [
        {
          action_type: "set_total_budget",
          domain: "marketing",
          reason: "Protect early learning budget",
          risk_level: "low",
          payload: { total_daily_budget: 40 },
        },
      ],
    },
    {
      role: "supply",
      roleLabel: "Supply Chain Ops",
      summary: "Supply wants a small reorder.",
      watchouts: ["Inventory coverage tight by week two."],
      actions: [
        {
          action_type: "reorder_inventory",
          domain: "supply",
          reason: "Avoid a week-two stockout",
          risk_level: "medium",
          payload: { quantity: 30, estimated_unit_cost: 42 },
        },
      ],
    },
    {
      role: "finance",
      roleLabel: "Finance Guard",
      summary: "",
      watchouts: [],
      actions: [],
    },
  ];

  const seenPlans: RolePlan[] = [];
  const orchestrator = new MultiAgentActionOrchestrator(
    {
      mergeRolePlans: async (params: {
        state: CommerceWorldState;
        bossMessage: string;
        stageStartDay: number;
        stageEndDay: number;
        rolePlans: RolePlan[];
      }): Promise<{ summary: string; rationale: string; actions: ActionProposal[] }> => {
        seenPlans.push(...params.rolePlans);
        return {
          summary: "CEO merged the specialist plans.",
          rationale: "Keep launch conservative while protecting inventory continuity.",
          actions: [
            {
              action_id: "final-1",
              actor: "kos-ceo",
              domain: "marketing",
              action_type: "set_total_budget",
              target_type: "budget",
              target_ref: null,
              reason: "Protect early learning budget",
              payload: { total_daily_budget: 40 },
              risk_level: "low",
              expected_effect: null,
            },
          ],
        };
      },
    },
    rolePlans.map((plan) => ({
      proposeRoleActions: async () => plan,
    })),
  );

  const result = await orchestrator.proposeActions({
    state,
    bossMessage: "Start carefully and avoid stockouts.",
    stageStartDay: 1,
    stageEndDay: 5,
  });

  assert.equal(result.rolePlans.length, 2);
  assert.equal(seenPlans.length, 2);
  assert.equal(result.summary, "CEO merged the specialist plans.");
  assert.equal(result.actions.length, 1);
  assert.equal(result.rolePlans[0]?.role, "marketing");
  assert.equal(result.rolePlans[1]?.role, "supply");
  assert.equal(result.rationale, "Keep launch conservative while protecting inventory continuity.");
});
