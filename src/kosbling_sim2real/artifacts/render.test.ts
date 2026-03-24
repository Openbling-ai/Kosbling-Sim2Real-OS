import assert from "node:assert/strict";
import test from "node:test";

import { renderChunkUpdate, renderFinalBattleReport, renderMarketSnapshot, renderTeamTrace } from "./render.js";

test("renderMarketSnapshot localizes Chinese labels", () => {
  const markdown = renderMarketSnapshot({
    artifact_id: "a1",
    type: "market_snapshot",
    created_at_day: 0,
    title: "Ice Bath market snapshot",
    summary: "summary",
    recommendation_summary: "recommendation",
    next_decision_options: ["Start"],
    market_heat: 55,
    trend_direction: "up",
    indicative_cost_posture: "Warm",
    indicative_competitive_posture: "Crowded",
  }, "zh-CN");

  assert.equal(markdown.includes("市场热度"), true);
  assert.equal(markdown.includes("Ice Bath 市场快照"), true);
});

test("renderChunkUpdate localizes Chinese operational labels", () => {
  const markdown = renderChunkUpdate({
    artifact_id: "a2",
    type: "chunk_update",
    created_at_day: 5,
    title: "Chunk 1 update",
    summary: "chunk summary",
    day_start: 1,
    day_end: 5,
    orders: 12,
    revenue: 1000,
    total_cost: 700,
    gross_profit: 300,
    balance: 5300,
    inventory_in_stock: 20,
    inventory_in_transit: 30,
    stock_pressure_level: "medium",
    biggest_win: "win",
    biggest_risk: "risk",
    best_channel: "tiktok",
    best_creative: null,
    decision_point: "hold",
  }, "zh-CN");

  assert.equal(markdown.includes("第 1 段更新"), true);
  assert.equal(markdown.includes("订单数"), true);
  assert.equal(markdown.includes("库存"), true);
});

test("renderFinalBattleReport localizes Chinese recap labels", () => {
  const markdown = renderFinalBattleReport({
    artifact_id: "a3",
    type: "final_battle_report",
    created_at_day: 30,
    title: "Final battle report",
    summary: "done",
    starting_budget: 5000,
    ending_balance: 6200,
    total_orders: 80,
    total_revenue: 10000,
    total_cost: 7800,
    gross_profit: 2200,
    best_channel: "facebook",
    best_creative: "creator-led",
    biggest_mistake: "mistake",
    biggest_winning_decision: "decision",
    recommended_next_move: "next",
    key_decision_recaps: ["one"],
    counterfactuals: ["two"],
  }, "zh-CN");

  assert.equal(markdown.includes("最终战报"), true);
  assert.equal(markdown.includes("关键决策回顾"), true);
});

test("renderTeamTrace includes Chinese role collaboration labels", () => {
  const markdown = renderTeamTrace({
    chunkNumber: 1,
    bossMessage: "先保守启动",
    rolePlans: [
      {
        role: "marketing",
        roleLabel: "增长与投放",
        summary: "先用小预算试水。",
        watchouts: ["创意疲劳还不高，但不要过早扩量。"],
        handoffs: [
          {
            handoffId: "handoff-marketing-1-1",
            fromRole: "marketing",
            toRole: "finance",
            note: "请财务继续盯住测试预算。",
          },
        ],
        resolvedHandoffIds: [],
        actions: [
          {
            action_type: "set_total_budget",
            domain: "marketing",
            reason: "先保护现金",
            risk_level: "low",
            payload: { total_daily_budget: 60 },
          },
        ],
      },
    ],
    roleRuns: [
      {
        role: "marketing",
        roleLabel: "增长与投放",
        status: "success",
        summary: "Marketing wants a cautious launch.",
        actionCount: 1,
        watchoutCount: 1,
        handoffCount: 1,
        resolvedHandoffCount: 0,
      },
      {
        role: "finance",
        roleLabel: "财务护栏",
        status: "failed",
        summary: "",
        actionCount: 0,
        watchoutCount: 0,
        handoffCount: 0,
        resolvedHandoffCount: 0,
        errorMessage: "Finance tool JSON was invalid.",
      },
    ],
    actionSummary: "Kos 选择先保守投放。",
    mergeRationale: "先以现金安全和小步试错为主。",
    actions: [
      {
        action_id: "a1",
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "set_total_budget",
        target_type: "budget",
        target_ref: null,
        reason: "先保护现金",
        payload: { total_daily_budget: 60 },
        risk_level: "low",
        expected_effect: null,
      },
    ],
    executionSummary: "执行 agent 已按顺序落动作。",
    executionActionIds: ["a1"],
    executionResults: [
      {
        execution_id: "e1",
        action_id: "a1",
        status: "completed",
        mode: "shadow",
        summary: "Updated total daily marketing budget.",
        applied_effects: ["Updated total daily marketing budget."],
        external_refs: [],
      },
    ],
    openHandoffs: [
      {
        handoffId: "handoff-marketing-1-1",
        fromRole: "marketing",
        toRole: "finance",
        note: "请财务继续盯住测试预算。",
        createdChunkNumber: 1,
        createdStageStartDay: 1,
        createdStageEndDay: 5,
        ageInChunks: 3,
        priority: "stale",
        isStale: true,
      },
    ],
    locale: "zh-CN",
  });

  assert.equal(markdown.includes("第 1 段团队协作记录"), true);
  assert.equal(markdown.includes("角色提案"), true);
  assert.equal(markdown.includes("CEO 合并结果"), true);
  assert.equal(markdown.includes("执行器结果"), true);
  assert.equal(markdown.includes("角色执行日志"), true);
  assert.equal(markdown.includes("未完成交接"), true);
});
