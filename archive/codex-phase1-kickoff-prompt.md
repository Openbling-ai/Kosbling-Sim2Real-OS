# Codex Prompt — Kosbling Sim2Real OS Phase 1 Kickoff

You are implementing **Phase 1** of `Kosbling Sim2Real OS`.

Before doing anything, read these source-of-truth docs carefully:

1. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/phase-1-scope-guard.md`
2. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/codex-implementation-envelope.md`
3. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/ice-bath-na-v1.yaml.md`
4. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/state-model.md`
5. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/runtime-loop.md`
6. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/adapter-contract.md`
7. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/repo-scaffold-spec.md`
8. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/engineering.md`
9. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/architecture.md`
10. `/Users/bruce/openclaw/workspaces/kosbling-ops/memory/kosbling-sim2real-os/mvp-roadmap.md`

## Critical clarification
In Phase 1, the “3 agents” are **3 local decision roles / policy modules**:
- Supplier
- Ads
- Finance

They are **not** real OpenClaw tool-using agents.
Do not build prompt orchestration, tool-use, or multi-session agent runtime for them.
They can be simple rule-based modules that output structured `ActionIntent` objects.

## Mission
Implement the smallest runnable **Shadow Mode** prototype that proves the core simulation loop works end-to-end.

A successful Phase 1 result can:
- load one scenario
- initialize one state
- run day-by-day for 30 simulated days
- let the 3 decision roles propose actions
- route actions through `AdapterMock`
- update state coherently
- write run artifacts including `audit-log.md` and `summary.json`

## Hard constraints
- Use **Python** for Phase 1 core unless you see a very strong reason otherwise
- Keep dependencies minimal
- Keep the repo independent; do not modify OpenClaw core
- Do not build UI
- Do not build Live Mode
- Do not build a full event system
- Do not build plugin systems / public APIs / distributed infra
- Do not over-abstract for future extensibility

## Implementation bias
Prefer:
- simple over elegant
- explicit over generic
- local files over infrastructure
- crude but runnable over architecturally perfect
- fewer modules over more modules

## Repo/task expectation
Create a fresh independent git repo for this project (not inside OpenClaw core), then implement only the minimal Phase 1 scaffold and core loop.

## Deliverables for this round
Please complete the following:

1. Initialize the repo
2. Add a small README describing the project and Phase 1 scope
3. Add the minimal project structure needed for:
   - scenario loading
   - state model / state store
   - runtime loop
   - 3 decision roles
   - `AdapterMock`
   - audit-log / summary output
4. Add the first practical scenario file based on `ice-bath-na-v1`
5. Make the code runnable locally for one end-to-end simulation run
6. Add a minimal test or smoke-check for the core loop if practical

## Non-goals for this round
Do **not** add:
- Web dashboard
- OpenClaw integration layer
- Live adapters
- approval workflows
- reconciliation logic
- more agents
- more scenarios

## Deliver back
When done, report:
1. repo path
2. directory tree
3. what you implemented
4. what you intentionally left out
5. the biggest architectural risk still remaining

If you see tension between future architecture and current simplicity, choose **current simplicity**.
