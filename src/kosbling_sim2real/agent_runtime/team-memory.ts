import type { HandoffStatus, PendingHandoff, RolePlan, TeamRole } from "./contracts.js";
import type { ChunkExecution } from "../runtime/engine.js";

export function buildRecentTeamMemory(params: {
  chunkHistory: ChunkExecution[];
  locale: string;
  openHandoffs?: HandoffStatus[];
  limit?: number;
}): string {
  const { chunkHistory, locale } = params;
  const zh = locale.toLowerCase().startsWith("zh");
  const recentChunks = chunkHistory.slice(-Math.max(0, params.limit ?? 2));
  const openHandoffs = params.openHandoffs ?? [];

  const sections: string[] = [];

  if (recentChunks.length === 0) {
    sections.push(zh ? "暂无历史团队记忆。这是当前 run 的第一段。" : "No prior team memory. This is the first chunk of the current run.");
  } else {
    sections.push(
      ...recentChunks.map((chunk) => {
        const roleSignals = chunk.rolePlans.map((plan) => summarizeRolePlan(plan, zh)).join(" | ");

        return zh
          ? `第 ${chunk.chunkNumber} 段（第 ${chunk.stageStartDay}-${chunk.stageEndDay} 天）| 老板消息：${chunk.bossMessage} | CEO：${chunk.actionSummary} | 理由：${chunk.mergeRationale} | 执行：${chunk.executionSummary} | 风险：${chunk.outcome.biggest_risk ?? "无"} | 亮点：${chunk.outcome.biggest_win ?? "无"} | 角色信号：${roleSignals}`
          : `Chunk ${chunk.chunkNumber} (day ${chunk.stageStartDay}-${chunk.stageEndDay}) | Boss: ${chunk.bossMessage} | CEO: ${chunk.actionSummary} | Rationale: ${chunk.mergeRationale} | Execution: ${chunk.executionSummary} | Risk: ${chunk.outcome.biggest_risk ?? "n/a"} | Win: ${chunk.outcome.biggest_win ?? "n/a"} | Role signals: ${roleSignals}`;
      }),
    );
  }

  if (openHandoffs.length > 0) {
    const stale = openHandoffs.filter((handoff) => handoff.isStale);
    sections.push("");
    sections.push(zh ? "当前交接待办：" : "Current handoff backlog:");
    sections.push(summarizeOpenHandoffs({ openHandoffs, locale }));
    if (stale.length > 0) {
      sections.push("");
      sections.push(zh ? "交接升级提醒：" : "Handoff escalation:");
      sections.push(summarizeStaleHandoffs({ openHandoffs, locale }));
    }
  }

  return sections.join("\n");
}

export function buildOpenHandoffs(chunkHistory: ChunkExecution[], currentChunkNumber = chunkHistory.length + 1): HandoffStatus[] {
  const resolved = new Set<string>();
  const pending: PendingHandoff[] = [];

  for (const chunk of chunkHistory) {
    for (const plan of chunk.rolePlans) {
      for (const handoffId of plan.resolvedHandoffIds) {
        resolved.add(handoffId);
      }
      for (const handoff of plan.handoffs) {
        pending.push({
          ...handoff,
          createdChunkNumber: chunk.chunkNumber,
          createdStageStartDay: chunk.stageStartDay,
          createdStageEndDay: chunk.stageEndDay,
        });
      }
    }
  }

  return pending
    .filter((handoff) => !resolved.has(handoff.handoffId))
    .map((handoff) => {
      const ageInChunks = Math.max(0, currentChunkNumber - handoff.createdChunkNumber);
      const isStale = ageInChunks >= 2;
      const priority: HandoffStatus["priority"] = ageInChunks >= 4 ? "critical" : isStale ? "stale" : "normal";

      return {
        ...handoff,
        ageInChunks,
        isStale,
        priority,
      };
    });
}

export function summarizeOpenHandoffs(params: {
  openHandoffs: HandoffStatus[];
  locale: string;
  targetRole?: TeamRole;
}): string {
  const { locale, targetRole } = params;
  const zh = locale.toLowerCase().startsWith("zh");
  const filtered = targetRole
    ? params.openHandoffs.filter((handoff) => handoff.toRole === targetRole)
    : params.openHandoffs;

  if (filtered.length === 0) {
    return zh
      ? (targetRole ? "当前没有需要你接手的未完成交接。" : "当前没有未完成交接。")
      : (targetRole ? "There are no open handoffs assigned to you." : "There are no open handoffs.");
  }

  return filtered.map((handoff) => formatHandoffLine(handoff, zh, false)).join("\n");
}

export function summarizeStaleHandoffs(params: {
  openHandoffs: HandoffStatus[];
  locale: string;
  targetRole?: TeamRole;
}): string {
  const { locale, targetRole } = params;
  const zh = locale.toLowerCase().startsWith("zh");
  const filtered = params.openHandoffs.filter((handoff) => handoff.isStale && (!targetRole || handoff.toRole === targetRole));

  if (filtered.length === 0) {
    return zh ? "当前没有需要升级的 stale 交接。" : "There are no stale handoffs that require escalation.";
  }

  return filtered.map((handoff) => formatHandoffLine(handoff, zh, true)).join("\n");
}

function summarizeRolePlan(plan: RolePlan, zh: boolean): string {
  const handoffSummary = plan.handoffs.length > 0
    ? plan.handoffs.map((handoff) => `${handoff.toRole}:${handoff.note}`).join("; ")
    : (zh ? "无交接" : "no handoff");
  const resolvedSummary = plan.resolvedHandoffIds.length > 0
    ? (zh ? `已处理 ${plan.resolvedHandoffIds.join("/")}` : `resolved ${plan.resolvedHandoffIds.join("/")}`)
    : (zh ? "未回执" : "no acknowledgements");
  return `${plan.role}: ${plan.summary}; ${handoffSummary}; ${resolvedSummary}`;
}

function formatHandoffLine(handoff: HandoffStatus, zh: boolean, staleOnly: boolean): string {
  const staleLabel = staleOnly
    ? (zh ? `升级` : "ESCALATE")
    : (handoff.isStale ? (zh ? `stale` : "stale") : (zh ? "active" : "active"));
  const ageLabel = zh ? `${handoff.ageInChunks} 段未回执` : `${handoff.ageInChunks} chunk(s) open`;
  const priorityLabel = zh ? `优先级 ${handoff.priority}` : `priority ${handoff.priority}`;

  return zh
    ? `- ${handoff.handoffId} | ${staleLabel} | ${ageLabel} | ${priorityLabel} | 来自 ${handoff.fromRole} -> ${handoff.toRole} | 第 ${handoff.createdChunkNumber} 段 | ${handoff.note}`
    : `- ${handoff.handoffId} | ${staleLabel} | ${ageLabel} | ${priorityLabel} | from ${handoff.fromRole} -> ${handoff.toRole} | chunk ${handoff.createdChunkNumber} | ${handoff.note}`;
}
