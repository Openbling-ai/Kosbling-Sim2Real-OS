# Kosbling Sim2Real OS — Engineering Overview

Status: Draft v0.2  
Date: 2026-03-23

---

## 1. Purpose

This document is the **engineering overview** for Kosbling Sim2Real OS.

It is **not** the implementation spec and **not** the field-by-field technical reference.

Its job is to answer four questions:

1. What are we actually building, from an engineering point of view?
2. What belongs to OpenClaw vs Sim2Real OS?
3. What is the high-level architecture shape?
4. Where should engineers go for the current implementation rules and technical specs?

Short version:

> This doc is the engineering map, not the turn-by-turn construction manual.

---

## 2. Engineering Goal

Build a system where:

1. a user defines a DTC business scenario
2. the system initializes a structured business world
3. a team of agents operates inside a simulated environment
4. the runtime maintains persistent state across simulated time
5. every important action is inspectable and auditable
6. the same decision shape can later be connected to real execution boundaries

The first engineering milestone is **not** full autonomous commerce.

The first milestone is:

> build a credible, inspectable, shadow-only Sim2Real runtime foundation.

---

## 3. Scope of this document

This document should cover:
- architecture direction
- system boundaries
- core engineering decisions
- document routing
- engineering risks and principles

This document should **not** try to fully define:
- scenario schema
- state schema
- action/adapter contract
- runtime phase details
- v0.1 implementation checklist

Those live elsewhere.

---

## 4. Core Architecture Decision

### Decision

**Do not build a new generic agent harness from scratch.**

Reuse OpenClaw as the lower execution substrate where possible.

Kosbling Sim2Real OS should focus on the domain-specific runtime above that layer.

### Practical interpretation

#### OpenClaw should provide
- model access
- tool routing
- session management
- sandboxed execution
- browser / local execution surfaces
- approval primitives and human-in-the-loop hooks
- multi-agent orchestration primitives

#### Sim2Real OS should provide
- scenario system
- business state model
- simulation clock and runtime loop
- shadow execution environment
- adapter boundary
- domain agents and business logic
- run artifacts and auditability
- evaluation/scoring logic

### Why this matters

This keeps the project focused on its real moat:
- business-state modeling
- sim-to-real transition
- operator-facing auditability
- reusable business scenarios and recipes

instead of wasting effort rebuilding generic runtime plumbing.

---

## 5. System Layers

## Layer 1 — Execution Substrate (OpenClaw)

Purpose:
- run agents locally
- expose tools and sessions
- provide operator control

## Layer 2 — Sim2Real Runtime Core

Purpose:
- load scenario
- initialize state
- advance simulated time
- orchestrate day-level execution
- route actions through adapters
- maintain shadow-world consistency

## Layer 3 — Domain Agents

Purpose:
- express business operating behaviors
- observe state
- propose structured actions
- react to risks, inventory, traffic, and finance conditions

## Layer 4 — Artifacts and Operator Surfaces

Purpose:
- make each run understandable
- preserve machine-readable and human-readable outputs
- support later replay, comparison, and visualization

---

## 6. Shadow Mode vs Live Mode

This remains the central product and engineering idea.

### Shadow Mode
- real or realistic inputs
- simulated write actions
- fake money / safe execution
- local state transitions
- no real external side effects

### Live Mode
- real inputs
- real execution boundaries
- real money / real consequences
- stronger approvals and reconciliation

### Invariant

> The agent intent shape should stay stable across both modes.

What changes is the execution boundary underneath, not the high-level business logic format.

For current v0.1 work, **Live adapter is intentionally not implemented**.

---

## 7. Current v0.1 Build Stance

The current engineering stance is:

> **Shadow-only, MVP-shaped foundation.**

Meaning:
- business scope stays intentionally narrow
- architecture shape should already resemble the real product
- implementation should stay local-first and inspectable
- Live adapter remains out of scope for now

Current v0.1 baseline:
- one scenario
- one primary channel
- one SKU
- three core agents as the implementation baseline
- explicit runtime phases
- structured artifacts and audit outputs

---

## 8. Where the real specs live

This is the most important routing section.

### Project-level docs
- `project/project-doc.md` — product definition and top-level concept
- `project/plain-english.md` — non-technical explanation
- `project/engineering.md` — this engineering overview

### Current implementation source of truth
- `implementation/v0.1-codex-implementation-brief.md`

### Technical references
- `references/scenario-spec.md` — scenario contract
- `references/state-model.md` — business state model
- `references/adapter-contract.md` — action intent and execution result contract
- `references/runtime-loop.md` — day-level runtime phases
- `references/live-state-sync.md` — future live-state alignment notes
- `references/ice-bath-na-v1.yaml.md` — reference scenario example

### Historical documents
- `archive/`

Rule:
- if this overview conflicts with the implementation brief or technical references,
  **the implementation brief and references win for current v0.1 work**.

---

## 9. What is intentionally left out of this overview

To keep this document clean, the following are intentionally delegated to other docs:

- exact scenario fields
- exact state fields
- exact action intent schema
- exact execution result schema
- exact runtime phase sequence
- exact repo/file scaffold for v0.1
- exact acceptance criteria

This prevents the engineering overview from drifting into a second, conflicting spec.

---

## 10. Main Engineering Risks

### Risk 1 — Runtime sprawl
Trying to build too many product ideas into v0.1 at once.

### Risk 2 — Weak state model
If state is vague or incomplete, the system becomes a storytelling machine instead of a simulation engine.

### Risk 3 — Adapter leakage
If shadow/live execution details leak into every module, future migration becomes messy.

### Risk 4 — Non-inspectable runs
If artifacts are weak, operators cannot trust or debug outcomes.

### Risk 5 — Premature Live work
If real integrations arrive too early, the project gets expensive and unstable before the shadow runtime proves value.

### Risk 6 — Spec duplication
If overview docs and implementation docs both try to define the same contracts, drift becomes inevitable.

---

## 11. Engineering Principles

1. **Local-first before cloud-first**
2. **State first, UI second**
3. **Auditability is mandatory**
4. **Adapter boundary must stay clean**
5. **One narrow scenario beats ten vague ones**
6. **Shadow value must exist before Live value**
7. **Do not let overview docs become duplicate specs**

---

## 12. What success looks like for this phase

This phase is successful when:
- the architecture direction is stable
- the implementation team has one clear v0.1 source of truth
- references define the technical contracts cleanly
- the project docs explain the system without conflicting with the implementation docs

In other words:

> the docs should route people correctly instead of competing with each other.

---

## 13. Final summary

Kosbling Sim2Real OS should be built as a **domain-specific runtime on top of OpenClaw**, not as a reinvention of generic agent infrastructure.

For the current phase:
- this document = engineering overview
- implementation brief = build guide
- references = technical contracts
- archive = history

That separation is intentional and should be preserved.
