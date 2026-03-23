# Kosbling Sim2Real OS — State Model

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the preferred first state shape for the current v0.1 / Layer 0 cut.

It answers:
- what the simulator must remember between turns
- what changes over time
- what should be visible to the user through chat updates
- what should remain simple enough for a fast first implementation

This is a reference/state-shape document, not a full implementation spec.

---

## 2. Design stance

The current Layer 0 state model should optimize for:
- chat-native simulation
- one visible 30-day run
- staged progress updates
- user intervention between chunks
- simple persistence
- enough realism to avoid anti-common-sense outputs

It should **not** yet optimize for:
- perfect domain completeness
- full Live Mode reconciliation
- deep branching history
- heavy analytics warehousing

---

## 3. State principles

1. The state should be **small but sufficient**
2. The state should support **pause / continue** in chat
3. The state should separate:
   - world setup
   - changing business state
   - logs/artifacts
4. The state should make it easy to explain:
   - what happened
   - why it happened
   - what changed after a user decision

---

## 4. Recommended top-level structure

```yaml
state:
  meta: {}
  product: {}
  supply_chain: {}
  marketing: {}
  brand: {}
  finance: {}
  market_data: {}
  decision_log: []
  events: []
```

This top-level shape is intentionally aligned with the current OPC Layer 0 business framing.

---

## 5. Top-level sections

### 5.1 `meta`
Run/session metadata.

Suggested fields:

```yaml
meta:
  session_id: string
  run_id: string
  current_day: number
  total_days: number
  status: idle | running | paused | completed
  seed: number | null
  last_user_checkpoint_day: number | null
```

### 5.2 `product`
What is being sold.

Suggested fields:

```yaml
product:
  name: string
  category: string
  market_region: string
  price: number
  unit_cost: number
  shipping_cost_sea: number | null
  shipping_cost_air: number | null
  mode: normal | presale | clearance
  additional_skus: []
```

### 5.3 `supply_chain`
Inventory, supplier, and fulfillment state.

Suggested fields:

```yaml
supply_chain:
  supplier:
    name: string
    moq: number | null
    unit_price: number
  inventory:
    in_stock: number
    in_transit_sea: number
    in_transit_air: number
  fulfillment: self_ship | dropship | three_pl
  reorder_point: number | null
  next_arrivals: []
```

### 5.4 `marketing`
Channel, campaign, creative, and creator/KOL state.

Suggested fields:

```yaml
marketing:
  channels: {}
  total_daily_budget: number
  ad_paused: boolean
  organic_social: {}
  kol_campaigns: []
  ad_creatives: []
  active_promotions: []
```

### 5.5 `brand`
Brand-layer state.

Suggested fields:

```yaml
brand:
  brand_style: string | null
  brand_story: string | null
  pr_campaigns: []
  brand_collabs: []
  brand_awareness_score: number | null
```

### 5.6 `finance`
Cash, spend, revenue, and summary financial state.

Suggested fields:

```yaml
finance:
  initial_budget: number
  balance: number
  reserved: number
  total_revenue: number
  total_cost: number
  gross_profit: number | null
  daily_log: []
```

### 5.7 `market_data`
Reality-layer grounded fields used by the current run.

Suggested fields:

```yaml
market_data:
  trends_score: number | null
  trends_direction: up | flat | down | null
  trends_change_pct: number | null
  seasonal_factor: number | null
  related_rising_queries: []
  top_regions: []
  competitor_count: number | null
  avg_competitor_price: number | null
  last_refresh_day: number | null
```

### 5.8 `decision_log`
Decision trace for recap and explanation.

Suggested shape:

```yaml
decision_log:
  - day: number
    actor: string
    action: string
    detail: string
    impact_summary: string | null
```

### 5.9 `events`
Runtime events and shocks.

Suggested shape:

```yaml
events:
  - day: number
    type: string
    status: active | resolved
    desc: string
    impact_summary: string | null
```

---

## 6. What should NOT live in state yet

The following should stay out of the first state model unless needed:
- raw web research dumps
- full prompt transcripts
- heavyweight agent memory stores
- full Live Mode external sync metadata
- overly granular metrics that do not affect decisions

Those can live in artifacts or later versions.

---

## 7. Persistence recommendation

For the current v0.1 cut, persistence should stay simple.

Recommended pattern:
- one latest state snapshot
- optional periodic history snapshots
- separate run artifacts for user-facing summaries

This is enough to support:
- pause / continue
- recap
- debugging
- basic replayability

---

## 8. User-visible implications

The state model should support generating:
- market snapshots
- 5-day progress updates
- risk warnings
- end-of-run recap / battle report
- simple counterfactual recap

If a field does not help state progression, explanation, or recap, it probably does not belong in Layer 0 state.

---

## 9. Summary

For the current MVP cut, the state model should behave like:
- a save file
- a business ledger
- a lightweight reality cache
- a recap source

It should be concrete enough to run a staged 30-day simulation, but small enough that implementation remains tractable.
