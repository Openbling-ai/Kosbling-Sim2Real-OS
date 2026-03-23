# Kosbling Sim2Real OS — Codex Implementation Envelope

Status: Draft v0.1  
Date: 2026-03-20

---

## 1. Purpose

This document defines the **implementation envelope** for Codex during Phase 1.

It exists to answer one question clearly:

> What is Codex allowed to decide, and what is already decided by the project?

The goal is to prevent Phase 1 from drifting into unnecessary architecture, overbuilding, or a misread of the product direction.

---

## 2. Phase 1 Mission

Phase 1 has exactly one mission:

> **Prove that the Shadow Mode simulation loop can run end-to-end.**

Not to build the full system.
Not to build a platform.
Not to build Live Mode.
Not to build a production-ready architecture.

If the result can:
- load one scenario
- initialize one state
- run day-by-day for 30 days
- let 3 agents propose actions
- execute through `AdapterMock`
- update state coherently
- output `audit-log.md` and `summary.json`

then Phase 1 is successful.

---

## 3. What Is Already Decided

Codex must treat the following as fixed project constraints.

### 3.1 Product / architecture constraints

- The project is **Kosbling Sim2Real OS**.
- The core principle is:
  - **same agent logic, different execution boundary**
- The two long-term environments are:
  - `Shadow Mode`
  - `Live Mode`
- But **Phase 1 only implements Shadow Mode**.
- `OpenClaw` is the execution substrate to reuse, not something to rewrite.
- Do **not** deep-fork `OpenClaw`.
- Do **not** redesign this project as a separate generic agent framework.
- Sim2Real should remain the business simulation layer above the generic runtime substrate.

### 3.2 Sandbox meaning

For this project, MVP sandbox means:

> A local Shadow runtime that initializes state from a scenario, advances state through a daily runtime loop, routes all write actions through `AdapterMock`, and produces no real-world business side effects.

Codex may decide how to implement this locally.
Codex may **not** redefine sandbox into a heavy infrastructure project.

### 3.3 Scope constraints

Phase 1 scope is already constrained:

- exactly **1 scenario**: `ice-bath-na-v1`
- exactly **1 SKU**
- exactly **3 agents**:
  - `Supplier`
  - `Ads`
  - `Finance`
- exactly **1 mode**:
  - `Shadow Mode`
- outputs limited to:
  - `audit-log.md`
  - `summary.json`
  - supporting run files such as `state.json` and `actions.jsonl`

### 3.4 Out-of-scope constraints

Codex must **not** proactively add these in Phase 1:

- Web UI
- dashboard
- Live Mode execution
- real external API integration
- approval workflow
- full event system
- reconciliation system
- multi-scenario support
- plugin system
- generic SDK
- distributed infra
- microservices
- heavy abstraction for future extensibility

If something is only useful “later,” it should usually not be built now.

---

## 4. What Codex Is Allowed to Decide

Codex has freedom inside the envelope.

### 4.1 Local implementation details

Codex may decide:
- concrete file structure
- function and class names
- internal module split
- how run directories are organized
- how logs are written
- whether helpers are merged or split

### 4.2 Language and libraries

Default recommendation:
- **Python** for Phase 1

Codex may choose minimal supporting libraries if helpful, such as:
- YAML parsing
- schema validation
- simple CLI support

But Codex should avoid introducing large framework weight unless clearly necessary.

### 4.3 Internal API design

Codex may design small internal APIs such as:
- scenario loading
- state initialization
- agent proposal interface
- adapter execution interface
- audit artifact writers

But these should remain **local implementation APIs**, not an attempt to design a big public platform API surface.

---

## 5. Preferred Implementation Bias

When there is a choice, Codex should bias toward:

### Prefer
- simple over elegant
- local over distributed
- explicit over generic
- single-process over orchestration-heavy
- file-based persistence over infrastructure-heavy persistence
- crude but runnable over architecturally pure
- fewer modules over more modules
- direct business clarity over framework cleverness

### Avoid
- abstraction for abstraction’s sake
- interfaces designed only for hypothetical future use
- large dependency stacks
- premature optimization
- “platform thinking” in Phase 1
- deep directory trees before the loop works

---

## 6. OpenClaw Integration Boundary

This area is especially important.

### What Codex should assume

For Phase 1, the implementation does **not** need to fully integrate into `OpenClaw` runtime from day one.

A valid Phase 1 can be:
- a local runnable simulator implementation
- with a structure that can later be wrapped or connected into `OpenClaw`

### What Codex should preserve

Even if Phase 1 starts as a local runnable prototype, the code should preserve a clean future boundary for:
- tool/runtime invocation
- adapter switching
- audit artifacts
- scenario/state loading

### What Codex should not do

- do not modify `OpenClaw` core just to make Phase 1 work
- do not create a parallel replacement for `OpenClaw`
- do not tightly couple business simulation logic to OpenClaw internals in a way that becomes hard to maintain

In short:

> Build Phase 1 so it can later plug into `OpenClaw`, but do not make OpenClaw integration itself the Phase 1 bottleneck.

---

## 7. Sandbox Implementation Boundary

Codex may choose concrete mechanics, such as:
- JSON state files
- run directory layout
- checkpoint timing
- lightweight deterministic randomness
- simple market simulation heuristics

But must preserve the intended meaning:

- all write actions flow through `AdapterMock`
- no real API side effects
- run is inspectable after completion
- state changes are auditable

The sandbox is not meant to be:
- container orchestration
- VM isolation
- distributed job infra
- security sandbox research

It is a **business simulation sandbox**, not an operating-system sandbox.

---

## 8. Phase 1 Programming Bias

Unless there is a strong reason otherwise, Codex should implement Phase 1 with:

- **Python**
- minimal library usage
- plain files for persistence
- small local modules
- one main runnable entry

Suggested bias:
- schema/model layer can be simple
- runtime loop should be obvious to read
- agent logic can be rule-based or lightly structured
- market simulator should use explicit heuristics, not black-box complexity

This project does **not** need a framework-first implementation in Phase 1.

---

## 9. Complexity Kill-Switch

Before adding any new subsystem, Codex should ask:

1. Is this required to prove the Shadow loop works?
2. Is this already in scope for Phase 1?
3. Is this being added mainly because it might be useful later?

If the honest answer to (3) is yes, it should usually be cut.

### Examples of likely overbuild

- adding all 6 agents now
- building a full event engine now
- creating a generic plugin system now
- designing public REST APIs now
- building a web dashboard now
- over-engineering repo scaffolding before the loop runs

---

## 10. Expected Deliverable Shape

A good Phase 1 result looks like this:

- one scenario file
- one runnable entry point
- one minimal state engine
- one clear runtime loop
- three simple agents
- one `AdapterMock`
- one run output directory
- readable audit artifacts

A bad Phase 1 result looks like this:

- many modules, but no successful end-to-end run
- lots of future-ready abstractions, but unclear current behavior
- beautiful structure with weak business-state coherence
- infrastructure complexity that obscures the simulation loop

---

## 11. Final Rule

If there is tension between:
- architectural neatness
- future extensibility
- current simplicity

Phase 1 should choose:

> **current simplicity**

The project does not need a sophisticated foundation first.
It needs a believable, inspectable, minimal Shadow simulation that actually runs.
