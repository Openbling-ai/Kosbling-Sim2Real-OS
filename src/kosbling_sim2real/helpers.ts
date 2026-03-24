import {
  ACTION_TYPES,
  CHANNELS,
  EVENT_TYPES,
  RISK_LEVELS,
  type ActionProposal,
  type Artifact,
  type Channel,
  type CommerceWorldState,
  type DerivedMetrics,
  type EventEntry,
  type RiskLevel,
  type Scenario,
  type StageOutcome,
  type ValidationIssue,
} from "./domain.js";

export function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

export function isActionType(value: string): value is (typeof ACTION_TYPES)[number] {
  return isOneOf(value, ACTION_TYPES);
}

export function isEventType(value: string): value is (typeof EVENT_TYPES)[number] {
  return isOneOf(value, EVENT_TYPES);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeChannelMix(channelMix: Record<Channel, number>): Record<Channel, number> {
  const total = CHANNELS.reduce((sum: number, channel: Channel) => sum + (Number(channelMix[channel]) || 0), 0);
  if (total <= 0) {
    return { tiktok: 0.34, facebook: 0.33, other: 0.33 };
  }

  const normalized = Object.fromEntries(
    CHANNELS.map((channel: Channel) => [channel, roundTo((Number(channelMix[channel]) || 0) / total, 4)]),
  ) as Record<Channel, number>;

  const firstChannel = CHANNELS[0] as Channel;
  const drift = roundTo(1 - CHANNELS.reduce((sum: number, channel: Channel) => sum + normalized[channel], 0), 4);
  normalized[firstChannel] = roundTo(normalized[firstChannel] + drift, 4);
  return normalized;
}

export function stockPressureLevelFromInventory(inventoryInStock: number, reorderPoint: number): RiskLevel {
  if (inventoryInStock <= 0) {
    return "high";
  }
  if (inventoryInStock <= reorderPoint) {
    return "medium";
  }
  return "low";
}

export function createDefaultScenario(input: Partial<Scenario> & Pick<Scenario, "id">): Scenario {
  return {
    id: input.id,
    status: input.status ?? "draft",
    identity: {
      name: input.identity?.name ?? "Kosbling Run",
      category: input.identity?.category ?? "DTC",
      target_market: input.identity?.target_market,
      region: input.identity?.region,
    },
    business: {
      product_name: input.business?.product_name,
      product_category: input.business?.product_category,
      positioning: input.business?.positioning,
      initial_price: input.business?.initial_price,
      unit_cost: input.business?.unit_cost,
    },
    budget: {
      starting_budget: input.budget?.starting_budget ?? 0,
      reserve_cash: input.budget?.reserve_cash,
      daily_budget_cap: input.budget?.daily_budget_cap,
    },
    simulation: {
      total_days: input.simulation?.total_days ?? 30,
      chunk_days: input.simulation?.chunk_days ?? 5,
      mode: "shadow",
    },
    grounding: {
      anchor: "google_trends",
      query: input.grounding?.query,
      locale: input.grounding?.locale,
      competitor_scan: input.grounding?.competitor_scan,
    },
    success_criteria: {
      primary_goal: input.success_criteria?.primary_goal,
      target_profit: input.success_criteria?.target_profit,
      target_orders: input.success_criteria?.target_orders,
    },
    user_preferences: {
      tone: input.user_preferences?.tone,
      adjustment_style: input.user_preferences?.adjustment_style ?? "natural",
      max_clarifying_questions: input.user_preferences?.max_clarifying_questions ?? 2,
    },
    notes: input.notes,
  };
}

export function createInitialWorldState(params: {
  sessionId: string;
  scenarioId: string;
  scenario?: Scenario;
  seed?: number | null;
}): CommerceWorldState {
  const scenario = params.scenario;
  const initialBudget = scenario?.budget.starting_budget ?? 0;
  const initialPrice = scenario?.business.initial_price ?? 0;
  const unitCost = scenario?.business.unit_cost ?? 0;

  return {
    meta: {
      session_id: params.sessionId,
      scenario_id: params.scenarioId,
      current_day: 0,
      status: "running",
      seed: params.seed ?? null,
    },
    world_context: {
      category: scenario?.identity.category ?? null,
      region: scenario?.identity.region ?? null,
      target_market: scenario?.identity.target_market ?? null,
      grounding_anchor: scenario?.grounding.anchor ?? "google_trends",
    },
    product: {
      name: scenario?.business.product_name ?? scenario?.identity.name ?? "Untitled Product",
      category: scenario?.business.product_category ?? scenario?.identity.category ?? "DTC",
      price: initialPrice,
      unit_cost: unitCost,
      mode: "normal",
      shipping_cost_sea: undefined,
      shipping_cost_air: undefined,
      additional_skus: [],
    },
    supply_chain: {
      supplier_name: null,
      inventory_in_stock: 0,
      inventory_in_transit: 0,
      fulfillment_mode: "self_ship",
      shipping_mode: null,
      reorder_point: 0,
      next_arrival_day: null,
    },
    marketing: {
      total_daily_budget: scenario?.budget.daily_budget_cap ?? 0,
      channel_mix: { tiktok: 0.34, facebook: 0.33, other: 0.33 },
      ad_paused: false,
      primary_creative_style: null,
      creative_fatigue: 0,
      active_kol_campaigns: 0,
      active_promotions: [],
      organic_posture: "medium",
    },
    brand: {
      brand_style: null,
      brand_awareness_score: 0,
    },
    finance: {
      initial_budget: initialBudget,
      balance: initialBudget,
      reserved_cash: scenario?.budget.reserve_cash ?? 0,
      total_revenue: 0,
      total_cost: 0,
      gross_profit: 0,
    },
    market_data: {
      trends_score: null,
      trends_direction: null,
      seasonal_factor: null,
      competitor_count: null,
      avg_competitor_price: initialPrice > 0 ? initialPrice : null,
      top_regions: [],
      last_refresh_day: null,
    },
    decision_log: [],
    events: [],
    artifacts: [],
  };
}

export function validateScenario(scenario: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!scenario.id) {
    issues.push({ path: "id", message: "scenario.id is required" });
  }
  if (!scenario.identity?.name) {
    issues.push({ path: "identity.name", message: "scenario.identity.name is required" });
  }
  if (!scenario.identity?.category) {
    issues.push({ path: "identity.category", message: "scenario.identity.category is required" });
  }
  if (!(scenario.budget?.starting_budget >= 0)) {
    issues.push({ path: "budget.starting_budget", message: "scenario.budget.starting_budget must be >= 0" });
  }
  if (!(scenario.simulation?.total_days > 0)) {
    issues.push({ path: "simulation.total_days", message: "scenario.simulation.total_days must be > 0" });
  }
  if (!(scenario.simulation?.chunk_days > 0)) {
    issues.push({ path: "simulation.chunk_days", message: "scenario.simulation.chunk_days must be > 0" });
  }
  if (scenario.simulation?.mode !== "shadow") {
    issues.push({ path: "simulation.mode", message: "v0.1 only supports shadow mode" });
  }

  return issues;
}

export function validateActionProposal(action: ActionProposal): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!action.action_id) {
    issues.push({ path: "action_id", message: "action_id is required" });
  }
  if (!action.actor) {
    issues.push({ path: "actor", message: "actor is required" });
  }
  if (!isActionType(action.action_type)) {
    issues.push({ path: "action_type", message: `unsupported action_type: ${action.action_type}` });
  }
  if (!RISK_LEVELS.includes(action.risk_level)) {
    issues.push({ path: "risk_level", message: `unsupported risk_level: ${action.risk_level}` });
  }
  if (!action.reason) {
    issues.push({ path: "reason", message: "reason is required" });
  }
  if (!action.target_type) {
    issues.push({ path: "target_type", message: "target_type is required" });
  }
  return issues;
}

export function validateEventEntry(event: EventEntry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!event.event_id) {
    issues.push({ path: "event_id", message: "event_id is required" });
  }
  if (!isEventType(event.type)) {
    issues.push({ path: "type", message: `unsupported event type: ${event.type}` });
  }
  if (!event.desc) {
    issues.push({ path: "desc", message: "desc is required" });
  }
  if (!RISK_LEVELS.includes(event.severity)) {
    issues.push({ path: "severity", message: `unsupported severity: ${event.severity}` });
  }
  return issues;
}

export function summarizeMetrics(state: CommerceWorldState): DerivedMetrics {
  const inventoryInStock = state.supply_chain.inventory_in_stock;
  const stockPressureLevel = stockPressureLevelFromInventory(inventoryInStock, state.supply_chain.reorder_point);
  const cumulativeOrders = typeof state.world_context.cumulative_orders === "number" && Number.isFinite(state.world_context.cumulative_orders)
    ? state.world_context.cumulative_orders
    : null;

  return {
    orders: cumulativeOrders ?? (state.finance.total_revenue > 0 && state.product.price > 0 ? Math.round(state.finance.total_revenue / state.product.price) : 0),
    revenue: state.finance.total_revenue,
    total_cost: state.finance.total_cost,
    gross_profit: state.finance.gross_profit,
    balance: state.finance.balance,
    inventory_in_stock: inventoryInStock,
    stock_pressure_level: stockPressureLevel,
    best_channel: deriveBestChannel(state.marketing.channel_mix),
    best_creative: state.marketing.primary_creative_style,
    biggest_risk: null,
    biggest_win: null,
  };
}

export function deriveBestChannel(channelMix: Record<Channel, number>): Channel | null {
  const entries: ReadonlyArray<readonly [Channel, number]> = CHANNELS.map(
    (channel: Channel): readonly [Channel, number] => [channel, channelMix[channel]],
  );
  const best = entries.reduce<readonly [Channel, number] | null>((winner, current) => {
    if (!winner || current[1] > winner[1]) {
      return current;
    }
    return winner;
  }, null);
  return best?.[0] ?? null;
}

export function createArtifactRef(artifact: Artifact, day: number): { artifact_id: string; type: Artifact["type"]; day: number; title: string; summary: string; uri: string | null } {
  return {
    artifact_id: artifact.artifact_id,
    type: artifact.type,
    day,
    title: artifact.title,
    summary: artifact.summary,
    uri: null,
  };
}

export function normalizeStageOutcome(outcome: StageOutcome): StageOutcome {
  return {
    orders: Math.max(0, Math.floor(outcome.orders)),
    revenue: roundTo(Math.max(0, outcome.revenue), 2),
    ad_spend: roundTo(Math.max(0, outcome.ad_spend), 2),
    total_cost_delta: roundTo(outcome.total_cost_delta, 2),
    gross_profit_delta: roundTo(outcome.gross_profit_delta, 2),
    balance_end: roundTo(outcome.balance_end, 2),
    inventory_end: Math.max(0, Math.floor(outcome.inventory_end)),
    stock_pressure_level: outcome.stock_pressure_level,
    summary_notes: outcome.summary_notes,
    best_channel: outcome.best_channel ?? null,
    best_creative: outcome.best_creative ?? null,
    biggest_risk: outcome.biggest_risk ?? null,
    biggest_win: outcome.biggest_win ?? null,
  };
}
