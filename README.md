# Kosbling Sim2Real OS Docs

## Canonical implementation doc

If the goal is implementation, start here:

- `implementation/v0.1-codex-implementation-brief.md`

This is the single implementation source of truth for the current v0.1 shadow-only build.

## Directory roles

### `project/`
Project background, product definition, and high-level requirement context.
These explain what the project is, why it exists, and what shape it is trying to reach.
Current project-layer docs are centered on:
- `project/project-doc.md`
- `project/plain-english.md`
- `project/opc-mvp-business-version-2026-03-23.md` — latest business-side MVP framing for the IM-native OPC cut; use as product input/reference when aligning design and implementation scope. Note: this is a business/product doc, not a literal implementation plan; OpenClaw's existing IM/channel layer remains the assumed transport.

### `design/`
Functional design docs. The canonical design-layer document is:
- `design/sim2real-functional-design.md`

Earlier split design drafts have been moved to `archive/design-drafts/` to avoid drift.

### `references/`
Supporting technical references that define schemas, contracts, subsystem behavior, and business-derived implementation references.
Current recommended starting references are:
- `references/commerce-harness.md` — the key middle layer between agent cognition and state/runtime internals
- `references/action-spec.md` — canonical Layer 0 action vocabulary
- `references/event-spec.md` — canonical Layer 0 event vocabulary
- `references/opc-layer0-reference.md` — business-derived Layer 0 reference extracted from the MVP doc
- `references/scenario-spec.md`
- `references/state-model.md`
- `references/runtime-loop.md`
- `references/adapter-contract.md`
- `references/ice-bath-na-v1.yaml.md` — example scenario, not a canonical product requirement

### `archive/`
Older planning / exploration / intermediate docs kept for historical context only.
Not the default starting point for implementation work.
Also includes superseded references such as:
- `archive/references-superseded/live-state-sync.md`

### `implementation/`
Current execution-facing implementation docs.

## Archive usage rule

If `archive/` differs from `implementation/` or `references/`, treat `implementation/` and `references/` as canonical for current v0.1 work.

## Terminology

| Term | Meaning |
|------|---------|
| Scenario | The machine-readable starting setup for a business simulation |
| State Model | The persistent world state / ledger that changes over time |
| Shadow Mode | Simulated execution with fake money and no real external writes |
| Live Mode | Future real execution mode with real external effects |
| Action Intent | Structured business action proposed by an agent |
| Execution Result | Structured adapter output describing what actually happened |
