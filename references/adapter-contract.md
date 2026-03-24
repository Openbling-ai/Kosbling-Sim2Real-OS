# Kosbling Sim2Real OS — Adapter / Action Contract

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the structured boundary between:
- agent reasoning
- execution-agent / adapter execution
- world/state update

It is not just an adapter contract in the generic sense.
It is the action surface through which the agent runtime affects the commerce world.

---

## 2. Core idea

Agents should not directly manipulate raw implementation details.

Instead, planner agents should emit structured proposals, and execution agents should commit approved actions through the active adapter.

So the action contract is really the bridge between:
- semantic business reasoning
- domain-specific commerce actions
- adapter-backed execution effects

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

Approved execution may come from:
- an execution agent operating in `shadow` mode
- a future execution agent operating in `live` mode through the same action surface

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

## 6. Execution interpretation

Each approved action type should be committed through the active adapter.

In `shadow` mode, the adapter may call a domain-aware shadow handler.
In `live` mode, the adapter may route into real provider writes.

Examples:
- marketing handler
- supply handler
- finance handler
- brand handler
- future Shopify / ads / ops adapters

The execution boundary translates:
- approved proposal intent
into
- shadow effects on the commerce world
or
- future live operational writes

---

## 7. Execution result shape

After an action is applied, the runtime should produce a structured result.

```yaml
execution_id: string
action_id: string
status: proposed | completed | failed
mode: shadow | live
summary: string
applied_effects: []
external_refs: []
```

In v0.1, `mode` will usually be `shadow`, though a narrow `live` path may exist for provider-backed actions such as basic store writes.

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
- the input to the execution agent + adapter layer
- the bridge into shadow or live execution
