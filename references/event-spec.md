# Kosbling Sim2Real OS — Event Spec

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the canonical Layer 0 event set.

Events are structured world-side changes, disturbances, or outcomes that happen during the run.
They are not proactive business decisions.

This is **not** an exhaustive business-world event library.
It is the compact event vocabulary needed for the first bounded implementation.

---

## 2. What an event is

An event is a structured representation of something that happened in the commerce world, such as:
- a grounding-driven shift
- a delayed outcome of a prior action
- a bounded stochastic disturbance
- an operational warning or pressure point

Events are reactive.
They represent something the world returns to the business.

---

## 3. Event model

Recommended common shape:

```yaml
event:
  event_id: string
  day: integer
  type: string
  source: grounding | action_fallout | runtime | stochastic
  desc: string
  payload: {}
  severity: low | medium | high
```

---

## 4. Layer 0 canonical event set

### 4.1 `trend_shift`

Use when grounded market signals materially change.

Example payload:

```yaml
payload:
  direction: up
  score_delta: 10
```

Direct state impact:
- `market_data.trends_score`
- `market_data.trends_direction`
- `market_data.last_refresh_day`

Common indirect effects:
- demand prior changes
- future reach / conversion conditions shift

---

### 4.2 `creator_result`

Use when creator/KOL work yields a meaningful outcome.

Example payload:

```yaml
payload:
  outcome: hit
  uplift_strength: medium
```

Direct state impact:
- may update `marketing.active_kol_campaigns` interpretation/logging
- may update `marketing.primary_creative_style` if creative reuse occurs

Common indirect effects:
- better later traffic/conversion priors
- stronger chance of creative reuse value

---

### 4.3 `creative_fatigue_rise`

Use when current creative performance begins degrading.

Example payload:

```yaml
payload:
  fatigue_delta: 0.12
```

Direct state impact:
- `marketing.creative_fatigue`

Common indirect effects:
- weaker later CTR/conversion priors

---

### 4.4 `supply_delay`

Use when inbound inventory or delivery assumptions slip.

Example payload:

```yaml
payload:
  delay_days: 5
```

Direct state impact:
- `supply_chain.next_arrival_day`

Common indirect effects:
- greater stock pressure risk
- later fulfillment stress

---

### 4.5 `stock_pressure`

Use when inventory posture becomes meaningfully risky.

Example payload:

```yaml
payload:
  level: medium
```

Direct state impact:
- may be recorded mainly in `events`
- may influence future decision pressure and warnings

Common indirect effects:
- stronger incentive to reorder, slow spend, or switch mode

---

### 4.6 `conversion_shift`

Use when effective conversion conditions change enough to matter.

Example payload:

```yaml
payload:
  direction: down
  strength: medium
```

Direct state impact:
- typically event/log level first

Common indirect effects:
- future revenue efficiency changes
- may affect later summaries and decision prompts

---

### 4.7 `cost_shift`

Use when important cost assumptions change.

Example payload:

```yaml
payload:
  domain: shipping
  magnitude: medium
```

Direct state impact:
- may directly affect `finance.total_cost` assumptions or future cost priors

Common indirect effects:
- weaker margin outlook
- pricing/fulfillment pressure

---

## 5. Event source rules

Layer 0 events should usually come from one of four sources:

### A. `grounding`
Example: Google Trends refresh changes the demand posture.

### B. `action_fallout`
Example: a KOL campaign later produces a creator_result.

### C. `runtime`
Example: stock pressure is triggered by stage progression and current inventory posture.

### D. `stochastic`
Example: bounded uncertain disturbance such as delay risk materializing.

---

## 6. Direct vs indirect event impact

Events, like actions, should not force every consequence into an immediate full-state rewrite.

### Direct impact
Immediate patch to a core variable.

### Indirect impact
Shift in future priors, warnings, likely outcomes, or pressure on later decisions.

This distinction keeps Layer 0 tractable.

---

## 7. Event compression rule

Many detailed real-world disturbances should be compressed into a small number of canonical event types.

For example:
- multiple kinds of creator upside can still be `creator_result`
- multiple kinds of demand movement can still be `trend_shift` or `conversion_shift`
- multiple logistical slips can still be `supply_delay`

This is deliberate.

---

## 8. Summary

Layer 0 should use a small canonical event vocabulary.
The goal is not to exhaustively simulate reality.
The goal is to provide enough structured world feedback to keep the staged shadow run believable, dynamic, and actionable.
