# Kosbling Sim2Real OS — Adapter / Action Contract

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the structured boundary between:
- agent reasoning
- commerce harness execution
- world/state update

It is not just an adapter contract in the generic sense.
It is the action surface through which the agent runtime affects the commerce world.

---

## 2. Core idea

Agents should not directly manipulate raw implementation details.

Instead, they should emit structured proposals that the commerce harness can apply.

So the action contract is really the bridge between:
- semantic business reasoning
- domain-specific commerce actions
- shadow execution effects

---

## 3. Recommended Layer 0 proposal shape

```yaml
action_id: string
actor: string
domain: marketing | supply | finance | brand | mixed
action_type: string
target_type: string
target_ref: string | null
reason: string
payload: {}
risk_level: low | medium | high
expected_effect: string | null
```

---

## 4. Who can emit proposals

In v0.1, proposals may come from:
- CEO agent directly
- domain role wrappers
- internal domain reasoning steps coordinated by CEO

The important thing is not the exact orchestration topology.
The important thing is that downstream execution receives structured proposals.

---

## 5. Good Layer 0 action types

The first action vocabulary should be domain-native and compact.

Examples:
- `adjust_channel_mix`
- `set_daily_budget`
- `pause_ads`
- `launch_creator_campaign`
- `reuse_creator_creative`
- `adjust_price`
- `start_promotion`
- `reorder_inventory`
- `change_shipping_mode`
- `switch_to_presale`
- `set_cash_reserve`

This is the beginning of the commerce harness surface.

---

## 6. Commerce harness interpretation

Each action type should be handled by a domain-aware shadow handler.

Examples:
- marketing handler
- supply handler
- finance handler
- brand handler

The harness layer translates:
- proposal intent
into
- shadow effects on the commerce world

---

## 7. Execution result shape

After an action is applied, the runtime should produce a structured result.

```yaml
execution_id: string
action_id: string
status: proposed | completed | failed
mode: shadow
summary: string
applied_effects: []
external_refs: []
```

In v0.1, `mode` should almost always be `shadow`.

---

## 8. Why this matters

This contract lets the system preserve all three of these at once:
- LLM flexibility
- structured state updates
- future live/shadow continuity

Without this layer, the system either collapses into:
- unstructured prose
or
- rigid hardcoded business rules

---

## 9. Summary

The action contract should be treated as:
- the structured output of agent cognition
- the input to the commerce harness
- the bridge into shadow execution
