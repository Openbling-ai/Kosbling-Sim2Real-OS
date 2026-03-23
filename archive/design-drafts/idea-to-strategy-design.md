# Kosbling Sim2Real OS — Idea to Strategy Design

Status: Draft v0.1  
Date: 2026-03-23

---

## 1. Purpose

This document defines how a user's business idea becomes a simulation-ready strategy frame.

It exists to answer:
- what the user provides
- what the system needs to interpret
- what object should sit between raw user intent and execution agents
- how later user revisions should change the simulation

---

## 2. Core design stance

The simulator is **not** primarily a multi-agent toy.

Its core purpose is:

> help a user test, revise, and understand a business idea inside a shadow environment before risking real-world money.

So the system must not jump directly from `user idea -> execution agents`.
It needs an intermediate layer.

---

## 3. Core flow

```text
User Idea -> Idea Interpretation -> Strategy Frame -> Execution Agents -> Outcomes -> User Revision -> Updated Strategy Frame
```

The key engineering object introduced here is:

## `strategy_frame`

A structured representation of the current operating thesis for a run.

---

## 4. User input model

## 4.1 Confirmed inputs

The user may provide:
- product / category idea
- target market
- budget
- channel preference
- risk preference
- goal preference (profit / growth / validation / learning)
- constraints
- later revisions and feedback

## 4.2 Not yet fully decided

Still open:
- how free-form the user input should remain in v0.1
- whether we support guided forms or only natural language + scenario files
- whether user revisions happen only between runs or also mid-run

---

## 5. Strategy Frame

## 5.1 Role of `strategy_frame`

`strategy_frame` is the bridge between:
- what the user wants
- what the runtime simulates
- what the execution agents are allowed or encouraged to do

It is not the same as:
- raw user prompt
- scenario file
- evolving state
- final evaluation

It is the current operating thesis for this run.

## 5.2 Confirmed purpose

It should capture at least:
- primary objective
- current priorities
- risk tolerance
- budget stance
- growth vs margin preference
- inventory posture
- experimentation posture
- explicit guardrails

## 5.3 Suggested first shape

```yaml
strategy_frame:
  objective: validate_unit_economics | maximize_growth | protect_cash | mixed
  priority_order: []
  risk_posture: conservative | balanced | aggressive
  budget_style: cautious_testing | staged_scaling | front_loaded
  margin_preference: low | medium | high
  inventory_posture: conservative | balanced | aggressive
  experimentation_style: narrow | iterative | broad
  guardrails:
    max_daily_ad_spend_usd: number | null
    minimum_cash_buffer_usd: number | null
    margin_floor_pct: number | null
  thesis_notes: []
```

---

## 6. How the Strategy Frame is created

## 6.1 Proposed first-pass design

In v0.1:
- the system reads user idea + scenario constraints
- an interpretation step converts that into a structured `strategy_frame`
- the user can review / edit the resulting framing
- the simulation then runs under that frame

## 6.2 Not yet decided

Open question:
- should the strategy-frame creation step be LLM-generated, rule-assisted, or hybrid?

Current leaning:
- **LLM-assisted generation with strong schema validation**
- user-visible output
- editable before run begins

---

## 7. User revision model

A core product promise is not just simulation, but revision.

So later user input should not be treated as a fresh unrelated prompt every time.

## 7.1 Confirmed principle

User revision should update the `strategy_frame`, not merely override a few execution actions.

Examples:
- “Be more conservative with inventory”
- “I care more about profit than GMV now”
- “Test cheaper creatives first”

These should become structured changes to strategy, then flow into later execution.

## 7.2 Open questions

- does a revision create a brand-new run or branch an existing run?
- do we version `strategy_frame` across iterations?
- do we diff revisions explicitly for the user?

---

## 8. Relationship to scenario and state

## Scenario
Defines starting setup and world constraints.

## Strategy Frame
Defines how this run intends to operate inside that setup.

## State
Defines what actually changes over time during the run.

Short version:

> scenario = world setup  
> strategy_frame = operating thesis  
> state = evolving world

---

## 9. Functional requirements

### Must have
- a clear place in the system for user idea input
- a structured `strategy_frame`
- a visible mapping from user intent to strategy
- a way for later user revisions to modify strategy

### Should have
- strategy-frame preview before run start
- human-readable explanation of how the idea was interpreted
- strategy diff between revisions

### Not yet required
- autonomous strategy self-rewrite mid-run
- multi-strategy portfolio runs
- collaborative multi-user editing

---

## 10. Open questions

1. Is `strategy_frame` generated once per run, or continuously revisable during a run?
2. Does the user approve the interpreted strategy before execution begins?
3. Should user revisions be attached to scenario, strategy, or run history?
4. How much of the user idea is preserved as free text versus normalized structure?

---

## 11. Current conclusion

This layer is mandatory.

Without it, the simulator becomes a pile of execution agents without a clean representation of what the user is actually trying to test.
