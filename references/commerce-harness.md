# Kosbling Sim2Real OS — Commerce Harness

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the commerce harness layer.

This is the domain-specific action/tool surface that sits between:
- agent cognition
- raw runtime/state internals

It is one of the most important architectural layers in the current system framing.

---

## 2. Why this layer exists

Without a commerce harness, the system tends to collapse into one of two bad outcomes:

### Bad outcome A
Agents directly mutate low-level state and engineering internals.

### Bad outcome B
Everything is hardcoded as a giant rules engine, and the agents become decorative.

The commerce harness avoids both.

---

## 3. What the harness is

The harness is the domain-specific action surface for commerce operations.

Agents should think in commerce-native terms like:
- budget
- price
- creator campaign
- shipping mode
- reorder
- promotion
- reserve cash

The harness then translates those into shadow effects and state updates.

---

## 4. Suggested Layer 0 domains

The first harness should at least cover:
- marketing
- supply
- finance
- brand (lightweight is acceptable)

---

## 5. Example harness actions

Examples include:
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

This list does not need to be exhaustive in v0.1.
It should be useful and coherent.

---

## 6. Harness responsibilities

The commerce harness should:
- validate action inputs at a lightweight level
- apply domain-aware shadow effects
- update the commerce world/state through structured handlers
- emit execution results for logging and recap

---

## 7. What the harness should not be

It should not be:
- a full live integration layer yet
- a generic agent platform abstraction
- a giant business rules encyclopedia

---

## 8. Summary

The commerce harness is the key middle layer that lets:
- agents stay intelligent
- the runtime stay structured
- shadow execution stay coherent
