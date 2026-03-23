# Kosbling Sim2Real OS — Agent Role Design

Status: Draft v0.1  
Date: 2026-03-23

---

## 1. Purpose

This document defines the role of execution agents in the current product concept.

It answers:
- what agents are for
- what they should and should not own
- how they relate to user idea and strategy
- what the first set of agents should be

---

## 2. Core design stance

Execution agents are not the source of business intent.

The user provides the idea.
The system derives a `strategy_frame`.
The execution agents operate under that frame.

So agents should be understood as:

> LLM-based decision modules with clear business responsibilities.

They are not full human personas and do not replace the user’s strategic intent.

---

## 3. Role of execution agents

Each execution agent should:
- observe relevant state
- receive the current `strategy_frame`
- interpret signals from its area
- propose structured action intents
- explain reasoning briefly and concretely

Each execution agent should not:
- rewrite the user’s overall goal on its own
- mutate state directly
- bypass the adapter/runtime boundary
- behave like an unbounded free-form roleplay character

---

## 4. First-pass agent set

## Confirmed baseline for v0.1
- `ads_agent`
- `supply_agent`
- `finance_agent`

## Not baseline for v0.1, but likely later
- `store_agent`
- `creative_agent`
- `marketing_agent`

---

## 5. Agent responsibilities

## 5.1 Ads Agent

Owns:
- campaign launch / pause / scale suggestions
- traffic allocation ideas
- creative testing prioritization
- basic demand-testing recommendations

Likely action types:
- `launch_campaign`
- `pause_campaign`
- `scale_campaign_budget`

## 5.2 Supply Agent

Owns:
- inventory health interpretation
- reorder suggestions
- safety stock adjustments
- supply-risk awareness

Likely action types:
- `reorder_inventory`
- `change_safety_stock`

## 5.3 Finance Agent

Owns:
- cash-flow health interpretation
- budget risk warnings
- margin and burn-rate guardrails
- financial caution signals for other actions

Likely action types:
- `mark_risk_alert`
- `recommend_budget_cut`
- `recommend_hold_reorder`

---

## 6. Coordination model

Current preferred model:
- each agent proposes actions independently
- runtime validates structure and consistency
- runtime resolves conflicts and applies guardrails
- adapter executes approved actions in shadow mode

### Not currently preferred
- a big orchestrator agent making every final choice
- agent-to-agent free-form debate loops as a core dependency

---

## 7. Relationship to strategy

Agents should not read raw user idea as their only source of truth.

They should act based on:
- current state
- current strategy frame
- relevant market signals
- recent events / outcomes

This keeps execution aligned with what the user is actually trying to test.

---

## 8. Functional requirements

### Must have
- explicit agent input context
- explicit allowed action types
- schema-constrained outputs
- short reason field for auditability

### Should have
- lightweight conflict detection
- lightweight finance/risk checks before execution
- agent-specific explanation in run artifacts

### Not yet required
- long multi-turn agent debates
- persistent agent personas with rich social memory
- political/voting systems between agents

---

## 9. Open questions

1. Should finance be purely advisory, or able to block risky actions?
2. Should each agent get full state or only a filtered view?
3. Should there be a later `strategy_agent`, or is `strategy_frame` generation enough?
4. How much history does each agent need in v0.1?

---

## 10. Current conclusion

The first agent design should stay lean.

Three execution agents are enough to validate the product shape, as long as the system clearly separates:
- user intent
- strategy framing
- execution decisions
- runtime enforcement
