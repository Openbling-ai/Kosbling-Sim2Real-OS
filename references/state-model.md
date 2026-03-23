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
What is being sold.

### `supply_chain`
Inventory, supplier, shipping, and fulfillment state.

### `marketing`
Channel budgets, campaigns, creative, creator/KOL work, and promotion-related state.

### `brand`
Brand style, PR-like initiatives, and higher-level brand signals.

### `finance`
Cash, reserve, spend, revenue, profit, and risk signals.

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
- category
- channel conditions
- competition pressure
- customer expectations

### operational state sections
Represent what the business has done and what has happened so far.
Example:
- current budget split
- current inventory level
- current cash
- creator campaign status

This distinction matters for agent reasoning.

---

## 7. State update model

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

## 8. Minimum Layer 0 coverage

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

## 9. Persistence stance

Keep persistence simple in v0.1.

Recommended:
- latest state snapshot
- stage/checkpoint snapshots if useful
- separate artifacts directory for user-facing outputs

No need for complex databases in the first cut.

---

## 10. Summary

The state model should behave like:
- a persistent commerce world
- a memory substrate for agents
- a grounding-aware shadow ledger
- the source of recap and explanation
