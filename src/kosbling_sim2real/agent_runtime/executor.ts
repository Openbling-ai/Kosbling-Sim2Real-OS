import type { AppConfig } from "../config.js";
import type { ActionProposal, CommerceWorldState, ExecutionResult } from "../domain.js";
import { getI18n } from "../i18n.js";
import type { CommerceExecutionAdapter } from "../runtime/adapter.js";
import { runPiToolSession, Type, type PiRuntimeContext, type ToolDefinition } from "./pi.js";

interface ExecutionCapture {
  summary: string;
  results: ExecutionResult[];
  actionIds: string[];
  executed: boolean;
}

export class ExecutionAgent {
  constructor(
    private readonly config: AppConfig,
    private readonly runtime: PiRuntimeContext,
    private readonly adapter: CommerceExecutionAdapter,
  ) {}

  async executeApprovedActions(params: {
    state: CommerceWorldState;
    actions: ActionProposal[];
    currentDay: number;
    bossMessage: string;
  }): Promise<{ summary: string; results: ExecutionResult[]; actionIds: string[] }> {
    const t = getI18n(this.config.locale);
    const capture: ExecutionCapture = { summary: "", results: [], actionIds: [], executed: false };
    const actionIdMap = new Map(params.actions.map((action) => [action.action_id, action]));
    const executionSchema = Type.Object({
      summary: Type.String(),
      action_ids: Type.Array(Type.String()),
    });

    const tools: ToolDefinition[] = [
      {
        name: "execute_approved_actions",
        label: "execute_approved_actions",
        description: `Execute approved actions through the ${this.adapter.mode} commerce adapter.`,
        promptSnippet: "Use this to actually execute the approved action bundle through the runtime adapter.",
        parameters: executionSchema,
        execute: async (_toolCallId, rawParams) => {
          const toolParams = rawParams as { summary: string; action_ids: string[] };
          const orderedActionIds = dedupeActionIds(toolParams.action_ids).filter((actionId) => actionIdMap.has(actionId));
          for (const action of params.actions) {
            if (!orderedActionIds.includes(action.action_id)) {
              orderedActionIds.push(action.action_id);
            }
          }

          const actionsToExecute = orderedActionIds
            .map((actionId) => actionIdMap.get(actionId))
            .filter((action): action is ActionProposal => action != null);
          const results = await this.adapter.executeApprovedActions({
            state: params.state,
            actions: actionsToExecute,
            currentDay: params.currentDay,
          });
          capture.summary = toolParams.summary;
          capture.results = results;
          capture.actionIds = orderedActionIds;
          capture.executed = true;
          return {
            content: [{ type: "text", text: `Executed ${results.length} actions.` }],
            details: { actionCount: actionsToExecute.length, mode: this.adapter.mode },
          };
        },
      },
    ];

    const systemPrompt = this.config.locale.startsWith("zh")
      ? [
        `你是一个执行型 agent。你的职责是通过 ${this.adapter.mode} adapter 真正执行已经批准的动作。`,
        "你不能重新发明策略，只能根据已批准的动作包决定执行顺序并调用执行工具。",
        "如果没有动作，也必须调用 execute_approved_actions 并传空数组。",
        "summary 请使用简体中文。",
      ].join("\n")
      : [
        `You are an execution agent. Your job is to actually execute already-approved actions through the ${this.adapter.mode} adapter.`,
        "Do not invent new strategy. Only decide execution order for the approved bundle and call the execution tool.",
        "If there are no actions, still call execute_approved_actions with an empty array.",
        "Write summary in English.",
      ].join("\n");

    const userPrompt = [
      t.bossMessageLabel(params.bossMessage),
      "",
      this.config.locale.startsWith("zh") ? "已批准动作：" : "Approved actions:",
      JSON.stringify(params.actions, null, 2),
      "",
      this.config.locale.startsWith("zh")
        ? "请调用 execute_approved_actions，以你认为最合理的顺序执行这些动作。"
        : "Call execute_approved_actions to execute these actions in the most sensible order.",
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.executed,
    });

    return {
      summary: capture.summary || defaultExecutionSummary(this.config.locale, this.adapter.mode, capture.results.length),
      results: capture.results,
      actionIds: capture.actionIds,
    };
  }
}

function dedupeActionIds(actionIds: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const actionId of actionIds) {
    if (seen.has(actionId)) {
      continue;
    }
    seen.add(actionId);
    ordered.push(actionId);
  }

  return ordered;
}

function defaultExecutionSummary(locale: string, mode: "shadow" | "live", count: number): string {
  if (locale.startsWith("zh")) {
    return mode === "shadow"
      ? `执行 agent 已通过 shadow adapter 执行 ${count} 个动作。`
      : `执行 agent 已通过 live adapter 执行 ${count} 个动作。`;
  }
  return mode === "shadow"
    ? `Execution agent ran ${count} actions through the shadow adapter.`
    : `Execution agent ran ${count} actions through the live adapter.`;
}
