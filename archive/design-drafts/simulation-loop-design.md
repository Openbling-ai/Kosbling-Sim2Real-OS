# Kosbling Sim2Real OS — Simulation Loop Design

Status: Draft v0.1  
Date: 2026-03-23

---

## 1. Purpose

This document defines the product-level loop of a simulation run.

It answers:
- what happens between idea input and user feedback
- where strategy, agents, state, and uncertainty enter the system
- how the user receives outcomes and decides what to revise

---

## 2. Core design stance

The simulation is not just a background engine.
It is a structured learning loop for the user.

The intended loop is:

```text
Idea -> Strategy -> Simulate -> Explain -> Revise -> Re-run
```

---

## 3. Outer loop vs inner loop

## 3.1 Outer loop (user loop)

This is the product loop:
1. user provides idea
2. system interprets strategy
3. simulation run executes
4. outcomes are summarized
5. user revises assumptions or strategy
6. next run begins

## 3.2 Inner loop (runtime loop)

This is the engine loop inside a run:
1. read current state
2. assemble agent context under current strategy
3. sample bounded uncertainty / events
4. collect action intents
5. validate / resolve / risk-check
6. execute through mock adapter
7. update state
8. log outcomes and write artifacts

The outer loop is user-facing.
The inner loop is runtime-facing.

---

## 4. Run lifecycle

## 4.1 Proposed phases

### Phase A — Prepare run
- load scenario
- ingest or derive `strategy_frame`
- initialize state
- create run workspace

### Phase B — Simulate
- execute day-level loop
- apply uncertainty
- gather agent actions
- update state
- track notable events

### Phase C — Summarize
- compute outcome summary
- explain success/failure drivers
- surface key turning points
- expose risk and uncertainty interpretation

### Phase D — Revise
- user adjusts assumptions or strategy
- system records the revision
- next run starts from new framing

---

## 5. Where uncertainty belongs

Uncertainty should enter during simulation, not at idea interpretation time.

Examples:
- market fluctuations
- demand variation
- ad performance variance
- supplier delay events

The user should still see a stable explanation of strategy and setup before the run starts.

---

## 6. What the user should see

A useful simulation loop should make four things visible:
- what was being tested
- what strategy the system used
- what happened during the run
- what likely caused the outcome

Without this, the product cannot support meaningful user revision.

---

## 7. Functional outputs from each run

A run should produce:
- state artifacts
- actions and execution logs
- event and uncertainty record
- summary metrics
- human-readable explanation
- clear hooks for the next revision

---

## 8. Revision model

A revision should ideally be attached to one of three layers:
- scenario assumptions
- strategy frame
- explicit constraints / guardrails

It should not feel like the user is yelling random tips into a black box.

---

## 9. Open questions

1. Can the user revise only between runs, or also pause and revise mid-run?
2. Does the system support branching from a previous run?
3. Should the product compare multiple runs side by side in early versions?
4. How much explanation is enough before the user gets overwhelmed?

---

## 10. Current conclusion

The real product loop is not “run a simulator once.”
It is “use simulation to refine business judgment over multiple iterations.”
