export const KOSBLING_DOMAINS = ["marketing", "supply", "finance", "product", "brand", "mixed"] as const;
export type KosblingDomain = (typeof KOSBLING_DOMAINS)[number];

export const ACTION_TYPES = [
  "set_channel_mix",
  "set_total_budget",
  "pause_ads",
  "launch_kol_campaign",
  "reuse_kol_creative",
  "start_promotion",
  "adjust_price",
  "switch_sales_mode",
  "reorder_inventory",
  "change_shipping_mode",
  "set_cash_reserve",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface SetChannelMixPayload {
  tiktok: number;
  facebook: number;
  other: number;
}

export interface SetTotalBudgetPayload {
  total_daily_budget: number;
}

export interface PauseAdsPayload {
  paused: boolean;
}

export interface LaunchKolCampaignPayload {
  campaign_count: number;
  spend: number;
  mode: string;
}

export interface ReuseKolCreativePayload {
  source: string;
  style: string;
}

export interface StartPromotionPayload {
  promotion_type: string;
  duration_days: number;
}

export interface AdjustPricePayload {
  new_price: number;
}

export interface SwitchSalesModePayload {
  mode: SalesMode;
}

export interface ReorderInventoryPayload {
  quantity: number;
  estimated_unit_cost: number;
}

export interface ChangeShippingModePayload {
  shipping_mode: ShippingMode;
  next_arrival_day?: number | null;
}

export interface SetCashReservePayload {
  reserved_cash: number;
}

export interface ActionPayloadByType {
  set_channel_mix: SetChannelMixPayload;
  set_total_budget: SetTotalBudgetPayload;
  pause_ads: PauseAdsPayload;
  launch_kol_campaign: LaunchKolCampaignPayload;
  reuse_kol_creative: ReuseKolCreativePayload;
  start_promotion: StartPromotionPayload;
  adjust_price: AdjustPricePayload;
  switch_sales_mode: SwitchSalesModePayload;
  reorder_inventory: ReorderInventoryPayload;
  change_shipping_mode: ChangeShippingModePayload;
  set_cash_reserve: SetCashReservePayload;
}

export const EVENT_TYPES = [
  "trend_shift",
  "creator_result",
  "creative_fatigue_rise",
  "supply_delay",
  "stock_pressure",
  "conversion_shift",
  "cost_shift",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface TrendShiftPayload {
  direction: "up" | "flat" | "down";
  score_delta: number;
}

export interface CreatorResultPayload {
  outcome: "hit" | "miss" | "mixed";
  uplift_strength: "low" | "medium" | "high";
}

export interface CreativeFatigueRisePayload {
  fatigue_delta: number;
}

export interface SupplyDelayPayload {
  delay_days: number;
}

export interface StockPressurePayload {
  level: RiskLevel;
}

export interface ConversionShiftPayload {
  direction: "up" | "flat" | "down";
  strength: "low" | "medium" | "high";
}

export interface CostShiftPayload {
  domain: string;
  magnitude: "low" | "medium" | "high";
}

export interface EventPayloadByType {
  trend_shift: TrendShiftPayload;
  creator_result: CreatorResultPayload;
  creative_fatigue_rise: CreativeFatigueRisePayload;
  supply_delay: SupplyDelayPayload;
  stock_pressure: StockPressurePayload;
  conversion_shift: ConversionShiftPayload;
  cost_shift: CostShiftPayload;
}

export const SCENARIO_STATUS = ["draft", "ready", "active", "paused", "completed"] as const;
export type ScenarioStatus = (typeof SCENARIO_STATUS)[number];

export const RUN_STATUS = ["running", "paused", "completed"] as const;
export type RunStatus = (typeof RUN_STATUS)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const EVENT_SOURCES = ["grounding", "action_fallout", "runtime", "stochastic"] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const EXECUTION_STATUSES = ["proposed", "completed", "failed"] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const ACTION_TARGET_TYPES = [
  "channel_mix",
  "budget",
  "ads",
  "kol_campaign",
  "creative",
  "promotion",
  "product",
  "inventory",
  "shipping",
  "reserve_cash",
] as const;
export type ActionTargetType = (typeof ACTION_TARGET_TYPES)[number];

export const ARTIFACT_TYPES = ["market_snapshot", "chunk_update", "final_battle_report"] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const CHANNELS = ["tiktok", "facebook", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

export const SALES_MODES = ["normal", "presale", "clearance"] as const;
export type SalesMode = (typeof SALES_MODES)[number];

export const SHIPPING_MODES = ["sea", "air", "mixed"] as const;
export type ShippingMode = (typeof SHIPPING_MODES)[number];

export const FULFILLMENT_MODES = ["self_ship", "dropship", "3pl"] as const;
export type FulfillmentMode = (typeof FULFILLMENT_MODES)[number];

export const ORG_POSTURES = ["low", "medium", "high"] as const;
export type OrgPosture = (typeof ORG_POSTURES)[number];

export interface ScenarioIdentity {
  name: string;
  category: string;
  target_market: string | undefined;
  region: string | undefined;
}

export interface ScenarioBusiness {
  product_name: string | undefined;
  product_category: string | undefined;
  positioning: string | undefined;
  initial_price: number | undefined;
  unit_cost: number | undefined;
}

export interface ScenarioBudget {
  starting_budget: number;
  reserve_cash: number | undefined;
  daily_budget_cap: number | undefined;
}

export interface ScenarioSimulation {
  total_days: number;
  chunk_days: number;
  mode: "shadow";
}

export interface ScenarioGrounding {
  anchor: "google_trends";
  query: string | undefined;
  locale: string | undefined;
  competitor_scan: boolean | undefined;
}

export interface ScenarioSuccessCriteria {
  primary_goal: string | undefined;
  target_profit: number | undefined;
  target_orders: number | undefined;
}

export interface ScenarioUserPreferences {
  tone: string | undefined;
  adjustment_style: "natural" | "guided" | undefined;
  max_clarifying_questions: number | undefined;
}

export interface Scenario {
  id: string;
  status: ScenarioStatus;
  identity: ScenarioIdentity;
  business: ScenarioBusiness;
  budget: ScenarioBudget;
  simulation: ScenarioSimulation;
  grounding: ScenarioGrounding;
  success_criteria: ScenarioSuccessCriteria;
  user_preferences: ScenarioUserPreferences;
  notes: string[] | undefined;
}

export interface MetaState {
  session_id: string;
  scenario_id: string;
  current_day: number;
  status: RunStatus;
  seed: number | null;
}

export interface ProductState {
  name: string;
  category: string;
  price: number;
  unit_cost: number;
  mode: SalesMode;
  shipping_cost_sea: number | undefined;
  shipping_cost_air: number | undefined;
  additional_skus: string[] | undefined;
}

export interface SupplyChainState {
  supplier_name: string | null;
  inventory_in_stock: number;
  inventory_in_transit: number;
  fulfillment_mode: FulfillmentMode;
  shipping_mode: ShippingMode | null;
  reorder_point: number;
  next_arrival_day: number | null;
}

export interface MarketingChannelMix {
  tiktok: number;
  facebook: number;
  other: number;
}

export interface MarketingState {
  total_daily_budget: number;
  channel_mix: MarketingChannelMix;
  ad_paused: boolean;
  primary_creative_style: string | null;
  creative_fatigue: number;
  active_kol_campaigns: number;
  active_promotions: string[];
  organic_posture: OrgPosture;
}

export interface BrandState {
  brand_style: string | null;
  brand_awareness_score: number;
}

export interface FinanceState {
  initial_budget: number;
  balance: number;
  reserved_cash: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
}

export interface MarketDataState {
  trends_score: number | null;
  trends_direction: "up" | "flat" | "down" | null;
  seasonal_factor: number | null;
  competitor_count: number | null;
  avg_competitor_price: number | null;
  top_regions: string[];
  last_refresh_day: number | null;
}

export interface DecisionLogEntry {
  day: number;
  actor: string;
  action: string;
  detail: string;
  impact_summary?: string | null;
}

export interface EventEntry {
  event_id: string;
  day: number;
  type: EventType;
  source: EventSource;
  desc: string;
  payload: EventPayloadByType[EventType];
  severity: RiskLevel;
}

export interface ArtifactRef {
  artifact_id: string;
  type: ArtifactType;
  day?: number | null;
  title: string;
  summary: string;
  uri?: string | null;
}

export interface ArtifactBase {
  artifact_id: string;
  type: ArtifactType;
  created_at_day: number;
  title: string;
  summary: string;
}

export interface MarketSnapshotArtifact extends ArtifactBase {
  type: "market_snapshot";
  recommendation_summary: string;
  next_decision_options: string[];
  market_heat: number | null;
  trend_direction: "up" | "flat" | "down" | null;
  indicative_cost_posture: string;
  indicative_competitive_posture: string;
}

export interface ChunkUpdateArtifact extends ArtifactBase {
  type: "chunk_update";
  day_start: number;
  day_end: number;
  orders: number;
  revenue: number;
  total_cost: number;
  gross_profit: number;
  balance: number;
  inventory_in_stock: number;
  inventory_in_transit: number;
  stock_pressure_level: RiskLevel;
  biggest_win: string;
  biggest_risk: string;
  best_channel: Channel | null;
  best_creative: string | null;
  decision_point: string;
}

export interface FinalBattleReportArtifact extends ArtifactBase {
  type: "final_battle_report";
  starting_budget: number;
  ending_balance: number;
  total_orders: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  best_channel: Channel | null;
  best_creative: string | null;
  biggest_mistake: string;
  biggest_winning_decision: string;
  recommended_next_move: string;
  key_decision_recaps: string[];
  counterfactuals: string[];
}

export type Artifact = MarketSnapshotArtifact | ChunkUpdateArtifact | FinalBattleReportArtifact;

export interface CommerceWorldState {
  meta: MetaState;
  world_context: Record<string, unknown>;
  product: ProductState;
  supply_chain: SupplyChainState;
  marketing: MarketingState;
  brand: BrandState;
  finance: FinanceState;
  market_data: MarketDataState;
  decision_log: DecisionLogEntry[];
  events: EventEntry[];
  artifacts: ArtifactRef[];
}

export type ActionProposal = {
  [K in ActionType]: {
    action_id: string;
    actor: string;
    domain: KosblingDomain;
    action_type: K;
    target_type: ActionTargetType;
    target_ref: string | null;
    reason: string;
    payload: ActionPayloadByType[K];
    risk_level: RiskLevel;
    expected_effect: string | null;
  };
}[ActionType];

export interface ExecutionResult {
  execution_id: string;
  action_id: string;
  status: ExecutionStatus;
  mode: "shadow" | "live";
  summary: string;
  applied_effects: string[];
  external_refs: string[];
}

export interface StageOutcome {
  orders: number;
  revenue: number;
  ad_spend: number;
  total_cost_delta: number;
  gross_profit_delta: number;
  balance_end: number;
  inventory_end: number;
  stock_pressure_level: RiskLevel;
  summary_notes: string[];
  best_channel?: Channel | null;
  best_creative?: string | null;
  biggest_risk?: string | null;
  biggest_win?: string | null;
}

export interface DerivedMetrics {
  orders: number;
  revenue: number;
  total_cost: number;
  gross_profit: number;
  balance: number;
  inventory_in_stock: number;
  stock_pressure_level: RiskLevel;
  best_channel: Channel | null;
  best_creative: string | null;
  biggest_risk: string | null;
  biggest_win: string | null;
}

export interface ValidationIssue {
  path: string;
  message: string;
}
