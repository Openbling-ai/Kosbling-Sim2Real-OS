# Kosbling Sim2Real OS — Performance Rollout

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the preferred Layer 0 rollout logic for turning:
- current state
- recent actions
- recent events
- grounding inputs

into:
- stage performance
- updated business results
- user-facing summary outputs

This is not a full commerce simulation theory.
It is the minimum believable rollout model for the first bounded implementation.

---

## 2. Core rollout idea

At each stage, the system should convert the current commerce world into outcomes through a mixed mechanism:

1. deterministic accounting
2. bounded grounded uncertainty
3. agent-mediated judgment and explanation

The rollout should not be:
- fully hardcoded
- fully random
- fully improvised prose

---

## 3. Layer 0 rollout pipeline

Recommended flow:

```text
load current state
-> incorporate recent action effects
-> incorporate recent event effects
-> refresh grounding if needed
-> build stage performance context
-> generate stage-level performance outcome
-> apply accounting settlement
-> update state
-> emit artifact summary
```

---

## 4. Stage-level outcome model

For Layer 0, the stage should roughly answer:
- how much demand showed up
- how efficiently traffic converted
- how many orders occurred
- how much revenue and spend accumulated
- what inventory/cash consequences followed

The system does not need a giant KPI lattice in the first cut.
It only needs enough intermediate logic to produce believable stage results.

---

## 5. Three-layer rollout logic

### 5.1 Demand / attention layer
Inputs may include:
- `market_data.trends_score`
- `market_data.trends_direction`
- `market_data.seasonal_factor`
- channel mix
- total budget
- creator/KOL momentum
- promotion status
- organic posture

This layer produces a demand/attention envelope for the stage.

### 5.2 Conversion / efficiency layer
Inputs may include:
- price and mode
- promotion status
- creative fatigue
- creator/KOL uplift
- fulfillment/shipping posture
- trend and competitive context

This layer produces stage efficiency tendencies.

### 5.3 Settlement layer
Hard computation should then update:
- orders
- revenue
- cost
- balance
- gross profit
- inventory movement

---

## 6. How the stage should be generated

Layer 0 should prefer an **LLM-shaped stage rollout** rather than a thick hardcoded simulator.

Recommended pattern:
- give the LLM a structured summary of current state, recent actions, recent events, grounding, and allowed output fields
- ask it to produce a bounded stage outcome in a canonical structure
- apply thin validation/canonicalization
- use deterministic accounting for the hard arithmetic layer

This preserves the agent-native design while preventing uncontrolled drift.

---

## 7. What must remain deterministic

At minimum, these must be settled deterministically once the stage outcome is known:
- revenue
- total cost
- balance
- gross profit
- inventory in stock
- inventory in transit adjustments where applicable

---

## 8. What may remain bounded / model-like

Layer 0 may treat these as bounded rollout outputs rather than fully explicit inner-state systems:
- demand volume
- traffic efficiency
- creator/KOL uplift
- fatigue penalty
- trend lift/drag
- conversion softness/hardness

---

## 9. Minimum stage output fields

The stage rollout should be able to yield at least:

```yaml
stage_outcome:
  orders: integer
  revenue: number
  ad_spend: number
  total_cost_delta: number
  gross_profit_delta: number
  balance_end: number
  inventory_end: integer
  stock_pressure_level: low | medium | high
  summary_notes: string[]
```

Optional but useful:
- `best_channel`
- `best_creative`
- `biggest_risk`
- `biggest_win`

---

## 10. Validation stance

The runtime should lightly validate stage outcomes for coherence.
Examples:
- no impossible negative inventory
- spend cannot exceed plausible bounds without explanation
- revenue should not contradict orders × price in a nonsensical way
- balance changes should reconcile with accounting layer

The runtime should not try to replace the rollout model with a dense rules engine.

---

## 11. Summary

Layer 0 rollout should be understood as:
- LLM-first stage generation
- bounded by canonical output fields
- grounded by market inputs and current state
- settled by deterministic accounting for money/inventory math
