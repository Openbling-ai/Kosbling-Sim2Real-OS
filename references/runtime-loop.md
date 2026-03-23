# Kosbling Sim2Real OS — Runtime Loop

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the preferred runtime loop for the current system framing.

The runtime should be understood as:
- an agent-native commerce runtime
- currently operating in shadow mode
- surfaced to the user through staged chat interaction

---

## 2. Core runtime idea

There are three coupled flows:

1. **user interaction flow**
2. **agent decision flow**
3. **world/state update flow**

A good runtime keeps these aligned.

---

## 3. External user flow

The user-facing rhythm should be:

```text
Idea Intake
-> Clarification if needed
-> Market Snapshot
-> Start / Adjust / Switch
-> Day 1-5 update
-> Pause
-> Day 6-10 update
-> Pause
-> ...
-> Final battle report
```

The user should not need to use a formal control language.
The CEO agent should interpret natural language adjustments.

---

## 4. Internal runtime loop

At a high level, each stage should do this:

1. read current state
2. refresh grounding if needed
3. build current world/decision context
4. let the CEO agent interpret user intent and coordinate downstream reasoning
5. let role/domain logic produce structured action proposals
6. send proposals through commerce harness handlers
7. apply shadow effects to state
8. generate candidate events with an LLM-first event step, then validate/canonicalize them lightly in runtime
9. record decisions, events, and artifacts
10. emit the next staged chat update

---

## 5. Day-level vs stage-level

### Day-level
Internally, the world may still advance one simulated day at a time.

### Stage-level
Externally, the user should experience chunked updates.

Recommended v0.1 default:
- total run = 30 days
- stage size = 5 days

This keeps the runtime interactive and understandable.

---

## 6. CEO-driven interpretation

The CEO agent should be the top-level semantic coordinator.

Responsibilities include:
- interpret user messages
- determine whether clarification is needed
- translate natural language adjustments into structured downstream actions
- decide when to ask the user for a decision versus when to continue the staged plan

This is a core runtime behavior, not just a UI flourish.

---

## 7. Commerce harness execution

The runtime should not let agents mutate raw state directly.

Instead, structured proposals should be applied through a commerce harness layer.

Examples:
- marketing handlers
- pricing handlers
- supply handlers
- promotion handlers
- finance handlers

These handlers are responsible for producing shadow-mode world changes.

---

## 8. Grounding refresh

Grounding should stay lightweight but real.

Recommended v0.1 approach:
- initial grounding before first market snapshot
- optional refresh at stage boundaries
- Google Trends as first hard anchor
- fixture/mock only for dev/test/degraded fallback

---

## 9. Event and shock model

Events should remain minimal in Layer 0.

Useful examples:
- trend spike
- supply delay
- creator/KOL hit
- creative fatigue
- stockout risk

Events should help the world feel alive, but should not dominate the architecture.

---

## 10. Pause / continue rule

The runtime must pause after a staged update and wait for the user before proceeding further.

This is one of the core product constraints.

---

## 11. Outputs

At minimum, the runtime should emit:
- market snapshot
- staged updates
- warnings / decision prompts
- final battle report

These are not secondary artifacts. They are part of the product surface.

---

## 12. Summary

The runtime should behave like:
- an agent host for commerce work
- a stateful shadow world
- a staged chat-native operating loop
- a bridge between agent decisions and commerce-world effects
