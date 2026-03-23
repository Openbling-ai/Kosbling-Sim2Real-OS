# Kosbling Sim2Real OS — Scenario Spec

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-23

---

## 1. Purpose

This document defines the starting setup shape for one run.

The scenario is what lets the agent-native commerce runtime start from a user idea and move into a grounded shadow world.

---

## 2. What the scenario is

A scenario is the compact structured input for a single run.

It should contain:
- business identity
- budget and constraints
- simulation settings
- grounding hints
- user preferences
- success criteria

It should be compact enough to be formed from a short chat exchange.

---

## 3. What the scenario is not

It is not:
- the full evolving state
- the entire grounded world context
- the runtime log
- the artifact store

Instead, it is the structured starting point that helps build the run.

---

## 4. Suggested shape

```yaml
scenario:
  identity: {}
  business: {}
  budget: {}
  simulation: {}
  grounding: {}
  success_criteria: {}
  user_preferences: {}
```

---

## 5. Important relationship

The scenario should flow into the runtime like this:

```text
user idea
-> CEO agent interpretation
-> compact scenario
-> grounding + world_context build
-> state init
-> staged run
```

This means the scenario is an agent/runtime handoff object, not a standalone product object.

---

## 6. Layer 0 stance

For v0.1, scenario formation should stay lightweight.

The CEO agent should be able to form a workable scenario from:
- user idea
- a few clarifying answers
- defaults
- grounding hints

No large setup wizard is required.

---

## 7. Summary

The scenario should be treated as:
- a compact starting contract
- easy for the CEO agent to assemble
- sufficient to launch grounding and state initialization
