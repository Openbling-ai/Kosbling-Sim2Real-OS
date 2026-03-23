# Kosbling Sim2Real OS — Runtime Loop

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the preferred runtime rhythm for the current Layer 0 cut.

It answers:
- how a run begins
- how the simulation advances
- where the user can intervene
- how chat-stage updates should map onto the underlying runtime

This document is intentionally aligned with the current IM-native MVP direction.

---

## 2. Runtime stance

The first useful runtime is **not** a silent batch simulator.

It should behave like:
- a staged simulation engine
- surfaced through chat
- with explicit pause points
- with user-controlled continuation

So there are really two coupled loops:
- the **simulation loop**
- the **chat interaction loop**

---

## 3. High-level flow

```text
Idea Intake
-> Clarifying Questions
-> Reality / Market Snapshot
-> User chooses Start / Adjust / Switch
-> Staged Simulation Chunks
-> End-of-run Recap
-> User chooses what to do next
```

---

## 4. Layer 0 run cadence

Recommended first cadence:
- 30 simulated days total
- surfaced in 5-day chunks

That means the user experience feels like:
- Day 0: setup and market snapshot
- Day 1-5: first staged result
- Day 6-10: next staged result
- ...
- Day 26-30: final staged result
- final recap

This cadence can be adjusted later, but it is a strong first reference.

---

## 5. Step-level engine flow

Underneath each staged chunk, the engine still needs a day-level loop.

For each simulated day:
1. load current state
2. refresh lightweight market signals if needed
3. inject relevant events or changes
4. assemble current decision context
5. generate agent/action proposals
6. apply simple validation / guard checks
7. simulate execution via mock adapter
8. update state
9. append logs / checkpoints

This is the minimum useful engine skeleton.

---

## 6. Chunk-level chat flow

After each staged chunk, the system should produce a user-facing update.

A good chunk update should include:
- what happened in this period
- key metrics or changes
- emerging risk or tension
- decision point(s) for the user

Example shape:

```text
Day 6-10
- performance summary
- inventory / supply warning if any
- best/worst channel note
- balance update
- next decision options
```

---

## 7. Pause / continue rule

This is a core rule, not a UI detail.

The runtime should:
- pause after each staged chunk
- wait for explicit user continuation or adjustment
- not auto-continue unless explicitly configured later

This keeps the simulator interactive and boss-driven.

---

## 8. Reality refresh rule

Layer 0 should use lightweight reality refreshes.

Recommended stance:
- initial grounding before the run starts
- periodic refresh at chunk boundaries or every few simulated days
- no heavy real-time data pipeline in v0.1

Google Trends can serve as the first hard anchor.

---

## 9. Event model

Events should stay minimal in Layer 0.

Recommended event sources:
- grounded market movement
- scenario/scripted events
- limited stochastic events

Examples:
- trend spike
- supply delay
- KOL hit
- creative fatigue
- stockout risk

The goal is useful realism, not event-system complexity.

---

## 10. Terminal conditions

A run should end when one of these is true:
- planned duration is reached
- user stops the run
- business becomes non-viable under simple termination rules
- system marks run completed for recap

The first MVP can keep this simple.

---

## 11. Outputs by stage

### Before the run
- market snapshot
- strategy framing summary
- start / adjust / switch choice

### During the run
- staged chunk updates
- warnings
- decision options

### End of run
- recap / battle report
- major decision review
- simple counterfactuals if available
- next choices

---

## 12. What Layer 0 should avoid

The first runtime should avoid:
- complicated approval trees
- too many hidden substeps
- auto-running long sequences without user control
- deep asynchronous orchestration
- mixing Live Mode concerns into the default Shadow runtime

---

## 13. Summary

The current preferred runtime is:
- day-level internally
- chunked/staged externally
- chat-native in presentation
- explicitly user-controlled
- small enough to implement quickly
