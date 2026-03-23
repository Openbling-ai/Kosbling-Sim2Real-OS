# Kosbling Sim2Real OS — Action Spec

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the canonical Layer 0 action set.

Actions are the structured commerce decisions that agents use to change the world.
They are the primary input surface of the commerce harness.

This is **not** a list of every possible business action.
It is the compact action vocabulary needed for the first bounded implementation.

---

## 2. What an action is

An action is a structured representation of:
- a user instruction
- an agent decision
- or a coordinated execution choice

Actions are proactive.
They represent something the business chooses to do.

---

## 3. Action model

Recommended common shape:

```yaml
action:
  action_id: string
  actor: string
  domain: marketing | supply | finance | product | mixed
  action_type: string
  payload: {}
  reason: string | null
  expected_effect: string | null
  risk_level: low | medium | high
```

---

## 4. Layer 0 canonical action set

### 4.1 `set_channel_mix`

Use when the business changes budget distribution across channels.

Example payload:

```yaml
payload:
  tiktok: 0.8
  facebook: 0.2
  other: 0.0
```

Direct state impact:
- `marketing.channel_mix`

Common indirect effects:
- later traffic cost profile changes
- later reach / conversion mix changes

Natural-language examples that should compress here:
- “80% 给 TikTok”
- “FB 和 TikTok 各 50%”
- “把预算往 TikTok 倾斜”

---

### 4.2 `set_total_budget`

Use when daily/active marketing budget changes.

Example payload:

```yaml
payload:
  total_daily_budget: 120
```

Direct state impact:
- `marketing.total_daily_budget`

Common indirect effects:
- later spend, reach, and CAC dynamics

---

### 4.3 `pause_ads`

Use to pause or resume paid advertising.

Example payload:

```yaml
payload:
  paused: true
```

Direct state impact:
- `marketing.ad_paused`

Common indirect effects:
- paid traffic suppressed while paused

---

### 4.4 `launch_kol_campaign`

Use when starting creator/KOL outreach or paid collaboration.

Example payload:

```yaml
payload:
  campaign_count: 2
  spend: 230
  mode: paid_review
```

Direct state impact:
- `marketing.active_kol_campaigns`
- `finance.balance`
- `finance.total_cost`

Common indirect effects:
- later `creator_result` event probability rises
- creative pool may improve later

---

### 4.5 `reuse_kol_creative`

Use when creator/KOL content is turned into ad creative.

Example payload:

```yaml
payload:
  source: kol
  style: ugc_testimonial
```

Direct state impact:
- `marketing.primary_creative_style`
- optionally resets/reduces part of fatigue if implementation chooses

Common indirect effects:
- later CTR / conversion prior may improve

---

### 4.6 `start_promotion`

Use for limited-time promos, flash sale, discount push, etc.

Example payload:

```yaml
payload:
  promotion_type: flash_sale
  duration_days: 3
```

Direct state impact:
- `marketing.active_promotions`

Common indirect effects:
- later conversion uplift
- possible margin pressure

---

### 4.7 `adjust_price`

Use when product price changes.

Example payload:

```yaml
payload:
  new_price: 129
```

Direct state impact:
- `product.price`

Common indirect effects:
- later conversion changes
- later revenue / margin changes

---

### 4.8 `switch_sales_mode`

Use when changing between normal / presale / clearance.

Example payload:

```yaml
payload:
  mode: presale
```

Direct state impact:
- `product.mode`

Common indirect effects:
- conversion penalty or demand shift
- stock pressure relief

---

### 4.9 `reorder_inventory`

Use when restocking.

Example payload:

```yaml
payload:
  quantity: 100
  estimated_unit_cost: 34
```

Direct state impact:
- `supply_chain.inventory_in_transit`
- `finance.balance`
- `finance.total_cost`

Common indirect effects:
- future stock pressure relief

---

### 4.10 `change_shipping_mode`

Use when choosing sea / air / mixed.

Example payload:

```yaml
payload:
  shipping_mode: air
  next_arrival_day: 18
```

Direct state impact:
- `supply_chain.shipping_mode`
- `supply_chain.next_arrival_day`
- possibly `finance.total_cost`

Common indirect effects:
- delay risk changes
- future inventory availability changes

---

### 4.11 `change_fulfillment_mode`

Use when switching self-ship / dropship / 3pl.

Example payload:

```yaml
payload:
  fulfillment_mode: dropship
```

Direct state impact:
- `supply_chain.fulfillment_mode`

Common indirect effects:
- cost profile changes
- delivery/risk posture changes

---

### 4.12 `set_cash_reserve`

Use when locking budget as reserve.

Example payload:

```yaml
payload:
  reserved_cash: 2000
```

Direct state impact:
- `finance.reserved_cash`

Common indirect effects:
- less deployable capital for ads/procurement

---

## 5. Direct vs indirect effects

Every action should be understood in two layers.

### Direct effects
Immediate changes to core state fields.

### Indirect effects
Delayed or probabilistic consequences that influence future stage outcomes, event likelihood, or performance priors.

The runtime should not force every indirect effect to become an immediate numeric patch.

---

## 6. Action compression rule

User language can be very rich.
The Layer 0 action set should remain compact.

Many natural-language variants should map into the same canonical action type.

This is deliberate.

---

## 7. Summary

Layer 0 should use a small canonical action vocabulary.
The goal is not full business coverage.
The goal is enough structured action power to drive the core state model and staged shadow runtime.
