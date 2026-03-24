import { randomUUID } from "node:crypto";

import type { GroundingSnapshot } from "../grounding/google-trends.js";
import type {
  ActionProposal,
  Channel,
  ChunkUpdateArtifact,
  CommerceWorldState,
  EventEntry,
  ExecutionResult,
  FinalBattleReportArtifact,
  MarketSnapshotArtifact,
  Scenario,
  StageOutcome,
} from "../domain.js";
import type { RolePlan } from "../agent_runtime/contracts.js";
import { clampNumber, createArtifactRef, normalizeStageOutcome, roundTo, stockPressureLevelFromInventory, summarizeMetrics } from "../helpers.js";

export interface ChunkExecution {
  chunkNumber: number;
  stageStartDay: number;
  stageEndDay: number;
  bossMessage: string;
  rolePlans: RolePlan[];
  actionSummary: string;
  mergeRationale: string;
  actions: ActionProposal[];
  executionSummary: string;
  executionActionIds: string[];
  executionResults: ExecutionResult[];
  events: EventEntry[];
  outcome: StageOutcome;
  artifact: ChunkUpdateArtifact;
}

export function initializeStateFromGrounding(state: CommerceWorldState, scenario: Scenario, grounding: GroundingSnapshot): void {
  state.world_context = {
    ...state.world_context,
    product_name: scenario.business.product_name ?? scenario.identity.name,
    scenario_name: scenario.identity.name,
    grounding_query: grounding.query,
    competitive_posture: grounding.competitivePosture,
    indicative_cost_posture: grounding.indicativeCostPosture,
    conversion_bias: 0,
    cost_bias: 0,
    cumulative_orders: 0,
    cumulative_refunds: 0,
  };

  state.market_data.trends_score = grounding.trendsScore;
  state.market_data.trends_direction = grounding.trendsDirection;
  state.market_data.seasonal_factor = grounding.seasonalFactor;
  state.market_data.top_regions = grounding.topRegions;
  state.market_data.last_refresh_day = 0;
  state.market_data.competitor_count = Math.max(grounding.relatedQueries.length, grounding.webContext.length);
  state.market_data.avg_competitor_price = estimateCompetitorPrice(scenario, grounding);

  state.supply_chain.inventory_in_stock = Math.max(40, Math.round(scenario.budget.starting_budget / Math.max(state.product.unit_cost || 25, 20)));
  state.supply_chain.reorder_point = Math.max(20, Math.floor(state.supply_chain.inventory_in_stock * 0.4));
  state.supply_chain.shipping_mode = "air";
  state.marketing.total_daily_budget = scenario.budget.daily_budget_cap ?? Math.max(20, scenario.budget.starting_budget / 60);
}

export function createMarketSnapshotArtifact(params: {
  scenario: Scenario;
  grounding: GroundingSnapshot;
}): MarketSnapshotArtifact {
  const { scenario, grounding } = params;
  const heat = grounding.trendsScore;
  const recommendation = heat != null && heat >= 60
    ? "Demand is warm enough to test with disciplined spend and a fast feedback loop."
    : "Demand is present but not explosive; keep the first chunk conservative and learn cheaply.";

  return {
    artifact_id: randomUUID(),
    type: "market_snapshot",
    created_at_day: 0,
    title: `${scenario.identity.name} market snapshot`,
    summary: recommendation,
    recommendation_summary: recommendation,
    next_decision_options: [
      "Start the first 5-day shadow run",
      "Adjust price or budget before launch",
      "Change channel mix or inventory posture",
    ],
    market_heat: grounding.trendsScore,
    trend_direction: grounding.trendsDirection,
    indicative_cost_posture: grounding.indicativeCostPosture,
    indicative_competitive_posture: grounding.competitivePosture,
  };
}

export function executeStage(params: {
  state: CommerceWorldState;
  stageStartDay: number;
  stageEndDay: number;
}): StageOutcome {
  const { state, stageStartDay, stageEndDay } = params;
  const chunkDays = stageEndDay - stageStartDay + 1;

  if (state.supply_chain.next_arrival_day != null && state.supply_chain.next_arrival_day <= stageEndDay) {
    state.supply_chain.inventory_in_stock += state.supply_chain.inventory_in_transit;
    state.supply_chain.inventory_in_transit = 0;
    state.supply_chain.next_arrival_day = null;
  }

  const trendFactor = clampNumber((state.market_data.trends_score ?? 45) / 50, 0.6, 1.8);
  const seasonality = clampNumber(state.market_data.seasonal_factor ?? 1, 0.8, 1.35);
  const brandFactor = 1 + Math.min(0.35, state.brand.brand_awareness_score / 140);
  const promotionActive = state.marketing.active_promotions.length > 0;
  const promotionLift = promotionActive ? 1.08 : 1;
  const creatorLift = 1 + Math.min(0.18, state.marketing.active_kol_campaigns * 0.03);
  const fatiguePenalty = 1 - Math.min(0.4, state.marketing.creative_fatigue * 0.3);
  const conversionBias = numberFromContext(state.world_context.conversion_bias);
  const costBias = numberFromContext(state.world_context.cost_bias);
  const competitorCount = state.market_data.competitor_count ?? 0;
  const competitionPressure = Math.min(0.28, competitorCount * 0.04);
  const competitorPrice = state.market_data.avg_competitor_price ?? state.product.price;
  const priceRatio = competitorPrice > 0 ? state.product.price / competitorPrice : 1;
  const priceConversionFactor = priceRatio > 1.15 ? 0.7 : priceRatio > 1.05 ? 0.84 : priceRatio < 0.92 ? 1.08 : 1;
  const priceTrafficFactor = priceRatio > 1.15 ? 0.8 : priceRatio > 1.05 ? 0.9 : priceRatio < 0.92 ? 1.04 : 1;
  const availableSpend = Math.max(0, roundTo(state.finance.balance - state.finance.reserved_cash, 2));
  const requestedAdSpend = state.marketing.ad_paused ? 0 : roundTo(state.marketing.total_daily_budget * chunkDays, 2);
  const adSpend = roundTo(Math.min(requestedAdSpend, availableSpend), 2);
  const weightedCpc = roundTo(
    (
      state.marketing.channel_mix.tiktok * 0.92 +
      state.marketing.channel_mix.facebook * 1.28 +
      state.marketing.channel_mix.other * 0.74
    ) * (1 + competitionPressure + Math.max(0, costBias) + Math.max(0, trendFactor - 1) * 0.08),
    2,
  );
  const paidClicks = state.marketing.ad_paused ? 0 : Math.floor(adSpend / Math.max(weightedCpc, 0.45));
  const organicVisits = Math.max(
    0,
    Math.round(22 * chunkDays * trendFactor * seasonality * brandFactor * creatorLift * fatiguePenalty * priceTrafficFactor),
  );
  const totalVisits = paidClicks + organicVisits;
  const baseConversionRate = 0.021
    * seasonality
    * priceConversionFactor
    * promotionLift
    * (1 + Math.min(0.18, state.brand.brand_awareness_score / 90))
    * fatiguePenalty
    * (1 - competitionPressure * 0.35)
    * (state.product.mode === "presale" ? 0.92 : 1)
    * (1 + conversionBias);
  const conversionRate = clampNumber(baseConversionRate, 0.007, 0.075);
  const grossOrders = Math.max(0, Math.round(totalVisits * conversionRate));
  const fulfilledOrders = state.product.mode === "presale"
    ? grossOrders
    : Math.min(grossOrders, state.supply_chain.inventory_in_stock);
  const refundRate = clampNumber(
    0.035
      + (promotionActive ? 0.008 : 0)
      + (state.product.mode === "presale" ? 0.03 : 0)
      + state.marketing.creative_fatigue * 0.025
      + (priceRatio > 1.1 ? 0.01 : 0),
    0.02,
    0.14,
  );
  const refundedOrders = Math.min(fulfilledOrders, Math.round(fulfilledOrders * refundRate));
  const netOrders = Math.max(0, fulfilledOrders - refundedOrders);

  if (state.product.mode !== "presale") {
    state.supply_chain.inventory_in_stock = Math.max(0, state.supply_chain.inventory_in_stock - fulfilledOrders);
  }

  const effectiveSellingPrice = roundTo(state.product.price * (promotionActive ? 0.92 : 1), 2);
  const grossRevenue = roundTo(fulfilledOrders * effectiveSellingPrice, 2);
  const refundedRevenue = roundTo(refundedOrders * effectiveSellingPrice, 2);
  const revenue = roundTo(grossRevenue - refundedRevenue, 2);
  const cogs = roundTo(fulfilledOrders * state.product.unit_cost, 2);
  const shippingPerOrder = shippingCostPerOrder(state);
  const shippingCost = roundTo(fulfilledOrders * shippingPerOrder * (1 + costBias), 2);
  const packagingCost = roundTo(fulfilledOrders * 1.2, 2);
  const transactionFees = roundTo(revenue * 0.032 + netOrders * 0.3, 2);
  const returnHandlingCost = roundTo(refundedOrders * (shippingPerOrder * 0.35 + 2.5), 2);
  const totalCostDelta = roundTo(adSpend + cogs + shippingCost + packagingCost + transactionFees + returnHandlingCost, 2);
  const grossProfitDelta = roundTo(revenue - totalCostDelta, 2);
  const roas = adSpend > 0 ? roundTo(revenue / adSpend, 2) : null;

  state.finance.total_revenue = roundTo(state.finance.total_revenue + revenue, 2);
  state.finance.total_cost = roundTo(state.finance.total_cost + totalCostDelta, 2);
  state.finance.gross_profit = roundTo(state.finance.total_revenue - state.finance.total_cost, 2);
  state.finance.balance = roundTo(state.finance.balance + grossProfitDelta, 2);
  state.marketing.creative_fatigue = roundTo(
    Math.min(1.5, state.marketing.creative_fatigue + (state.marketing.ad_paused ? 0.02 : clampNumber(0.04 + totalVisits / 4000, 0.04, 0.12))),
    2,
  );
  state.meta.current_day = stageEndDay;
  state.world_context = {
    ...state.world_context,
    cumulative_orders: numberFromContext(state.world_context.cumulative_orders) + netOrders,
    cumulative_refunds: numberFromContext(state.world_context.cumulative_refunds) + refundedOrders,
    last_stage_cpc: weightedCpc,
    last_stage_cvr: roundTo(conversionRate * 100, 2),
    last_stage_roas: roas,
  };

  const inventoryEnd = state.supply_chain.inventory_in_stock;
  const stockPressure = stockPressureLevelFromInventory(inventoryEnd, state.supply_chain.reorder_point);
  const bestChannel = deriveBestChannelFromMix(state.marketing.channel_mix);
  const bestCreative = state.marketing.primary_creative_style ?? (state.marketing.active_kol_campaigns > 0 ? "creator-led" : "baseline");
  const biggestRisk = stockPressure === "high"
    ? "Inventory is at or near stockout."
    : requestedAdSpend > adSpend
      ? "Cash reserve is constraining paid acquisition."
      : refundRate >= 0.08
        ? "Refund pressure is eating into otherwise decent demand."
        : state.finance.balance < state.finance.reserved_cash
          ? "Cash buffer is getting squeezed."
          : "Creative fatigue is creeping up.";
  const biggestWin = netOrders > 0
    ? organicVisits >= paidClicks
      ? "Organic and brand-driven demand carried more of the volume than paid traffic."
      : `${bestChannel ?? "tiktok"} carried the strongest paid traffic mix.`
    : "The team avoided forced spend while learning cheaply.";

  return normalizeStageOutcome({
    orders: netOrders,
    revenue,
    ad_spend: adSpend,
    total_cost_delta: totalCostDelta,
    gross_profit_delta: grossProfitDelta,
    balance_end: state.finance.balance,
    inventory_end: inventoryEnd,
    stock_pressure_level: stockPressure,
    summary_notes: [
      `Trend posture: ${state.market_data.trends_direction ?? "flat"}`,
      `Traffic mix: ${paidClicks} paid clicks, ${organicVisits} organic visits`,
      `Est. CPC/CVR: $${weightedCpc} / ${roundTo(conversionRate * 100, 2)}%`,
      `Refund pressure: ${roundTo(refundRate * 100, 1)}%`,
      `Marketing posture: ${state.marketing.ad_paused ? "paused paid ads" : requestedAdSpend > adSpend ? "cash-constrained paid acquisition" : "active paid acquisition"}`,
    ],
    best_channel: bestChannel,
    best_creative: bestCreative,
    biggest_risk: biggestRisk,
    biggest_win: biggestWin,
  });
}

export function createChunkArtifact(params: {
  chunkNumber: number;
  stageStartDay: number;
  stageEndDay: number;
  state: CommerceWorldState;
  outcome: StageOutcome;
  actionSummary: string;
  eventSummary: string;
}): ChunkUpdateArtifact {
  const metrics = summarizeMetrics(params.state);
  return {
    artifact_id: randomUUID(),
    type: "chunk_update",
    created_at_day: params.stageEndDay,
    title: `Chunk ${params.chunkNumber} update`,
    summary: `${params.actionSummary} ${params.eventSummary}`.trim(),
    day_start: params.stageStartDay,
    day_end: params.stageEndDay,
    orders: params.outcome.orders,
    revenue: params.outcome.revenue,
    total_cost: params.state.finance.total_cost,
    gross_profit: params.state.finance.gross_profit,
    balance: params.state.finance.balance,
    inventory_in_stock: params.state.supply_chain.inventory_in_stock,
    inventory_in_transit: params.state.supply_chain.inventory_in_transit,
    stock_pressure_level: params.outcome.stock_pressure_level,
    biggest_win: params.outcome.biggest_win ?? "The team kept momentum.",
    biggest_risk: params.outcome.biggest_risk ?? "No single risk dominated.",
    best_channel: params.outcome.best_channel ?? metrics.best_channel,
    best_creative: params.outcome.best_creative ?? metrics.best_creative,
    decision_point:
      params.outcome.stock_pressure_level === "high"
        ? "Revisit inventory, spend, or presale posture before the next chunk."
        : "Decide whether to scale, hold, or rebalance before the next chunk.",
  };
}

export function createFinalArtifact(params: {
  state: CommerceWorldState;
  chunkHistory: ChunkExecution[];
}): FinalBattleReportArtifact {
  const bestChunk = [...params.chunkHistory].sort((a, b) => b.outcome.gross_profit_delta - a.outcome.gross_profit_delta)[0];
  const worstChunk = [...params.chunkHistory].sort((a, b) => a.outcome.gross_profit_delta - b.outcome.gross_profit_delta)[0];
  const metrics = summarizeMetrics(params.state);

  return {
    artifact_id: randomUUID(),
    type: "final_battle_report",
    created_at_day: params.state.meta.current_day,
    title: "Final battle report",
    summary: params.state.finance.gross_profit >= 0
      ? "The 30-day shadow run finished with positive unit economics and a clearer scaling path."
      : "The 30-day shadow run exposed the weak spots before real money was spent.",
    starting_budget: params.state.finance.initial_budget,
    ending_balance: params.state.finance.balance,
    total_orders: metrics.orders,
    total_revenue: params.state.finance.total_revenue,
    total_cost: params.state.finance.total_cost,
    gross_profit: params.state.finance.gross_profit,
    best_channel: bestChunk?.outcome.best_channel ?? metrics.best_channel,
    best_creative: bestChunk?.outcome.best_creative ?? metrics.best_creative,
    biggest_mistake: worstChunk?.outcome.biggest_risk ?? "The run stayed too cautious to find a strong winner.",
    biggest_winning_decision: bestChunk?.artifact.biggest_win ?? "Keeping the team disciplined across chunks.",
    recommended_next_move:
      params.state.finance.balance > params.state.finance.initial_budget
        ? "Run a second shadow pass with a slightly more aggressive scaling plan."
        : "Adjust price, creative posture, or replenishment rules before another run.",
    key_decision_recaps: params.chunkHistory.slice(0, 3).map((chunk) => chunk.actionSummary),
    counterfactuals: [
      "A different price and cash-reserve mix would likely change the first 10 days materially.",
      "Inventory timing and creative refresh cadence remain the two strongest levers to retest.",
    ],
  };
}

export function attachArtifact(state: CommerceWorldState, artifact: MarketSnapshotArtifact | ChunkUpdateArtifact | FinalBattleReportArtifact): void {
  state.artifacts.push(createArtifactRef(artifact, artifact.created_at_day));
}

function estimateCompetitorPrice(scenario: Scenario, grounding: GroundingSnapshot): number | null {
  const groundedPrices = grounding.webContext.flatMap((entry) => extractPriceCandidates(`${entry.title} ${entry.note}`));
  const filteredPrices = groundedPrices.filter((price) => price >= 10 && price <= 1000).sort((a, b) => a - b);
  if (filteredPrices.length > 0) {
    const middlePrice = filteredPrices[Math.floor(filteredPrices.length / 2)];
    return middlePrice == null ? null : roundTo(middlePrice, 2);
  }
  if (!scenario.business.initial_price) {
    return null;
  }
  return roundTo(scenario.business.initial_price * 0.95, 2);
}

function deriveBestChannelFromMix(mix: CommerceWorldState["marketing"]["channel_mix"]): Channel | null {
  const entries = Object.entries(mix) as Array<[Channel, number]>;
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
}

function shippingCostPerOrder(state: CommerceWorldState): number {
  if (state.supply_chain.shipping_mode === "sea") {
    return state.product.shipping_cost_sea ?? 6.5;
  }
  if (state.supply_chain.shipping_mode === "mixed") {
    return roundTo(((state.product.shipping_cost_sea ?? 6.5) + (state.product.shipping_cost_air ?? 10.5)) / 2, 2);
  }
  return state.product.shipping_cost_air ?? 10.5;
}

function extractPriceCandidates(text: string): number[] {
  const matches = Array.from(text.matchAll(/\$(\d+(?:\.\d{1,2})?)/g));
  return matches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value));
}

function numberFromContext(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
