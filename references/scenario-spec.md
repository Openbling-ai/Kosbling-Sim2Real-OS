# Kosbling Sim2Real OS — Scenario Spec

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines how a business idea should be represented before a run starts.

It answers:
- what the run is trying to simulate
- what user choices shape the run
- what setup belongs in scenario/world framing versus evolving state

In plain terms, a scenario is:

> the structured starting setup for a single business simulation run.

---

## 2. What a scenario is

A scenario should contain the starting business definition and run setup.

It should include things like:
- product / category
- target market
- budget and basic constraints
- simulation duration
- grounding hints
- success criteria

It should **not** be the evolving run state.

---

## 3. Scenario vs state

### Scenario
- setup
- assumptions
- constraints
- desired success conditions

### State
- inventory now
- spend now
- performance now
- events that have happened
- decisions already taken

The scenario starts the run.
The state changes during the run.

---

## 4. Recommended Layer 0 shape

```yaml
scenario:
  identity: {}
  business: {}
  budget: {}
  simulation: {}
  grounding: {}
  success_criteria: {}
  user_preferences: {}
```

---

## 5. Suggested sections

### 5.1 `identity`
Basic identifiers.

```yaml
identity:
  scenario_id: string
  name: string
  version: string | null
```

### 5.2 `business`
What is being tested.

```yaml
business:
  product_name: string
  category: string
  market_region: string
  target_customer: string | null
  brand_positioning: string | null
  primary_channel: string | null
```

### 5.3 `budget`
Initial financial boundaries.

```yaml
budget:
  starting_cash_usd: number
  reserve_cash_floor_usd: number | null
  max_daily_ad_spend_usd: number | null
```

### 5.4 `simulation`
Run settings.

```yaml
simulation:
  mode: shadow
  duration_days: number
  stage_size_days: number
  time_granularity: day
  random_seed: number | null
```

For the current cut, `mode` should default to `shadow`.

### 5.5 `grounding`
Hints or sources for initial reality framing.

```yaml
grounding:
  trend_keyword: string | null
  supplier_source_hint: string | null
  competitor_source_hint: string | null
  use_google_trends: boolean
  use_lightweight_web_grounding: boolean
```

### 5.6 `success_criteria`
What counts as a useful or successful run.

```yaml
success_criteria:
  target_profit_usd: number | null
  target_roas: number | null
  max_stockout_days: number | null
  min_units_sold: number | null
```

### 5.7 `user_preferences`
User-side shaping preferences.

```yaml
user_preferences:
  risk_posture: conservative | balanced | aggressive | null
  wants_fast_iteration: boolean | null
  allow_user_adjustments_between_stages: boolean | null
```

---

## 6. Relationship to `world_context`

The scenario is not the whole world.

Instead:
- the scenario provides the starting business setup
- grounding + defaults enrich that setup
- the system then builds a `world_context`

In short:

```text
idea input / scenario -> grounding + defaults -> world_context -> run
```

---

## 7. Relationship to Layer 0 business MVP

The current business MVP suggests:
- idea intake should stay lightweight
- clarifying questions should be minimal
- the system should move quickly into market snapshot + start/adjust choice

So the scenario spec should remain compact enough that the product can form it from a short chat exchange.

---

## 8. Example Layer 0 scenario

```yaml
scenario:
  identity:
    scenario_id: ice-bath-na-v1
    name: Portable Ice Bath Tub — North America
    version: "0.1"

  business:
    product_name: Portable Ice Bath Tub
    category: recovery_fitness
    market_region: north_america
    target_customer: cold_plunge_curious_fitness_users
    brand_positioning: minimal_premium
    primary_channel: tiktok

  budget:
    starting_cash_usd: 5000
    reserve_cash_floor_usd: 1000
    max_daily_ad_spend_usd: 150

  simulation:
    mode: shadow
    duration_days: 30
    stage_size_days: 5
    time_granularity: day
    random_seed: 42

  grounding:
    trend_keyword: cold plunge
    supplier_source_hint: alibaba
    competitor_source_hint: tiktok_shop
    use_google_trends: true
    use_lightweight_web_grounding: true

  success_criteria:
    target_profit_usd: 1000
    target_roas: 2.0
    max_stockout_days: 3
    min_units_sold: 40

  user_preferences:
    risk_posture: balanced
    wants_fast_iteration: true
    allow_user_adjustments_between_stages: true
```

---

## 9. What to keep out of the scenario

Do not overload the scenario with:
- all runtime state values
- all grounded research output
- agent prompt details
- full event history
- every possible heuristic multiplier

Those belong elsewhere.

---

## 10. Summary

The Layer 0 scenario should be:
- compact
- chat-formable
- enough to ground the run
- clearly separate from evolving state
