# Kosbling Sim2Real OS — State Model

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the preferred first state shape for the agent-native commerce runtime.

The state should not be viewed as only a bookkeeping ledger.
It is the evolving commerce world the agents operate inside.

---

## 2. State role in the architecture

The state serves four purposes:
- world continuity
- commerce memory
- grounding container
- recap source

Without stable state, the agent runtime degenerates into disconnected chat turns.

---

## 3. Design stance

The state should be:
- compact enough to implement quickly
- rich enough to support causal continuity
- structured enough for harness actions to update it predictably
- readable enough for recap generation

For Layer 0, the goal is **not** to model every conceivable business variable.
The goal is to define a compact set of core variables that can support the staged shadow run.

---

## 4. Recommended top-level structure

```yaml
state:
  meta: {}
  world_context: {}
  product: {}
  supply_chain: {}
  marketing: {}
  brand: {}
  finance: {}
  market_data: {}
  decision_log: []
  events: []
  artifacts: {}
```

---

## 5. Core sections

### `meta`
Run/session metadata.

### `world_context`
The grounded external world backdrop for this run.
This should remain more stable than the fast-changing operational state.

### `product`
What is being sold and the few product variables that materially shape the run.

### `supply_chain`
Inventory, supplier, shipping, and fulfillment state.

### `marketing`
Channel budgets, campaign posture, creator/KOL work, and creative/promotion state.

### `brand`
Brand style and a small number of brand-level signals.

### `finance`
Cash, reserve, spend, revenue, cost, and profit signals.

### `market_data`
Grounded external market facts/signals currently relevant to the run.

### `decision_log`
Structured record of major decisions and why they happened.

### `events`
Structured record of shocks, exceptions, or notable stage changes.

### `artifacts`
Pointers/metadata for user-facing outputs such as market snapshot, chunk summaries, and final battle report.

---

## 6. Important design distinction

### `world_context`
Represents the business environment.
Example:
- category conditions
- market posture
- customer expectations
- competition pressure

### operational state sections
Represent what the business has done and what has happened so far.
Example:
- current budget split
- current inventory level
- current cash
- current creator campaign status

This distinction matters for agent reasoning.

---

## 7. Layer 0 core variables

This section defines the **minimum canonical variable set** for Layer 0.

These are the variables that should be treated as first-class state, not just informal hints.

### 7.1 `meta`

```yaml
meta:
  session_id: string
  current_day: integer
  status: running | paused | completed
  seed: integer | null
```

### 7.2 `product`

```yaml
product:
  name: string
  category: string
  price: number
  unit_cost: number
  mode: normal | presale | clearance
```

Optional but acceptable in Layer 0:
- `shipping_cost_sea`
- `shipping_cost_air`
- `additional_skus`

### 7.3 `supply_chain`

```yaml
supply_chain:
  supplier_name: string | null
  inventory_in_stock: integer
  inventory_in_transit: integer
  fulfillment_mode: self_ship | dropship | 3pl
  shipping_mode: sea | air | mixed | null
  reorder_point: integer
  next_arrival_day: integer | null
```

### 7.4 `marketing`

```yaml
marketing:
  total_daily_budget: number
  channel_mix:
    tiktok: number
    facebook: number
    other: number
  ad_paused: boolean
  primary_creative_style: string | null
  creative_fatigue: number
  active_kol_campaigns: integer
  active_promotions: string[]
  organic_posture: low | medium | high
```

Notes:
- `channel_mix` values should normally sum to ~1.0
- `creative_fatigue` can be a compressed score rather than a fully decomposed creative system
- `active_kol_campaigns` is the Layer 0 compressed form; richer KOL objects can be added later

### 7.5 `brand`

```yaml
brand:
  brand_style: string | null
  brand_awareness_score: number
```

Brand stays intentionally lightweight in Layer 0.

### 7.6 `finance`

```yaml
finance:
  initial_budget: number
  balance: number
  reserved_cash: number
  total_revenue: number
  total_cost: number
  gross_profit: number
```

Optional but acceptable in Layer 0:
- `daily_log`
- `gross_margin_pct`

### 7.7 `market_data`

```yaml
market_data:
  trends_score: number | null
  trends_direction: up | flat | down | null
  seasonal_factor: number | null
  competitor_count: integer | null
  avg_competitor_price: number | null
  top_regions: string[]
  last_refresh_day: integer | null
```

### 7.8 `decision_log`

Each entry should roughly support:

```yaml
- day: integer
  actor: string
  action: string
  detail: string
  impact_summary: string | null
```

### 7.9 `events`

Each entry should roughly support:

```yaml
- day: integer
  type: string
  desc: string
```

---

## 8. What is deliberately compressed in Layer 0

To avoid state explosion, the following should usually stay compressed in the first cut:
- detailed per-creative object graphs
- detailed per-KOL performance trees
- detailed supplier catalogs
- full daily KPI breakdowns for every channel
- large historical metric matrices

These can appear later if needed.

---

## 9. State update model

State should not be mutated arbitrarily by agent prose.

Preferred flow:

```text
agent reasoning
-> structured action proposal
-> commerce harness handler
-> shadow effect application
-> state update
-> artifact/log update
```

So the state is primarily changed through structured harness-mediated updates.

---

## 10. Minimum Layer 0 coverage

For v0.1, the state should at least be able to support:
- market snapshot before the run
- stage-by-stage continuity
- budget and channel changes
- price changes
- inventory / shipping changes
- creator/KOL campaign effects
- warnings and recap

If a field does not help one of those, it probably should not be added yet.

---

## 11. How state should change

The state should not be updated by a single generic mechanism.

Use four categories of state change:

### 11.1 Deterministic accounting
Hard arithmetic for:
- revenue
- spend
- balance
- gross profit
- inventory quantities

### 11.2 Business constraints / harness rules
Rule-bound updates for:
- reserve cash
- shipping consequences
- paused ads
- presale behavior
- stock boundaries

### 11.3 Grounded bounded uncertainty
Semi-uncertain but constrained updates for:
- reach/impressions
- CPC / traffic cost movement
- creator/KOL outcomes
- delay risk
- trend-sensitive performance

### 11.4 Agent-driven judgment
Judgment-heavy changes for:
- strategy shifts
- user-intent interpretation
- prioritization and decomposition
- explanation of why a decision is being made

The implementation should preserve this distinction.

---

## 12. Persistence stance

Keep persistence simple in v0.1.

Recommended:
- latest state snapshot
- stage/checkpoint snapshots if useful
- separate artifacts directory for user-facing outputs

No need for complex databases in the first cut.

---

## 13. Summary

The state model should behave like:
- a persistent commerce world
- a memory substrate for agents
- a grounding-aware shadow ledger
- the source of recap and explanation

And for Layer 0 specifically, it should prioritize:
- a **small canonical core variable set**
- not a fully expanded business world model
