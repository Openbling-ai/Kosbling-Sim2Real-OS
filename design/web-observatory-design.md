# Kosbling Sim2Real OS — Web Observatory Design

Status: Draft for next-phase product work  
Date: 2026-03-24  
Audience: Product / design / frontend / implementation

---

## 1. Purpose

This document defines the intended product shape for the first Kosbling Web UI.

It is **not** a replacement for the runtime design.
It is the presentation and observability layer for the existing agent-native commerce runtime.

The Web UI should make the simulator legible.

Its job is to let a user:
- see how the team is reasoning
- see how actions and events propagate into business outcomes
- inspect a run without reading raw JSON or markdown files
- replay the simulation as a coherent operating story

---

## 2. Product framing

Do **not** frame the Web UI as:
- a generic BI dashboard
- a CRUD admin console
- a store operations panel
- a live-commerce control surface

Frame it as:

> **a simulation observatory for an AI commerce team**

More plainly:

> a CEO-facing command center for inspecting and understanding a Kosbling store

Even more plainly:

> the user should feel like they are standing in the CEO position, looking across the whole store, then drilling into the why

The primary value is **visible causality**:
- what the boss said
- what each role proposed
- what Kos chose
- what the execution agent committed
- what changed in the business as a result

But the entry point should not be the log.
The entry point should be the business as a whole.

---

## 3. Why this matters

The current CLI runtime already produces rich structured artifacts:
- `run.json`
- `scenario.json`
- `grounding.json`
- `state.json`
- `chunks.json`
- `market-snapshot.md`
- `chunk-XX.md`
- `chunk-XX-team-trace.md`
- `final-battle-report.md`

But those artifacts are still file-centric.

The Web UI should convert them into:
- a visual timeline
- a state-and-metrics replay
- a team collaboration view
- an interpretable simulation story

Without this layer, one of the strongest parts of the product stays hidden:

> the user cannot easily see the whole team operating the business over time.

---

## 4. Product goals

The first Web UI should optimize for these goals:

1. **CEO-level situational awareness**
   A user should be able to understand the overall store posture before reading detailed traces.

2. **Replayability**
   A completed or paused run should still be easy to inspect phase by phase and chunk by chunk.

3. **Observability**
   The user should be able to see team proposals, merge rationale, execution order, events, and resulting state shifts.

4. **Business legibility**
   The user should understand why cash, inventory, orders, and profit moved.

5. **Shareability**
   A run should feel presentable enough to demo, review, or share internally.

6. **Low coupling**
   The first UI should consume existing run artifacts instead of requiring a runtime rewrite.

---

## 5. Non-goals for the first UI cut

Do **not** treat the first Web UI as:
- a full Live Ops cockpit
- a credential-binding surface
- a multi-user collaboration system
- a real-time streaming control room
- a substitute for the CLI intake flow

The first cut should be:
- read-oriented
- replay-oriented
- artifact-backed
- local-first

Write controls can come later.

---

## 6. UX principles

The UI should feel like a mix of:
- a command center
- a business war-room
- a simulation replay system
- an AI team operating journal

It should preserve:
- an obvious CEO point of view
- visible causality
- high signal density
- strong hierarchy
- clear Shadow/Live labeling
- fast navigation between chunks
- confidence that nothing important is hidden

It should avoid:
- dashboard sludge
- too many equal-weight widgets
- generic SaaS admin aesthetics
- hiding agent reasoning behind vague summaries

---

## 7. First UI scope

The first useful Web UI should support these surfaces.

### 7.1 Run index

Purpose:
- list available runs
- show run status at a glance
- let the user open a run replay

Minimum content:
- run id
- scenario name
- status
- current day / total day
- ending balance or current balance
- latest update timestamp

### 7.2 Run overview

Purpose:
- give a compact CEO-level summary of the full store

Minimum content:
- scenario summary
- current phase: setup / readiness review / launched / operating / paused / completed
- launch decision posture
- grounding summary
- current mode (`shadow` / future `live`)
- budget / balance / revenue / total cost / gross profit
- total orders
- latest biggest risk
- latest biggest win

### 7.3 Store operating cockpit

Purpose:
- show how the store is functioning as a whole right now

Minimum content:
- product / offer posture
- sourcing / supplier / MOQ posture
- inventory and in-transit posture
- storefront readiness
- launch assets / creative readiness
- traffic and channel posture
- finance health and reserve pressure
- blockers and accepted risks

This is the heart of the first UI.

### 7.4 Timeline / phase navigator

Purpose:
- let the user move through setup, launch, and operating stages

Minimum content:
- setup and launch milestones
- chunk list
- day range
- boss message preview
- major event markers
- KPI delta preview
- current selection state

### 7.5 CEO decision panel

Purpose:
- show how the CEO reached the current posture

Minimum content:
- launch decision
- blocker acceptance / delay rationale
- role recommendation summary
- final merged decision
- canonical approved actions

### 7.6 Team collaboration panel

Purpose:
- show how the team reasoned and coordinated under the CEO view

Minimum content:
- role summaries
- role watchouts
- handoff tickets
- resolved handoffs
- CEO merge summary
- CEO merge rationale
- approved actions
- execution order
- execution results

### 7.7 Metrics and state panel

Purpose:
- show business consequences of each chunk

Minimum content:
- balance curve
- revenue / total cost / gross profit
- orders per chunk
- inventory in stock / in transit
- ad spend
- trend / market pressure markers when available

### 7.8 State-diff / causality panel

Purpose:
- answer: “what changed, and why?”

Minimum content:
- pre/post chunk state highlights
- actions that likely drove the shift
- events that modified outcomes
- bottleneck indicators

### 7.9 Artifact drawer

Purpose:
- preserve the underlying markdown artifacts

Minimum content:
- market snapshot markdown
- chunk update markdown
- team trace markdown
- final battle report markdown

This helps preserve auditability and trust.

---

## 8. Information architecture

Recommended page structure for the first cut:

### A. `/runs`
- run list
- status filters
- latest metrics summary

### B. `/runs/:runId`
- overview header
- left rail phase/timeline
- main content area with CEO cockpit and selected stage
- right rail metrics/state

### C. `/runs/:runId/chunks/:chunkNumber`
- deep-linkable chunk replay

The default run view should first answer:
- what the store is
- whether it is launchable
- how it is operating
- what the CEO should worry about next

Then the selected chunk view should combine:
- boss message
- role proposals
- CEO merge
- execution
- event outcome
- state consequences

---

## 9. Data model for the UI

The first UI should consume existing persisted run artifacts.

### Required sources
- `run.json`
- `chunks.json`
- `state.json`
- `grounding.json`
- markdown artifacts in the run folder

### Strong recommendation
Do not make the first UI parse markdown as its primary data source.

Instead:
- use JSON as the canonical data source
- use markdown as an auxiliary artifact viewer

The current runtime already stores enough structured data for a first replay UI.

---

## 10. Runtime/UI boundary

The first UI should be **observer-first** and **CEO-cockpit-first**.

That means:
- it reads run outputs
- it visualizes them
- it does not need to drive the simulation loop directly

Possible future upgrades:
- trigger resume / continue from UI
- start new run from UI
- live event streaming
- simulation speed controls

But those are later.

---

## 11. Visual design direction

The UI should not look like a generic white-card analytics product.

Recommended direction:
- desktop-first command-center layout
- bold chunk timeline
- strong visual separation between:
  - team reasoning
  - execution
  - business state
- visual labels for:
  - Shadow vs Live
  - risks
  - wins
  - handoffs
  - unresolved items

Design language suggestions:
- newsroom / mission-control / operations-room energy
- high contrast but not dark-mode-only
- chunky timeline markers
- obvious state transitions
- charts that emphasize movement over ornament

The UI should feel:
- intentional
- inspectable
- dramatic
- trustworthy

Above all, it should make the user feel that they can oversee the entire store before dropping into the timeline.

---

## 12. First-release user stories

1. As a user, I can open a run and understand the store’s overall posture without reading raw files.
2. As a user, I can see whether the store is ready to launch and what blockers or accepted risks exist.
3. As a user, I can inspect a chunk and see which role suggested what.
4. As a user, I can see why Kos chose one plan over another.
5. As a user, I can see how actions and events changed cash, inventory, and orders.
6. As a user, I can spot unresolved handoffs and recurring risks across phases and chunks.
7. As a user, I can use the UI to present the simulator to another person.

---

## 13. Acceptance criteria for the first Web UI

The first cut is successful if:

1. a user can browse runs visually
2. a user can understand whole-store posture before opening a chunk
3. a user can inspect phase-by-phase and chunk-by-chunk progress
4. multi-agent collaboration is clearly visible
5. execution order and execution results are visible
6. state/metric movement is visible across chunks
7. markdown artifacts remain accessible
8. the UI works with the current CLI-generated run artifacts

---

## 14. Summary

The first Kosbling Web UI should be:

- **an observatory, not an admin panel**
- **a CEO cockpit first, and a replay surface second**
- **a visualization of team causality, not just KPI charts**

If the runtime is the engine,
the Web UI should be the glass cockpit.
