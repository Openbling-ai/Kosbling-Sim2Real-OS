# Kosbling Sim2Real OS — Adapter Contract

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the boundary between:
- decision/proposal logic
- execution/simulation logic

In plain words:

> when the system decides to do something, what structured form should that decision take before the runtime applies it?

For the current Layer 0 cut, this contract should stay simple and Shadow-first.

---

## 2. Core principle

> **Same intent shape, even if execution sophistication changes later.**

For v0.1:
- execution will usually be mock/shadow execution
- Live Mode concerns should not complicate the first contract too much
- the main goal is traceability, state update discipline, and recap quality

---

## 3. Why this matters

Without a clear contract:
- the LLM emits vague prose
- state updates become hard to audit
- recap/counterfactual logic becomes messy
- agent/domain boundaries blur

So the adapter contract exists to ensure:
1. proposals are structured
2. runtime updates stay disciplined
3. recap and logging remain explainable

---

## 4. Layer 0 stance

For the current MVP cut:
- one LLM may be packaging multiple visible roles
- true multi-agent routing may not exist yet
- but the runtime should still receive structured action proposals rather than free-form text alone

This lets the product look richer than the first implementation architecture.

---

## 5. Recommended action proposal shape

```yaml
action_id: string
actor: string
action_type: string
target_type: string
target_ref: string | null
reason: string
payload: {}
risk_level: low | medium | high
expected_effect: string | null
```

This is enough for Layer 0.

---

## 6. Field meanings

### `action_id`
Unique action id for tracing.

### `actor`
Who is proposing the action.
Examples:
- `kos`
- `social_media_growth`
- `supply_chain_ops`
- `finance_guard`
- or internal domain labels like `ads_agent`

### `action_type`
What kind of change is being proposed.

### `target_type`
What kind of object is affected.
Examples:
- `campaign`
- `product`
- `inventory`
- `promotion`
- `supplier`

### `target_ref`
Local identifier if one exists.

### `reason`
Short human-readable explanation.

### `payload`
Structured business parameters.

### `risk_level`
Simple risk label for warnings and recap.

### `expected_effect`
Short summary of what the system expects this action to change.

---

## 7. Good Layer 0 action vocabulary

The first action vocabulary should stay small and useful.

Suggested early action types:
- `adjust_channel_mix`
- `set_daily_budget`
- `pause_ads`
- `launch_kol_campaign`
- `reuse_kol_creative`
- `adjust_price`
- `start_promotion`
- `reorder_inventory`
- `change_shipping_mode`
- `switch_to_presale`
- `set_cash_reserve`

This is more useful than trying to support every possible business action.

---

## 8. Example proposals

### 8.1 Shift budget toward TikTok

```yaml
action_id: act-001
actor: social_media_growth
action_type: adjust_channel_mix
target_type: marketing_channel
target_ref: paid-social
reason: TikTok is outperforming Facebook on CPC and early ROI.
payload:
  tiktok_budget_pct: 0.8
  facebook_budget_pct: 0.2
risk_level: low
expected_effect: Lower blended acquisition cost and improve paid efficiency.
```

### 8.2 Reorder inventory by air

```yaml
action_id: act-002
actor: supply_chain_ops
action_type: reorder_inventory
target_type: inventory
target_ref: primary_sku
reason: Current sell-through suggests stockout before sea shipment arrival.
payload:
  units: 50
  shipping_mode: air
  expected_arrival_day: 18
risk_level: high
expected_effect: Reduce stockout risk at higher landed cost.
```

### 8.3 Raise price

```yaml
action_id: act-003
actor: finance_guard
action_type: adjust_price
target_type: product
target_ref: primary_sku
reason: Demand appears resilient and current margin can be improved.
payload:
  old_price_usd: 119
  new_price_usd: 129
risk_level: medium
expected_effect: Lower conversion slightly but improve unit profit.
```

---

## 9. Execution result shape

After runtime applies a proposal, it should emit a structured execution result.

Suggested Layer 0 shape:

```yaml
execution_id: string
action_id: string
status: proposed | completed | failed
mode: shadow
executed_at: string | null
summary: string
applied_effects: []
external_refs: []
```

For Layer 0:
- `mode` should normally be `shadow`
- `external_refs` will usually be empty

---

## 10. What Layer 0 should avoid

Avoid overcomplicating the contract with:
- deep approval trees
- Live Mode provider-specific fields
- giant action vocabularies
- adapter-specific branching embedded in every action

That can come later.

---

## 11. Summary

For the first MVP cut, the adapter contract should be:
- small
- structured
- traceable
- Shadow-first
- good enough to support state updates, recap, and future expansion
