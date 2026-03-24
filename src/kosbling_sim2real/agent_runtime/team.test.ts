import assert from "node:assert/strict";
import test from "node:test";

import type { ActionProposal, CommerceWorldState } from "../domain.js";
import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import type { HandoffStatus, RolePlan } from "./contracts.js";
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
      handoffs: [
        {
          handoffId: "handoff-marketing-1-1",
          fromRole: "marketing",
          toRole: "finance",
          note: "Review paid budget discipline before scaling.",
        },
      ],
      resolvedHandoffIds: [],
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
      handoffs: [
        {
          handoffId: "handoff-supply-1-1",
          fromRole: "supply",
          toRole: "finance",
          note: "Pressure-test cash impact of the reorder.",
        },
      ],
      resolvedHandoffIds: [],
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
      handoffs: [],
      resolvedHandoffIds: [],
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
        recentTeamMemory: string;
        openHandoffs: HandoffStatus[];
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
    recentTeamMemory: "No prior team memory.",
    openHandoffs: [],
  });

  assert.equal(result.rolePlans.length, 2);
  assert.equal(seenPlans.length, 2);
  assert.equal(result.summary, "CEO merged the specialist plans.");
  assert.equal(result.actions.length, 1);
  assert.equal(result.rolePlans[0]?.role, "marketing");
  assert.equal(result.rolePlans[1]?.role, "supply");
  assert.equal(result.rationale, "Keep launch conservative while protecting inventory continuity.");
});

test("MultiAgentActionOrchestrator isolates a failed role and continues with the remaining plans", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-team-failure",
    identity: { name: "TeamBath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    business: { product_name: "Team Bath", product_category: "Recovery Tub", positioning: "Team test", initial_price: 99, unit_cost: 45 },
    budget: { starting_budget: 2000, reserve_cash: 300, daily_budget_cap: 50 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-team-failure", scenarioId: scenario.id, scenario, seed: 1 });

  const seenErrors: Array<{ role: string; message: string }> = [];
  const orchestrator = new MultiAgentActionOrchestrator(
    {
      mergeRolePlans: async (params: {
        state: CommerceWorldState;
        bossMessage: string;
        stageStartDay: number;
        stageEndDay: number;
        recentTeamMemory: string;
        openHandoffs: HandoffStatus[];
        rolePlans: RolePlan[];
      }): Promise<{ summary: string; rationale: string; actions: ActionProposal[] }> => {
        assert.equal(params.rolePlans.length, 1);
        assert.equal(params.rolePlans[0]?.role, "marketing");
        return {
          summary: "CEO merged the surviving specialist plan.",
          rationale: "Proceed with the valid proposal while logging the failed role.",
          actions: [],
        };
      },
    },
    [
      {
        proposeRoleActions: async () => ({
          role: "marketing",
          roleLabel: "Growth and Paid Media",
          summary: "Marketing wants a cautious launch.",
          watchouts: [],
          handoffs: [],
          resolvedHandoffIds: [],
          actions: [],
        }),
      },
      {
        proposeRoleActions: async () => {
          throw new Error("Finance tool JSON was invalid.");
        },
      },
    ],
  );

  const result = await orchestrator.proposeActions({
    state,
    bossMessage: "Start carefully and avoid stockouts.",
    stageStartDay: 1,
    stageEndDay: 5,
    recentTeamMemory: "No prior team memory.",
    openHandoffs: [],
    onRoleError: (role, error) => {
      seenErrors.push({ role: role.role, message: error.message });
    },
  });

  assert.equal(result.rolePlans.length, 1);
  assert.equal(result.roleRuns.length, 2);
  assert.equal(result.roleRuns[0]?.status, "success");
  assert.equal(result.roleRuns[1]?.status, "failed");
  assert.equal(result.roleRuns[1]?.errorMessage, "Finance tool JSON was invalid.");
  assert.equal(seenErrors.length, 1);
  assert.equal(seenErrors[0]?.message, "Finance tool JSON was invalid.");
  assert.equal(result.summary, "CEO merged the surviving specialist plan.");
  assert.equal(result.actions.length, 0);
});
