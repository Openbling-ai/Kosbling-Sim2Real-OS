import { randomUUID } from "node:crypto";

import type { AppConfig } from "../config.js";
import {
  type ActionProposal,
  type CommerceWorldState,
  type EventEntry,
  type EventSource,
  type RiskLevel,
  type Scenario,
} from "../domain.js";
import { createDefaultScenario, normalizeChannelMix, validateActionProposal, validateEventEntry, validateScenario } from "../helpers.js";
import { getI18n } from "../i18n.js";
import type { HandoffStatus, RolePlan } from "./contracts.js";
import { summarizeOpenHandoffs, summarizeStaleHandoffs } from "./team-memory.js";
import { runPiToolSession, Type, type PiRuntimeContext, type ToolDefinition } from "./pi.js";

type ScenarioCapture =
  | { type: "idle" }
  | { type: "question"; question: string; reason: string }
  | { type: "scenario"; scenario: Scenario };

type RawAction = {
  action_type: string;
  domain: string;
  reason: string;
  risk_level: string;
  expected_effect?: string;
  payload?: Record<string, unknown>;
};

type ActionCapture = {
  summary: string;
  rationale?: string;
  actions: RawAction[];
};

type RawEvent = {
  type: string;
  source: string;
  desc: string;
  severity: string;
  payload?: Record<string, unknown>;
};

type EventCapture = {
  summary: string;
  events: RawEvent[];
};

export class CEOAgent {
  constructor(
    private readonly config: AppConfig,
    private readonly runtime: PiRuntimeContext,
  ) {}

  async intakeIdea(params: {
    idea: string;
    qaHistory: Array<{ question: string; answer: string }>;
  }): Promise<
    | { kind: "clarification"; question: string; reason: string }
    | { kind: "scenario"; scenario: Scenario }
  > {
    const t = getI18n(this.config.locale);
    const capture: {
      type: "idle" | "question" | "scenario";
      question?: string;
      reason?: string;
      scenario?: Scenario;
    } = { type: "idle" };

    const askQuestionSchema = Type.Object({
      question: Type.String(),
      reason: Type.String(),
    });
    const submitScenarioSchema = Type.Object({
      identity: Type.Object({
        name: Type.String(),
        category: Type.String(),
        target_market: Type.Optional(Type.String()),
        region: Type.Optional(Type.String()),
      }),
      business: Type.Object({
        product_name: Type.Optional(Type.String()),
        product_category: Type.Optional(Type.String()),
        positioning: Type.Optional(Type.String()),
        initial_price: Type.Optional(Type.Number()),
        unit_cost: Type.Optional(Type.Number()),
      }),
      budget: Type.Object({
        starting_budget: Type.Number(),
        reserve_cash: Type.Optional(Type.Number()),
        daily_budget_cap: Type.Optional(Type.Number()),
      }),
      grounding: Type.Object({
        query: Type.Optional(Type.String()),
        locale: Type.Optional(Type.String()),
      }),
      success_criteria: Type.Object({
        primary_goal: Type.Optional(Type.String()),
        target_profit: Type.Optional(Type.Number()),
        target_orders: Type.Optional(Type.Number()),
      }),
      user_preferences: Type.Object({
        tone: Type.Optional(Type.String()),
        max_clarifying_questions: Type.Optional(Type.Number()),
      }),
      notes: Type.Optional(Type.Array(Type.String())),
    });

    const tools: ToolDefinition[] = [
      {
        name: "ask_clarifying_question",
        label: "ask_clarifying_question",
        description: "Ask exactly one concise clarification question if key business inputs are missing.",
        promptSnippet: "Use this when one critical detail is missing before a credible shadow run can start.",
        parameters: askQuestionSchema,
        execute: async (_toolCallId, rawParams) => {
          const toolParams = rawParams as { question: string; reason: string };
          capture.type = "question";
          capture.question = toolParams.question;
          capture.reason = toolParams.reason;
          return {
            content: [{ type: "text", text: "Clarifying question recorded." }],
            details: toolParams,
          };
        },
      },
      {
        name: "submit_scenario",
        label: "submit_scenario",
        description: "Submit a compact ready-to-run v0.1 scenario.",
        promptSnippet: "Use this when you can start the shadow run with compact defaults.",
        parameters: submitScenarioSchema,
        execute: async (_toolCallId, rawParams) => {
          const params = rawParams as {
            identity: { name: string; category: string; target_market?: string; region?: string };
            business: {
              product_name?: string;
              product_category?: string;
              positioning?: string;
              initial_price?: number;
              unit_cost?: number;
            };
            budget: { starting_budget: number; reserve_cash?: number; daily_budget_cap?: number };
            grounding: { query?: string; locale?: string };
            success_criteria: { primary_goal?: string; target_profit?: number; target_orders?: number };
            user_preferences: { tone?: string; max_clarifying_questions?: number };
            notes?: string[];
          };
          const scenario = createDefaultScenario({
            id: randomUUID(),
            status: "ready",
            identity: {
              name: params.identity.name,
              category: params.identity.category,
              target_market: params.identity.target_market,
              region: params.identity.region,
            },
            business: {
              product_name: params.business.product_name ?? params.identity.name,
              product_category: params.business.product_category ?? params.identity.category,
              positioning: params.business.positioning,
              initial_price: params.business.initial_price,
              unit_cost: params.business.unit_cost,
            },
            budget: {
              starting_budget: params.budget.starting_budget,
              reserve_cash: params.budget.reserve_cash ?? Math.max(0, params.budget.starting_budget * 0.15),
              daily_budget_cap: params.budget.daily_budget_cap ?? Math.max(20, params.budget.starting_budget / 60),
            },
            grounding: {
              anchor: "google_trends",
              query: params.grounding.query ?? params.business.product_name ?? params.identity.name,
              locale: params.grounding.locale ?? this.config.locale,
              competitor_scan: false,
            },
            success_criteria: {
              primary_goal: params.success_criteria.primary_goal,
              target_profit: params.success_criteria.target_profit,
              target_orders: params.success_criteria.target_orders,
            },
            user_preferences: {
              tone: params.user_preferences.tone ?? "boss-briefing",
              adjustment_style: "natural",
              max_clarifying_questions: params.user_preferences.max_clarifying_questions ?? 2,
            },
            notes: params.notes,
          });

          capture.type = "scenario";
          capture.scenario = scenario;

          return {
            content: [{ type: "text", text: "Scenario captured." }],
            details: { scenarioId: scenario.id },
          };
        },
      },
    ];

    const qaText = params.qaHistory.length > 0
      ? params.qaHistory.map((entry, index) => `${index + 1}. Q: ${entry.question}\nA: ${entry.answer}`).join("\n")
      : t.clarificationNone;

    const systemPrompt = t.intakeSystemPrompt.join("\n");

    const userPrompt = [
      t.currentBossIdea,
      params.idea,
      "",
      t.clarificationHistory,
      qaText,
      "",
      ...t.intakePromptLines,
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.type === "question" || value.type === "scenario",
    });

    if (capture.type === "question") {
      return {
        kind: "clarification",
        question: capture.question ?? (this.config.locale.startsWith("zh") ? "当前最关键的缺失信息是什么？" : "What is the key missing input?"),
        reason: capture.reason ?? (this.config.locale.startsWith("zh") ? "当前缺少一个关键设置字段。" : "A critical setup field is missing."),
      };
    }

    if (capture.type !== "scenario") {
      throw new Error("CEO agent did not return a scenario or clarification question.");
    }

    const scenario = capture.scenario;
    if (!scenario) {
      throw new Error("CEO agent returned scenario mode without a scenario payload.");
    }

    const issues = validateScenario(scenario);
    if (issues.length > 0) {
      throw new Error(`Scenario validation failed: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
    }

    return { kind: "scenario", scenario };
  }

  async proposeActions(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
  }): Promise<{ summary: string; actions: ActionProposal[] }> {
    const t = getI18n(this.config.locale);
    const capture: ActionCapture = { summary: "", actions: [] };
    const actionSchema = Type.Object({
      summary: Type.String(),
      actions: Type.Array(
        Type.Object({
          action_type: Type.String(),
          domain: Type.String(),
          reason: Type.String(),
          risk_level: Type.String(),
          expected_effect: Type.Optional(Type.String()),
          payload: Type.Optional(Type.Record(Type.String(), Type.Any())),
        }),
      ),
    });
    const tools: ToolDefinition[] = [
      {
        name: "submit_actions",
        label: "submit_actions",
        description: "Submit the commerce harness actions for the next chunk.",
        promptSnippet: "Use this to propose compact structured commerce actions.",
        parameters: actionSchema,
        execute: async (_toolCallId, rawParams) => {
          const params = rawParams as ActionCapture;
          capture.summary = params.summary;
          capture.actions = params.actions;
          return {
            content: [{ type: "text", text: "Actions recorded." }],
            details: { count: params.actions.length },
          };
        },
      },
    ];

    const systemPrompt = t.actionSystemPrompt.join("\n");

    const userPrompt = [
      t.chunkWindow(params.stageStartDay, params.stageEndDay),
      t.bossMessageLabel(params.bossMessage),
      "",
      t.currentCompactState,
      JSON.stringify({
        day: params.state.meta.current_day,
        product: params.state.product,
        supply_chain: params.state.supply_chain,
        marketing: params.state.marketing,
        finance: params.state.finance,
        market_data: params.state.market_data,
      }, null, 2),
      "",
      t.actionPromptLine,
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.actions.length > 0 || value.summary.length > 0,
    });

    const actions = capture.actions
      .map((action) => {
        try {
          return normalizeAction(action);
        } catch {
          return null;
        }
      })
      .filter((action): action is ActionProposal => action != null);
    const issues = actions.flatMap((action) => validateActionProposal(action));
    if (issues.length > 0) {
      throw new Error(`Action validation failed: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
    }

    return {
      summary: capture.summary || (this.config.locale.startsWith("zh") ? "Kos 已为下一阶段准备好行动方案。" : "Kos prepared the next chunk action plan."),
      actions,
    };
  }

  async mergeRolePlans(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
    recentTeamMemory: string;
    openHandoffs: HandoffStatus[];
    rolePlans: RolePlan[];
  }): Promise<{ summary: string; rationale: string; actions: ActionProposal[] }> {
    const t = getI18n(this.config.locale);
    const capture: ActionCapture = { summary: "", rationale: "", actions: [] };
    const actionSchema = Type.Object({
      summary: Type.String(),
      rationale: Type.String(),
      actions: Type.Array(
        Type.Object({
          action_type: Type.String(),
          domain: Type.String(),
          reason: Type.String(),
          risk_level: Type.String(),
          expected_effect: Type.Optional(Type.String()),
          payload: Type.Optional(Type.Record(Type.String(), Type.Any())),
        }),
      ),
    });
    const tools: ToolDefinition[] = [
      {
        name: "submit_merged_actions",
        label: "submit_merged_actions",
        description: "Submit the final merged commerce harness actions for this chunk.",
        promptSnippet: "Use this to resolve role conflicts and submit the final operating plan.",
        parameters: actionSchema,
        execute: async (_toolCallId, rawParams) => {
          const merged = rawParams as ActionCapture;
          capture.summary = merged.summary;
          capture.rationale = merged.rationale ?? "";
          capture.actions = merged.actions;
          return {
            content: [{ type: "text", text: "Merged actions recorded." }],
            details: { count: merged.actions.length },
          };
        },
      },
    ];

    const systemPrompt = this.config.locale.startsWith("zh")
      ? [
        "你是 Kos，负责在多个角色提案之间做最终协调和裁决。",
        "你必须综合 marketing、supply、finance 等角色的建议，生成一组最终的 Layer 0 commerce harness 行动。",
        "如果角色之间冲突，优先保证计划可执行、现金安全、库存连续性。",
        "不要机械拼接所有提案，必须做取舍、去重、压缩。",
        "认真阅读 watchouts、handoffs 和未完成交接，把跨角色依赖纳入你的裁决。",
        "如果存在 stale 交接，你必须在 rationale 中明确提到它们，并把它们提升到更高的风险优先级。",
        "除了 summary 之外，还要给出 rationale，解释你为什么保留、压缩或放弃某些角色建议。",
        "summary、reason、expected_effect 请使用简体中文，但 canonical 的 action_type/domain 枚举值必须保持英文。",
      ].join("\n")
      : [
        "You are Kos, the CEO agent doing final arbitration across multiple role proposals.",
        "You must synthesize marketing, supply, and finance proposals into one final Layer 0 commerce harness plan.",
        "If roles conflict, prioritize executable plans, cash safety, and inventory continuity.",
        "Do not mechanically concatenate every proposal; compress, deduplicate, and choose.",
        "Read role watchouts, handoffs, and open handoff tickets carefully and factor those cross-role dependencies into your arbitration.",
        "If there are stale handoffs, you must explicitly mention them in the rationale and raise their risk priority above fresh suggestions.",
        "In addition to the final summary, return a rationale explaining why some role ideas were kept, compressed, or dropped.",
        "Write summary, reason, and expected_effect in English, but keep canonical action_type/domain enums in English exactly as specified.",
      ].join("\n");

    const userPrompt = [
      t.chunkWindow(params.stageStartDay, params.stageEndDay),
      t.bossMessageLabel(params.bossMessage),
      "",
      t.currentCompactState,
      JSON.stringify({
        day: params.state.meta.current_day,
        product: params.state.product,
        supply_chain: params.state.supply_chain,
        marketing: params.state.marketing,
        finance: params.state.finance,
        market_data: params.state.market_data,
      }, null, 2),
      "",
      this.config.locale.startsWith("zh") ? "最近团队记忆：" : "Recent team memory:",
      params.recentTeamMemory,
      "",
      this.config.locale.startsWith("zh") ? "当前未完成交接：" : "Open handoffs:",
      summarizeOpenHandoffs({ openHandoffs: params.openHandoffs, locale: this.config.locale }),
      "",
      this.config.locale.startsWith("zh") ? "需要优先升级的 stale 交接：" : "Stale handoffs requiring priority:",
      summarizeStaleHandoffs({ openHandoffs: params.openHandoffs, locale: this.config.locale }),
      "",
      this.config.locale.startsWith("zh") ? "各角色提案：" : "Role proposals:",
      JSON.stringify(params.rolePlans, null, 2),
      "",
      this.config.locale.startsWith("zh")
        ? "请调用 submit_merged_actions，提交最终、最小、可执行的一组行动，并说明你的合并理由。"
        : "Call submit_merged_actions with the final minimal executable action set and your merge rationale.",
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.summary.length > 0,
    });

    const actions = capture.actions
      .map((action) => {
        try {
          return normalizeAction(action);
        } catch {
          return null;
        }
      })
      .filter((action): action is ActionProposal => action != null);
    const issues = actions.flatMap((action) => validateActionProposal(action));
    if (issues.length > 0) {
      throw new Error(`Merged action validation failed: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
    }

    return {
      summary: capture.summary || (this.config.locale.startsWith("zh") ? "Kos 已汇总多角色提案并形成最终行动方案。" : "Kos merged the role proposals into a final operating plan."),
      rationale: capture.rationale || (this.config.locale.startsWith("zh")
        ? "Kos 按现金安全、库存连续性和执行可行性压缩了多角色提案。"
        : "Kos compressed the role proposals around cash safety, inventory continuity, and execution readiness."),
      actions,
    };
  }

  async generateEvents(params: {
    state: CommerceWorldState;
    actionSummary: string;
    stageStartDay: number;
    stageEndDay: number;
  }): Promise<{ summary: string; events: EventEntry[] }> {
    const t = getI18n(this.config.locale);
    const capture: EventCapture = { summary: "", events: [] };
    const eventSchema = Type.Object({
      summary: Type.String(),
      events: Type.Array(
        Type.Object({
          type: Type.String(),
          source: Type.String(),
          desc: Type.String(),
          severity: Type.String(),
          payload: Type.Optional(Type.Record(Type.String(), Type.Any())),
        }),
      ),
    });
    const tools: ToolDefinition[] = [
      {
        name: "submit_events",
        label: "submit_events",
        description: "Submit at most two canonical Layer 0 events for this chunk.",
        promptSnippet: "Use this to add bounded market or operational events.",
        parameters: eventSchema,
        execute: async (_toolCallId, rawParams) => {
          const params = rawParams as EventCapture;
          capture.summary = params.summary;
          capture.events = params.events;
          return {
            content: [{ type: "text", text: "Events recorded." }],
            details: { count: params.events.length },
          };
        },
      },
    ];

    const systemPrompt = t.eventSystemPrompt.join("\n");

    const userPrompt = [
      t.chunkWindow(params.stageStartDay, params.stageEndDay),
      t.actionSummaryLabel(params.actionSummary),
      "",
      t.eventCompactState,
      JSON.stringify({
        supply_chain: params.state.supply_chain,
        marketing: params.state.marketing,
        finance: params.state.finance,
        market_data: params.state.market_data,
        recent_events: params.state.events.slice(-3),
      }, null, 2),
      "",
      t.eventPromptLine,
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.summary.length > 0,
    });

    const events = capture.events
      .map((event, index) => {
        try {
          return normalizeEvent({
            ...event,
            day: params.stageEndDay,
            event_id: `${params.stageEndDay}-${index + 1}-${randomUUID()}`,
          });
        } catch {
          return null;
        }
      })
      .filter((event): event is EventEntry => event != null);
    const issues = events.flatMap((event) => validateEventEntry(event));
    if (issues.length > 0) {
      throw new Error(`Event validation failed: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
    }

    return {
      summary: capture.summary || (this.config.locale.startsWith("zh") ? "这一阶段没有单一外部事件主导结果。" : "No exceptional external event dominated this chunk."),
      events,
    };
  }
}

export function normalizeAction(action: RawAction): ActionProposal {
  const payload = action.payload ?? {};
  const actionId = randomUUID();
  const riskLevel = normalizeRiskLevel(action.risk_level);

  switch (action.action_type) {
    case "set_channel_mix":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "set_channel_mix",
        target_type: "channel_mix",
        target_ref: null,
        reason: action.reason,
        payload: normalizeChannelMix({
          tiktok: asNumber(payload.tiktok, 0.34),
          facebook: asNumber(payload.facebook, 0.33),
          other: asNumber(payload.other, 0.33),
        }),
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "set_total_budget":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "set_total_budget",
        target_type: "budget",
        target_ref: null,
        reason: action.reason,
        payload: { total_daily_budget: Math.max(0, asNumber(payload.total_daily_budget, 0)) },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "pause_ads":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "pause_ads",
        target_type: "ads",
        target_ref: null,
        reason: action.reason,
        payload: { paused: Boolean(payload.paused ?? true) },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "launch_kol_campaign":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "launch_kol_campaign",
        target_type: "kol_campaign",
        target_ref: null,
        reason: action.reason,
        payload: {
          campaign_count: Math.max(1, Math.round(asNumber(payload.campaign_count, 1))),
          spend: Math.max(0, asNumber(payload.spend, 0)),
          mode: asString(payload.mode, "paid_review"),
        },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "reuse_kol_creative":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "reuse_kol_creative",
        target_type: "creative",
        target_ref: null,
        reason: action.reason,
        payload: {
          source: asString(payload.source, "kol"),
          style: asString(payload.style, "ugc_testimonial"),
        },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "start_promotion":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "start_promotion",
        target_type: "promotion",
        target_ref: null,
        reason: action.reason,
        payload: {
          promotion_type: asString(payload.promotion_type, "flash_sale"),
          duration_days: Math.max(1, Math.round(asNumber(payload.duration_days, 3))),
        },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "adjust_price":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "product",
        action_type: "adjust_price",
        target_type: "product",
        target_ref: null,
        reason: action.reason,
        payload: { new_price: Math.max(1, asNumber(payload.new_price, 1)) },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "switch_sales_mode":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "product",
        action_type: "switch_sales_mode",
        target_type: "product",
        target_ref: null,
        reason: action.reason,
        payload: { mode: normalizeSalesMode(asString(payload.mode, "normal")) },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "reorder_inventory":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "supply",
        action_type: "reorder_inventory",
        target_type: "inventory",
        target_ref: null,
        reason: action.reason,
        payload: {
          quantity: Math.max(1, Math.round(asNumber(payload.quantity, 1))),
          estimated_unit_cost: Math.max(0, asNumber(payload.estimated_unit_cost, 0)),
        },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "change_shipping_mode":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "supply",
        action_type: "change_shipping_mode",
        target_type: "shipping",
        target_ref: null,
        reason: action.reason,
        payload: {
          shipping_mode: normalizeShippingMode(asString(payload.shipping_mode, "air")),
          next_arrival_day: payload.next_arrival_day == null ? null : Math.round(asNumber(payload.next_arrival_day, 0)),
        },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    case "set_cash_reserve":
      return {
        action_id: actionId,
        actor: "kos-ceo",
        domain: "finance",
        action_type: "set_cash_reserve",
        target_type: "reserve_cash",
        target_ref: null,
        reason: action.reason,
        payload: { reserved_cash: Math.max(0, asNumber(payload.reserved_cash, 0)) },
        risk_level: riskLevel,
        expected_effect: action.expected_effect ?? null,
      };
    default:
      throw new Error(`Unsupported action_type from CEO agent: ${action.action_type}`);
  }
}

function normalizeEvent(event: RawEvent & { day: number; event_id: string }): EventEntry {
  const severity = normalizeRiskLevel(event.severity);
  const source = normalizeEventSource(event.source);
  const payload = event.payload ?? {};

  switch (event.type) {
    case "trend_shift":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "trend_shift",
        source,
        desc: event.desc,
        payload: {
          direction: normalizeTrendDirection(asString(payload.direction, "flat")),
          score_delta: Math.round(asNumber(payload.score_delta, 0)),
        },
        severity,
      };
    case "creator_result":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "creator_result",
        source,
        desc: event.desc,
        payload: {
          outcome: normalizeOutcome(asString(payload.outcome, "mixed")),
          uplift_strength: normalizeStrength(asString(payload.uplift_strength, "medium")),
        },
        severity,
      };
    case "creative_fatigue_rise":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "creative_fatigue_rise",
        source,
        desc: event.desc,
        payload: { fatigue_delta: asNumber(payload.fatigue_delta, 0.1) },
        severity,
      };
    case "supply_delay":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "supply_delay",
        source,
        desc: event.desc,
        payload: { delay_days: Math.max(1, Math.round(asNumber(payload.delay_days, 1))) },
        severity,
      };
    case "stock_pressure":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "stock_pressure",
        source,
        desc: event.desc,
        payload: { level: severity },
        severity,
      };
    case "conversion_shift":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "conversion_shift",
        source,
        desc: event.desc,
        payload: {
          direction: normalizeTrendDirection(asString(payload.direction, "flat")),
          strength: normalizeStrength(asString(payload.strength, "medium")),
        },
        severity,
      };
    case "cost_shift":
      return {
        event_id: event.event_id,
        day: event.day,
        type: "cost_shift",
        source,
        desc: event.desc,
        payload: {
          domain: asString(payload.domain, "shipping"),
          magnitude: normalizeStrength(asString(payload.magnitude, "medium")),
        },
        severity,
      };
    default:
      throw new Error(`Unsupported event type from CEO agent: ${event.type}`);
  }
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeRiskLevel(value: string): RiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
}

function normalizeEventSource(value: string): EventSource {
  if (value === "grounding" || value === "action_fallout" || value === "runtime" || value === "stochastic") {
    return value;
  }
  return "runtime";
}

function normalizeTrendDirection(value: string): "up" | "flat" | "down" {
  if (value === "up" || value === "flat" || value === "down") {
    return value;
  }
  return "flat";
}

function normalizeStrength(value: string): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
}

function normalizeOutcome(value: string): "hit" | "miss" | "mixed" {
  if (value === "hit" || value === "miss" || value === "mixed") {
    return value;
  }
  return "mixed";
}

function normalizeSalesMode(value: string): "normal" | "presale" | "clearance" {
  if (value === "normal" || value === "presale" || value === "clearance") {
    return value;
  }
  return "normal";
}

function normalizeShippingMode(value: string): "sea" | "air" | "mixed" {
  if (value === "sea" || value === "air" || value === "mixed") {
    return value;
  }
  return "air";
}
