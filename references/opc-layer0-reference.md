# OPC Layer 0 Reference

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23
Source basis: `project/opc-mvp-business-version-2026-03-23.md`

---

## 1. Purpose

This document captures the business-derived reference material that is useful for implementation and prompt/behavior tuning, without turning the main design document into a business playbook.

It exists to answer:
- what the first user-visible OPC team should feel like
- what the chat interaction rhythm should be
- what a useful Layer 0 `SimState` roughly needs to cover
- what real-world grounding should anchor the first MVP
- what example user-facing artifacts should look like

This is a **reference document**, not the canonical design doc and not the execution brief.

---

## 2. Product-facing team layer

For Layer 0, the user-facing experience may present a visible team like this:

- `Kos` — CEO / coordinator / narrator in chat
- `Supply Chain Ops`
- `Social Media & Growth`
- `Brand & PR`
- `Finance Guard`

Important:
- this is a **product-facing persona layer**
- it does not require true multi-agent execution on day one
- one LLM may initially package outputs as if these roles exist, while the internal execution structure stays simpler

---

## 3. Chat interaction rhythm

The first MVP should feel like a staged chat operating rhythm.

### Recommended flow
1. user states product/business idea
2. system asks a very small number of clarifying questions
3. system returns a market/reality snapshot
4. user chooses start / adjust / switch
5. simulation advances in staged chunks
6. after each chunk, system pauses and waits for explicit user continuation
7. final output includes recap + next choices

### Key constraint
The system should **not auto-continue** unless the user explicitly says to continue.

---

## 4. Suggested staged run cadence

A practical first cadence is:
- 30 simulated days total
- reported in 5-day chunks

This gives the product:
- rhythm
- decision points
- room for the user to intervene
- a clearer sense of progress in chat

---

## 5. Layer 0 state coverage

The exact canonical schema belongs in state/spec docs.

But for Layer 0, the business MVP suggests that `SimState` should at least cover these domains:

- `meta`
- `product`
- `supply_chain`
- `marketing`
- `brand`
- `finance`
- `market_data`
- `decision_log`
- `events`

This should be treated as a useful reference shape, not yet a final locked schema.

---

## 6. First grounding anchor

For Layer 0, the first hard reality anchor should be:
- `Google Trends`

Useful associated grounded fields may include:
- trend score
- trend direction
- trend change percentage
- seasonal factor
- rising queries
- top regions
- rough competitor count
- average competitor price band

This is enough to make the first MVP feel grounded without building a heavy data pipeline.

---

## 7. Example business levers worth supporting early

The business MVP suggests the first version should support user instructions around levers like:
- channel mix changes
- budget changes
- KOL / creator collaboration
- creative remix / UGC / ad material changes
- price changes
- promotion changes
- reorder / shipping mode changes
- presale vs stock-based selling
- reserve-cash constraints

These are useful reference categories for action vocabulary and state transitions.

---

## 8. Example user-facing artifacts

Layer 0 should likely support outputs such as:

### 8.1 Market snapshot
A compact initialization artifact shown before the run starts.

### 8.2 Chunk update
A staged progress artifact after each 5-day block, including:
- what happened
- key metrics
- emerging risks
- decision options

### 8.3 End-of-run recap / battle report
A final artifact including:
- start vs end capital
- orders / revenue / profit summary
- best channel / best creative
- key decision recap
- simple counterfactuals
- next choices

---

## 9. What not to over-import from the business doc

The following should generally stay out of the canonical design doc unless they later become stable system requirements:
- detailed GTM / screenshot-sharing plans
- leaderboard concepts
- detailed marketing playbooks by category
- every fine-grained multiplier table
- every example prompt / conversation script in full

Those are valuable, but they belong in project/reference layers, not core design.

---

## 10. Summary

This document exists to preserve the business-side MVP sharpness while keeping the design layer clean.

In short, Layer 0 should feel like:
- an IM-native AI business team
- staged and interactive
- lightly but credibly grounded
- narrow enough to ship fast
