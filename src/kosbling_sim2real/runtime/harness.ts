import { randomUUID } from "node:crypto";

import type {
  ActionProposal,
  CommerceWorldState,
  CostShiftPayload,
  CreativeFatigueRisePayload,
  CreatorResultPayload,
  EventEntry,
  ExecutionResult,
  SupplyDelayPayload,
  TrendShiftPayload,
  ConversionShiftPayload,
} from "../domain.js";
import { clampNumber, roundTo } from "../helpers.js";

export function applyActionsToState(params: {
  state: CommerceWorldState;
  actions: ActionProposal[];
  currentDay: number;
}): ExecutionResult[] {
  const { state, actions, currentDay } = params;
  const results: ExecutionResult[] = [];

  for (const action of actions) {
    const appliedEffects: string[] = [];

    switch (action.action_type) {
      case "set_channel_mix":
        state.marketing.channel_mix = action.payload;
        appliedEffects.push("Updated marketing channel mix.");
        break;
      case "set_total_budget":
        state.marketing.total_daily_budget = action.payload.total_daily_budget;
        appliedEffects.push("Updated total daily marketing budget.");
        break;
      case "pause_ads":
        state.marketing.ad_paused = action.payload.paused;
        appliedEffects.push(action.payload.paused ? "Paused paid ads." : "Resumed paid ads.");
        break;
      case "launch_kol_campaign":
        state.marketing.active_kol_campaigns += action.payload.campaign_count;
        state.finance.balance = roundTo(state.finance.balance - action.payload.spend, 2);
        state.finance.total_cost = roundTo(state.finance.total_cost + action.payload.spend, 2);
        state.brand.brand_awareness_score = roundTo(state.brand.brand_awareness_score + action.payload.campaign_count * 1.5, 2);
        appliedEffects.push("Started creator campaign spend.");
        break;
      case "reuse_kol_creative":
        state.marketing.primary_creative_style = action.payload.style;
        state.marketing.creative_fatigue = roundTo(Math.max(0, state.marketing.creative_fatigue - 0.15), 2);
        appliedEffects.push("Switched to creator-led creative.");
        break;
      case "start_promotion":
        if (!state.marketing.active_promotions.includes(action.payload.promotion_type)) {
          state.marketing.active_promotions.push(action.payload.promotion_type);
        }
        appliedEffects.push("Started promotion.");
        break;
      case "adjust_price":
        state.product.price = action.payload.new_price;
        appliedEffects.push("Updated product price.");
        break;
      case "switch_sales_mode":
        state.product.mode = action.payload.mode;
        appliedEffects.push("Changed sales mode.");
        break;
      case "reorder_inventory": {
        const shippingLeadTime = state.supply_chain.shipping_mode === "sea" ? 18 : state.supply_chain.shipping_mode === "mixed" ? 10 : 6;
        const inventoryCost = action.payload.quantity * action.payload.estimated_unit_cost;
        state.supply_chain.inventory_in_transit += action.payload.quantity;
        state.supply_chain.next_arrival_day = currentDay + shippingLeadTime;
        state.finance.balance = roundTo(state.finance.balance - inventoryCost, 2);
        state.finance.total_cost = roundTo(state.finance.total_cost + inventoryCost, 2);
        appliedEffects.push("Placed replenishment order.");
        break;
      }
      case "change_shipping_mode":
        state.supply_chain.shipping_mode = action.payload.shipping_mode;
        state.supply_chain.next_arrival_day = action.payload.next_arrival_day ?? state.supply_chain.next_arrival_day;
        appliedEffects.push("Changed shipping mode.");
        break;
      case "set_cash_reserve":
        state.finance.reserved_cash = action.payload.reserved_cash;
        appliedEffects.push("Updated reserved cash.");
        break;
    }

    state.decision_log.push({
      day: currentDay,
      actor: action.actor,
      action: action.action_type,
      detail: action.reason,
      impact_summary: action.expected_effect ?? null,
    });

    results.push({
      execution_id: randomUUID(),
      action_id: action.action_id,
      status: "completed",
      mode: "shadow",
      summary: appliedEffects.join(" "),
      applied_effects: appliedEffects,
      external_refs: [],
    });
  }

  return results;
}

export function applyEventsToState(state: CommerceWorldState, events: EventEntry[]): void {
  for (const event of events) {
    state.events.push(event);
    switch (event.type) {
      case "trend_shift":
        state.market_data.trends_score = clampNumber(
          (state.market_data.trends_score ?? 50) + (event.payload as TrendShiftPayload).score_delta,
          0,
          100,
        );
        state.market_data.trends_direction = (event.payload as TrendShiftPayload).direction;
        state.market_data.last_refresh_day = event.day;
        break;
      case "creator_result":
        if ((event.payload as CreatorResultPayload).outcome === "hit") {
          state.brand.brand_awareness_score = roundTo(state.brand.brand_awareness_score + 4, 2);
          state.marketing.creative_fatigue = roundTo(Math.max(0, state.marketing.creative_fatigue - 0.1), 2);
        }
        break;
      case "creative_fatigue_rise":
        state.marketing.creative_fatigue = roundTo(
          clampNumber(state.marketing.creative_fatigue + (event.payload as CreativeFatigueRisePayload).fatigue_delta, 0, 1.5),
          2,
        );
        break;
      case "supply_delay":
        if (state.supply_chain.next_arrival_day != null) {
          state.supply_chain.next_arrival_day += (event.payload as SupplyDelayPayload).delay_days;
        }
        break;
      case "stock_pressure":
        break;
      case "conversion_shift":
        state.world_context = {
          ...state.world_context,
          conversion_bias:
            (event.payload as ConversionShiftPayload).direction === "up"
              ? 0.06
              : (event.payload as ConversionShiftPayload).direction === "down"
                ? -0.06
                : 0,
        };
        break;
      case "cost_shift":
        state.world_context = {
          ...state.world_context,
          cost_bias:
            (event.payload as CostShiftPayload).magnitude === "high"
              ? 0.12
              : (event.payload as CostShiftPayload).magnitude === "medium"
                ? 0.06
                : 0.02,
        };
        break;
    }
  }
}
