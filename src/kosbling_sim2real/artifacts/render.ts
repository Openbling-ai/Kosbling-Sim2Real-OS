import type { RolePlan, RoleRunRecord } from "../agent_runtime/contracts.js";
import type { ActionProposal, ChunkUpdateArtifact, ExecutionResult, FinalBattleReportArtifact, MarketSnapshotArtifact } from "../domain.js";
import type { HandoffStatus } from "../agent_runtime/contracts.js";
import { getI18n } from "../i18n.js";

export function renderMarketSnapshot(artifact: MarketSnapshotArtifact, locale = "en-US"): string {
  const t = getI18n(locale);
  return [
    `# ${t.marketSnapshotTitle(artifact.title)}`,
    "",
    `- ${t.marketHeat}: ${formatMaybeNumber(artifact.market_heat, locale)}`,
    `- ${t.trendDirection}: ${t.direction(artifact.trend_direction)}`,
    `- ${t.costPosture}: ${artifact.indicative_cost_posture}`,
    `- ${t.competitionPosture}: ${artifact.indicative_competitive_posture}`,
    "",
    `${t.kosTake}: ${artifact.recommendation_summary}`,
    "",
    `${t.nextOptions}:`,
    ...artifact.next_decision_options.map((option) => `- ${option}`),
  ].join("\n");
}

export function renderChunkUpdate(artifact: ChunkUpdateArtifact, locale = "en-US"): string {
  const t = getI18n(locale);
  return [
    `# ${t.chunkTitle(artifact.title)}`,
    "",
    `${t.stage}: day ${artifact.day_start}-${artifact.day_end}`,
    `${t.orders}: ${artifact.orders}`,
    `${t.revenue}: $${artifact.revenue.toFixed(2)}`,
    `${t.totalCost}: $${artifact.total_cost.toFixed(2)}`,
    `${t.grossProfit}: $${artifact.gross_profit.toFixed(2)}`,
    `${t.balance}: $${artifact.balance.toFixed(2)}`,
    `${t.inventory}: ${t.inStockTransit(artifact.inventory_in_stock, artifact.inventory_in_transit)}`,
    `${t.bestChannel}: ${artifact.best_channel ?? t.na}`,
    `${t.bestCreative}: ${artifact.best_creative ?? t.na}`,
    "",
    `${t.biggestWin}: ${artifact.biggest_win}`,
    `${t.biggestRisk}: ${artifact.biggest_risk}`,
    `${t.decisionPoint}: ${artifact.decision_point}`,
    "",
    `${t.kosNote}: ${artifact.summary}`,
  ].join("\n");
}

export function renderFinalBattleReport(artifact: FinalBattleReportArtifact, locale = "en-US"): string {
  const t = getI18n(locale);
  return [
    `# ${t.finalTitle(artifact.title)}`,
    "",
    `${t.startingBudgetEndingBalance}: $${artifact.starting_budget.toFixed(2)} -> $${artifact.ending_balance.toFixed(2)}`,
    `${t.totalOrders}: ${artifact.total_orders}`,
    `${t.revenue}: $${artifact.total_revenue.toFixed(2)}`,
    `${t.totalCost}: $${artifact.total_cost.toFixed(2)}`,
    `${t.grossProfit}: $${artifact.gross_profit.toFixed(2)}`,
    `${t.bestChannel}: ${artifact.best_channel ?? t.na}`,
    `${t.bestCreative}: ${artifact.best_creative ?? t.na}`,
    "",
    `${t.biggestMistake}: ${artifact.biggest_mistake}`,
    `${t.biggestWinningDecision}: ${artifact.biggest_winning_decision}`,
    `${t.recommendedNextMove}: ${artifact.recommended_next_move}`,
    "",
    `${t.keyDecisionRecap}:`,
    ...artifact.key_decision_recaps.map((item) => `- ${item}`),
    "",
    `${t.counterfactuals}:`,
    ...artifact.counterfactuals.map((item) => `- ${item}`),
  ].join("\n");
}

export function renderTeamTrace(params: {
  chunkNumber: number;
  bossMessage: string;
  rolePlans: RolePlan[];
  roleRuns?: RoleRunRecord[];
  actionSummary: string;
  mergeRationale: string;
  actions: ActionProposal[];
  executionSummary: string;
  executionActionIds: string[];
  executionResults: ExecutionResult[];
  openHandoffs: HandoffStatus[];
  locale?: string;
}): string {
  const zh = (params.locale ?? "en-US").toLowerCase().startsWith("zh");
  const rolePlans = params.rolePlans.length > 0
    ? params.rolePlans.flatMap((plan) => renderRolePlan(plan, zh))
    : [zh ? "- 本阶段没有角色提案。" : "- No role proposals were recorded for this chunk."];
  const roleRuns = params.roleRuns && params.roleRuns.length > 0
    ? params.roleRuns.map((run) => renderRoleRun(run, zh))
    : [zh ? "- 没有角色执行日志。" : "- No role execution logs were recorded."];
  const approvedActions = params.actions.length > 0
    ? params.actions.map((action) => `- \`${action.action_type}\` [${action.domain}] ${action.reason}${renderPayloadSuffix(action.payload)}`)
    : [zh ? "- 无批准动作。" : "- No approved actions."];
  const executionResults = params.executionResults.length > 0
    ? params.executionResults.map((result) => `- \`${result.status}\` ${result.summary}`)
    : [zh ? "- 无执行结果。" : "- No execution results."];
  const openHandoffs = params.openHandoffs.length > 0
    ? params.openHandoffs.map((handoff) => renderHandoffStatus(handoff, zh))
    : [zh ? "- 无未完成交接。" : "- No open handoffs."];

  return [
    `# ${zh ? `第 ${params.chunkNumber} 段团队协作记录` : `Chunk ${params.chunkNumber} team trace`}`,
    "",
    `${zh ? "老板消息" : "Boss message"}: ${params.bossMessage}`,
    "",
    `## ${zh ? "角色提案" : "Role proposals"}`,
    ...rolePlans,
    "",
    `## ${zh ? "角色执行日志" : "Role execution log"}`,
    ...roleRuns,
    "",
    `## ${zh ? "CEO 合并结果" : "CEO merge"}`,
    `${zh ? "行动摘要" : "Action summary"}: ${params.actionSummary}`,
    `${zh ? "合并理由" : "Merge rationale"}: ${params.mergeRationale}`,
    "",
    `${zh ? "批准动作" : "Approved actions"}:`,
    ...approvedActions,
    "",
    `## ${zh ? "执行器结果" : "Execution"}`,
    `${zh ? "执行摘要" : "Execution summary"}: ${params.executionSummary}`,
    `${zh ? "执行顺序" : "Execution order"}: ${params.executionActionIds.length > 0 ? params.executionActionIds.join(", ") : (zh ? "无" : "none")}`,
    "",
    `${zh ? "执行结果" : "Execution results"}:`,
    ...executionResults,
    "",
    `${zh ? "未完成交接" : "Open handoffs"}:`,
    ...openHandoffs,
  ].join("\n");
}

function formatMaybeNumber(value: number | null, locale = "en-US"): string {
  return value == null ? getI18n(locale).na : String(value);
}

function renderRolePlan(plan: RolePlan, zh: boolean): string[] {
  const actions = plan.actions.length > 0
    ? plan.actions.map((action) => `- \`${action.action_type}\` [${action.domain}] ${action.reason}${renderPayloadSuffix(action.payload)}`)
    : [zh ? "- 无动作建议。" : "- No action suggested."];
  const watchouts = plan.watchouts.length > 0
    ? plan.watchouts.map((item) => `- ${item}`)
    : [zh ? "- 无额外提醒。" : "- No additional watchouts."];
  const handoffs = plan.handoffs.length > 0
    ? [
      `${zh ? "发起交接" : "New handoffs"}:`,
      ...plan.handoffs.map((handoff) => `- \`${handoff.handoffId}\` ${handoff.fromRole} -> ${handoff.toRole}: ${handoff.note}`),
    ]
    : [`${zh ? "发起交接" : "New handoffs"}: ${zh ? "无" : "none"}`];
  const resolutions = plan.resolvedHandoffIds.length > 0
    ? [`${zh ? "本轮回执" : "Resolved handoffs"}: ${plan.resolvedHandoffIds.join(", ")}`]
    : [`${zh ? "本轮回执" : "Resolved handoffs"}: ${zh ? "无" : "none"}`];

  return [
    `### ${plan.roleLabel} (\`${plan.role}\`)`,
    `${zh ? "摘要" : "Summary"}: ${plan.summary}`,
    `${zh ? "提醒" : "Watchouts"}:`,
    ...watchouts,
    ...handoffs,
    ...resolutions,
    `${zh ? "建议动作" : "Suggested actions"}:`,
    ...actions,
    "",
  ];
}

function renderRoleRun(run: RoleRunRecord, zh: boolean): string {
  const status = run.status === "failed"
    ? (zh ? "失败" : "failed")
    : (zh ? "成功" : "success");
  const details = run.status === "failed"
    ? (run.errorMessage ?? (zh ? "未知错误" : "unknown error"))
    : `${run.actionCount} actions, ${run.watchoutCount} watchouts, ${run.handoffCount} handoffs`;
  return zh
    ? `- \`${run.roleLabel}\` (\`${run.role}\`) ${status} | ${details}`
    : `- \`${run.roleLabel}\` (\`${run.role}\`) ${status} | ${details}`;
}

function renderPayloadSuffix(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  const payloadRecord = payload as Record<string, unknown>;
  if (Object.keys(payloadRecord).length === 0) {
    return "";
  }

  return ` ${JSON.stringify(payloadRecord)}`;
}

function renderHandoffStatus(handoff: HandoffStatus, zh: boolean): string {
  const status = handoff.isStale
    ? (zh ? "stale 升级" : "stale escalation")
    : (zh ? "active" : "active");
  const age = zh ? `${handoff.ageInChunks} 段未回执` : `${handoff.ageInChunks} chunk(s) open`;
  return zh
    ? `- \`${handoff.handoffId}\` ${status} | ${age} | 优先级 ${handoff.priority} | ${handoff.fromRole} -> ${handoff.toRole}: ${handoff.note}`
    : `- \`${handoff.handoffId}\` ${status} | ${age} | priority ${handoff.priority} | ${handoff.fromRole} -> ${handoff.toRole}: ${handoff.note}`;
}
