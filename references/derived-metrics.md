# Kosbling Sim2Real OS — Derived Metrics

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines which business metrics Layer 0 should treat as:
- required boss-facing outputs
- derived runtime metrics
- non-core / later metrics

This avoids overloading the core state with too many fields while preserving useful business visibility.

---

## 2. Core rule

Not every useful business metric should be a first-class persisted state variable.

Layer 0 should separate:
- core state variables
- derived metrics
- optional later metrics

---

## 3. Required boss-facing metrics

These should be available in stage updates and final recap.

### Required set
- `orders`
- `revenue`
- `total_cost`
- `gross_profit`
- `balance`
- `inventory_in_stock`
- `stock_pressure_level`

### Strongly recommended
- `best_channel`
- `best_creative`
- `biggest_risk`
- `biggest_win`

---

## 4. Common Layer 0 derived metrics

These are useful, but do not all need to be persisted as first-class canonical state.

Examples:
- `ctr`
- `cpc`
- `conversion_rate`
- `roas`
- `gross_margin_pct`
- `burn_rate`
- `estimated_stockout_day`

These may be:
- computed from current state + stage outputs
- emitted in artifacts
- optionally cached if implementation finds it convenient

---

## 5. What should usually stay out of canonical core state

Examples:
- full per-channel daily KPI matrices
- full per-creative performance history
- full cohort analytics
- full attribution trees
- deep lifetime-value modeling

These are later-stage enrichments, not Layer 0 requirements.

---

## 6. Metric interpretation stance

Layer 0 should optimize for:
- understandable boss-facing metrics
- stable enough cross-stage comparisons
- enough visibility to support decisions

It should not optimize for full analytics-suite completeness.

---

## 7. Summary

The first implementation should keep the core state lean.
Useful business metrics should still appear, but many of them should remain derived outputs rather than permanent first-class fields.
