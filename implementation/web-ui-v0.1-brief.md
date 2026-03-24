# Kosbling Sim2Real OS — Web UI v0.1 Implementation Brief

Status: Proposed implementation brief  
Date: 2026-03-24  
Audience: frontend / full-stack implementation

---

## 1. What this document is

This is the engineering brief for the first Kosbling Web UI.

It translates the product intent in:
- [`design/web-observatory-design.md`](../design/web-observatory-design.md)
- [`project/project-doc.md`](../project/project-doc.md)

into a bounded implementation target.

This brief is intentionally narrow.
The goal is to ship a strong first observer UI, not a complete operations platform.

---

## 2. One-line goal

> Build a local-first Web Observatory that visualizes Kosbling runs, team collaboration, chunk-level causality, and business outcomes using existing run artifacts.

---

## 3. Core implementation stance

The first UI should be:
- read-only by default
- artifact-backed
- desktop-first
- replay-oriented
- local-first

It should **not** depend on rewriting the runtime.

Prefer:
- thin server/data adapter
- React-based frontend
- structured JSON consumption
- markdown artifact viewer as a secondary panel

---

## 4. Recommended architecture

### A. Frontend

Use a TypeScript React web app.

Recommended options:
- Next.js if we want built-in routing + server data loading
- Vite + React plus a thin Node server if we want simpler separation

Given the current repo shape, the best default is:

> **Next.js + TypeScript**

Why:
- route-based run pages fit naturally
- server-side file reading is straightforward
- future streaming or control-plane upgrades stay possible
- one repo, one language family

### B. Data layer

The UI should read from local run artifacts through a small server-side adapter.

Do not read directly from the browser filesystem.

Recommended approach:
- server utility reads `runs/<run-id>/`
- exposes normalized view models to the frontend

### C. Runtime boundary

Do not entangle the UI with runtime internals yet.

The UI should consume:
- `run.json`
- `chunks.json`
- `state.json`
- `grounding.json`
- markdown artifacts

No websocket requirement in the first cut.

---

## 5. Scope for the first implementation

### Required routes

1. `/runs`
   - run index / list

2. `/runs/[runId]`
   - main run observatory view

3. Optional:
   `/runs/[runId]/chunks/[chunkNumber]`
   - direct link to a selected chunk

### Required panels in `/runs/[runId]`

1. **Run header**
   - scenario name
   - status
   - mode
   - day progress
   - top-line KPIs

2. **Chunk timeline rail**
   - chunk list
   - selected chunk
   - event/risk markers

3. **Main replay panel**
   - boss message
   - CEO summary
   - CEO rationale
   - events
   - chunk outcome

4. **Team panel**
   - role summaries
   - role watchouts
   - handoff tickets
   - resolved handoffs
   - execution order
   - execution results

5. **Metrics panel**
   - balance
   - revenue
   - cost
   - gross profit
   - orders
   - inventory

6. **Artifact drawer**
   - snapshot markdown
   - chunk markdown
   - team trace markdown
   - final report markdown

---

## 6. Data model to expose to the UI

The server adapter should normalize raw artifacts into UI-friendly shapes.

### Run summary
- `runId`
- `scenarioName`
- `status`
- `mode`
- `currentDay`
- `startingBudget`
- `currentBalance`
- `totalRevenue`
- `totalCost`
- `grossProfit`
- `totalOrders`

### Chunk summary
- `chunkNumber`
- `dayStart`
- `dayEnd`
- `bossMessage`
- `actionSummary`
- `mergeRationale`
- `eventCount`
- `orders`
- `revenue`
- `grossProfit`
- `balance`
- `biggestRisk`
- `biggestWin`

### Team replay block
- `rolePlans[]`
- `watchouts[]`
- `handoffs[]`
- `resolvedHandoffIds[]`
- `executionActionIds[]`
- `executionResults[]`

### Metrics series
- balance by chunk
- revenue by chunk
- gross profit by chunk
- orders by chunk
- inventory in stock by chunk
- inventory in transit by chunk

---

## 7. Suggested file structure

One reasonable layout:

```text
web/
  app/
    runs/
      page.tsx
      [runId]/
        page.tsx
        chunks/
          [chunkNumber]/
            page.tsx
  components/
    run-header.tsx
    run-list.tsx
    chunk-timeline.tsx
    team-trace-panel.tsx
    metrics-panel.tsx
    state-diff-panel.tsx
    artifact-viewer.tsx
  lib/
    runs.ts
    selectors.ts
    charts.ts
    markdown.ts
```

This is guidance, not a rigid requirement.

---

## 8. Visual priorities

The page should prioritize, in this order:

1. run identity and overall outcome
2. chunk timeline and navigation
3. team collaboration and merge logic
4. business metrics
5. raw artifact access

Do not bury the team layer under charts.

Kosbling’s differentiator is not just the metrics.
It is the visible collaboration and causality.

---

## 9. Design constraints

### Must preserve
- Shadow vs Live status visibility
- role identity visibility
- causal legibility
- quick chunk switching
- readability on laptop-sized screens

### Must avoid
- excessive nested tabs
- hiding key reasoning behind hover-only interactions
- generic admin layouts
- making the user scroll past charts before seeing team behavior

---

## 10. Implementation phases

### Phase 1 — Read-only observatory
- run list
- run detail
- chunk timeline
- team trace panel
- metrics charts
- markdown artifact viewer

This is the recommended first build target.

### Phase 2 — Better inspection
- state diff panel
- handoff status badges
- KPI comparison between chunks
- filterable activity feed

### Phase 3 — Runtime bridge
- start/resume controls
- better refresh behavior
- optional live updating while a run is active

---

## 11. Out of scope for this brief

Do **not** include in the first Web UI build:
- real auth
- cloud sync
- multi-user sharing
- store credential binding
- live provider actions
- complex scenario editing
- visual prompt builder
- mobile-first redesign

---

## 12. Acceptance criteria

The first implementation is successful if:

1. it can render existing CLI-generated runs without changing runtime output format
2. a user can inspect runs and navigate chunks visually
3. role proposals, handoffs, merge rationale, and execution results are visible
4. balance, revenue, gross profit, orders, and inventory trends are visible
5. markdown artifacts remain accessible
6. the UI feels like a simulation observatory, not a generic admin panel

---

## 13. Immediate implementation note

Before writing pages, it is strongly recommended to define:
- the normalized run view model
- the normalized chunk view model
- the chart series selectors

This reduces page-level complexity and keeps the UI maintainable.

---

## 14. Summary

The first Web UI should not try to do everything.

It should do one thing very well:

> make the Kosbling runtime visible, understandable, and replayable.
