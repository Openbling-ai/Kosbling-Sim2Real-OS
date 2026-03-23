# Kosbling Sim2Real OS — System Architecture

Status: Draft v0.1  
Date: 2026-03-20

---

## 1. Purpose

This document defines the system architecture for Kosbling Sim2Real OS.

It explains:

- what the main components are
- how they relate to each other
- where the key boundaries lie
- how the Sim2Real transition works architecturally

This is not an implementation guide. It is a structural blueprint that other documents can reference.

---

## 2. Architectural Thesis

The central architectural principle of this system is:

> **Same agent logic, different execution boundary.**

What this means:

- Agents express intent in a structured, environment-agnostic way
- The runtime decides whether that intent flows into simulation or real systems
- The adapter layer translates intent into effects
- State model provides continuity and memory across both modes

This principle is the entire reason the project exists.

If agents had to know whether they were in Shadow or Live mode, the system would collapse into fragmented code paths and untestable logic.

---

## 3. System Layers

The architecture is divided into four main layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Artifacts & UX                                     │
│ (audit logs, summary reports, CLI/TUI, web dashboard)       │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Domain Agents                                      │
│ (Supplier, Marketing, Creative, Store, Ads, Finance)        │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Sim2Real Runtime Core                              │
│ (Scenario Engine, State Store, Simulation Loop, Event Bus,  │
│  Market Simulator, Adapter Router)                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Execution Substrate — OpenClaw                     │
│ (Model access, tool routing, sessions, sandbox, approvals,  │
│  browser/local execution, multi-agent orchestration)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Overview

### 4.1 OpenClaw — Execution Substrate

**What it is:**

OpenClaw is the lower execution layer that provides generic agent infrastructure.

**Responsibilities:**

- Model access and routing
- Tool registration and invocation
- Session and sub-agent management
- Local sandbox execution
- Browser automation surfaces
- Human-in-the-loop approvals
- File output management

**What Kosbling gets from OpenClaw:**

- A ready-made execution harness
- Local-first control
- Approval boundaries for sensitive actions
- Multi-agent spawning and coordination primitives

**What Kosbling does NOT expect from OpenClaw:**

- Business-state modeling
- Scenario definitions
- DTC domain knowledge
- Sim2Real transition logic

### 4.2 Sim2Real Runtime Core

**What it is:**

The Sim2Real Runtime Core is the application-specific layer above OpenClaw. It defines the environment where business agents operate.

**Main components:**

#### Scenario Engine
- Loads scenario definitions from YAML
- Validates required fields
- Converts scenarios into initial state objects
- Manages scenario library

#### State Store
- Persists business state across steps
- Maintains ledger, inventory, campaigns, orders, events
- Provides state snapshots for inspection and replay
- Handles state initialization and rollback

#### Simulation Loop
- Advances simulated time
- Coordinates daily execution
- Calls agents for proposals
- Resolves conflicts and approvals
- Routes actions through adapters
- Updates state after each step

#### Event Bus
- Internal message passing between agents
- Event injection (chaos events, external shocks)
- Asynchronous notification patterns

#### Market Simulator
- Simulates outcomes not available from real APIs
- Provides CTR/CVR estimates
- Models competitive pressure and platform dynamics
- Generates scenario-appropriate outcomes

#### Adapter Router
- Chooses between AdapterMock and AdapterLive
- Enforces environment boundaries
- Returns structured execution results

### 4.3 Adapter Layer

**What it is:**

Adapters are the execution boundary between agent intent and world effects.

**Two adapters:**

#### AdapterMock (Shadow Mode)
- Intercepts write actions
- Simulates effects through Market Simulator
- Updates shadow state only
- Returns structured simulated results
- No real external API calls
- Safe to fail

#### AdapterLive (Live Mode)
- Validates approvals and permissions
- Calls real external systems when allowed
- Stores external ids and results
- Returns structured real results
- Enforces guardrails and rate limits
- Requires explicit user consent

**Critical rule:**

> The adapter boundary must be narrow and explicit.
> The rest of the system should not scatter environment-aware logic everywhere.

### 4.4 State Store

**What it is:**

The State Store is the persistent memory of the business world.

**What it holds:**

- Scenario metadata and configuration
- Current business state (finance, inventory, campaigns, orders)
- Action history and decision rationale
- Event log
- Run outputs and artifact references

**Role in Shadow Mode:**

- The state model IS the business world
- All outcomes are derived from state
- State is the primary source of truth

**Role in Live Mode:**

- State model becomes a digital twin
- Mirrors external systems
- Stores policy, thresholds, and decision memory
- Provides cross-system unified view
- Enables reconciliation with real systems

### 4.5 Domain Agents

**What they are:**

Domain Agents are specialized roles that implement DTC business behaviors.

**Initial agent set:**

| Agent | Primary Responsibility |
|-------|------------------------|
| Supplier Agent | Sourcing, reordering, fulfillment risk |
| Marketing Agent | Channel mix, audience strategy, trend analysis |
| Creative Agent | Ad angles, creative variants, style experiments |
| Store Agent | Pricing, offers, bundles, landing-page strategy |
| Ads Agent | Campaign management, spend allocation, performance optimization |
| Finance Agent | P&L tracking, runway analysis, risk governance |

**How they work:**

- Read current state
- Propose structured action intents
- Do NOT know whether they are in Shadow or Live mode
- Express intent in adapter-agnostic format

### 4.6 Artifacts

**What they are:**

Artifacts are durable outputs produced by each simulation run.

**Minimum artifact set:**

- `scenario.json` — Loaded scenario definition
- `state.json` — Final state snapshot
- `actions.jsonl` — Action intent log (one per line)
- `events.jsonl` — Event injection log
- `audit-log.md` — Human-readable decision narrative
- `summary.json` — Machine-readable result summary

**Why they matter:**

- Enable inspection and debugging
- Support replay and comparison
- Provide shareable social objects
- Form the basis of user learning

---

## 5. Data Flow

### 5.1 Simulation Run Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Scenario    │────▶│ State Store  │────▶│ Simulation  │
│ Definition  │     │ (Initialize) │     │ Loop        │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
         ┌─────────────────────┐
         │ For each step/day:  │
         │                     │
         │ 1. Read state       │
         │ 2. Refresh signals  │
         │ 3. Agents propose   │
         │ 4. Resolve conflicts│
         │ 5. Route to adapter │
         │ 6. Apply effects    │
         │ 7. Inject events    │
         │ 8. Record logs      │
         │ 9. Advance clock    │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Output Artifacts    │
         │ (audit log, summary)│
         └─────────────────────┘
```

### 5.2 Action Intent Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Domain      │────▶│ Action       │────▶│ Adapter     │
│ Agent       │     │ Intent       │     │ Router      │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
         ┌─────────────────┐                         ┌─────────────────┐
         │ AdapterMock     │                         │ AdapterLive     │
         │ (Shadow Mode)   │                         │ (Live Mode)     │
         └────────┬────────┘                         └────────┬────────┘
                  │                                           │
                  ▼                                           ▼
         ┌─────────────────┐                         ┌─────────────────┐
         │ Market          │                         │ External APIs   │
         │ Simulator       │                         │ (Shopify, Meta) │
         └────────┬────────┘                         └────────┬────────┘
                  │                                           │
                  └─────────────────┬─────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Execution Result    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ State Store Update  │
                         └─────────────────────┘
```

---

## 6. Shadow Mode vs Live Mode

### 6.1 Shadow Mode Architecture

```
User Input ──▶ Scenario ──▶ State Init ──▶ Simulation Loop
                                                │
                                                ▼
                                         AdapterMock
                                                │
                                                ▼
                                         Market Simulator
                                                │
                                                ▼
                                         Shadow State Update
                                                │
                                                ▼
                                         Artifacts
```

**Key characteristics:**

- All writes intercepted
- Outcomes simulated
- Safe to fail
- Fast iteration possible
- Deterministic enough for comparison

### 6.2 Live Mode Architecture

```
User Input ──▶ Scenario ──▶ State Init ──▶ Simulation Loop
                                                │
                                                ▼
                                         AdapterLive
                                                │
                                                ▼
                                         Real External APIs
                                                │
                                                ▼
                                         State Mirror Update
                                                │
                                         Reconciliation Loop
                                                │
                                                ▼
                                         Artifacts
```

**Key characteristics:**

- Writes go to real systems
- External results flow back
- State mirrors external truth
- Approvals and guardrails required
- Reconciliation maintains alignment

### 6.3 What Changes, What Stays the Same

| Aspect | Shadow Mode | Live Mode |
|--------|-------------|-----------|
| Agent logic | Same | Same |
| Action intent format | Same | Same |
| State model structure | Same | Same |
| Adapter implementation | AdapterMock | AdapterLive |
| Execution result source | Market Simulator | Real APIs |
| Approval requirements | Relaxed | Enforced |
| Failure consequences | Safe | Real |

---

## 7. Relationship to State Model

### 7.1 State as the Central Artifact

The state model is the central artifact that connects all layers.

```
Scenario ──creates──▶ Initial State
                           │
                           │ reads/writes
                           ▼
                    ┌─────────────┐
                    │ State Store │◀─── Agents read
                    └──────┬──────┘
                           │
                           │ updates via
                           ▼
                    Adapter Results
                           │
                           ▼
                    Artifacts reference
```

### 7.2 State Ownership Model (Live Mode)

In Live Mode, state fields are categorized by ownership:

**Locally-owned fields:**
- Mode, policy thresholds, approval states
- Internal warnings, agent decisions
- Automation rules, simulation-derived parameters

**Externally-owned fields (mirrored):**
- Product ids, campaign ids
- Actual inventory, spend, orders, revenue
- Shipment status, payment state

**Derived fields:**
- Cash runway, net profit estimate
- Reorder urgency, CAC alerts
- Policy violation flags

---

## 8. Reconciliation Architecture (Live Mode)

### 8.1 Why reconciliation is needed

External systems change independently. The local state model must stay aligned.

### 8.2 Three reconciliation flows

**Write-through:**
- Intent recorded locally first
- Action executed through AdapterLive
- External ids and results stored back
- Local snapshot updated

**Pull-sync:**
- Periodic refresh of external data
- Updates mirrored fields
- Detects drift and conflicts

**Event/webhook (future):**
- Real-time updates from external systems
- Faster alignment
- Not required for v0.1

### 8.3 Conflict handling

When local and external state disagree:

1. Record reconciliation warning
2. Mark affected objects as out-of-sync
3. Prefer external truth for externally-owned fields
4. Preserve local decision history
5. Escalate if mismatch affects money or irreversible actions

---

## 9. Key Boundaries

### 9.1 Adapter Boundary

This is the most critical boundary in the system.

**What must stay true:**

- Agents do NOT know which adapter is active
- Action intent format is identical across modes
- Only the adapter implementation differs
- Execution result structure is identical

**What happens if this boundary leaks:**

- Code paths fragment
- Testing becomes impossible
- Sim2Real promise breaks
- Audit trails become unreliable

### 9.2 State Boundary

**What must stay true:**

- State is updated only through structured action results
- No arbitrary mutation from agent text
- State transitions are explicit and logged
- State schema evolves carefully

**What happens if this boundary leaks:**

- Debugging becomes impossible
- Replay breaks
- Comparison across runs becomes meaningless

### 9.3 Approval Boundary

**What must stay true:**

- Live actions require explicit approval gates
- Budget and risk policies are enforced
- Human override is always possible
- Audit trail is complete

**What happens if this boundary leaks:**

- Real money can be lost
- User trust collapses
- System becomes unsafe

---

## 10. Repository Shape

```
kosbling-sim2real-os/
├── README.md
├── docs/
│   ├── project-doc.md
│   ├── engineering.md
│   ├── architecture.md
│   ├── state-model.md
│   ├── adapter-contract.md
│   ├── scenario-spec.md
│   └── live-state-sync.md
├── scenarios/
│   └── ice-bath-na-v1.yaml
├── runtime/
│   ├── simulation_engine.py
│   ├── state_store.py
│   ├── event_bus.py
│   ├── market_simulator.py
│   └── adapters/
│       ├── adapter_mock.py
│       └── adapter_live.py
├── agents/
│   ├── supplier_agent.py
│   ├── marketing_agent.py
│   ├── creative_agent.py
│   ├── store_agent.py
│   ├── ads_agent.py
│   └── finance_agent.py
├── runs/
│   └── <run-id>/
│       ├── scenario.json
│       ├── state.json
│       ├── actions.jsonl
│       ├── events.jsonl
│       ├── audit-log.md
│       └── summary.json
└── ui/
    └── tui/
```

---

## 11. What This Architecture Enables

### 11.1 Sim2Real transition

A user can:

1. Run multiple simulations in Shadow Mode
2. Iterate on strategy and parameters
3. Find a winning setup
4. Switch to Live Mode
5. Deploy the same agent logic with real credentials
6. Continue operating with inherited policies and decision memory

### 11.2 Inspectability

Every run produces:

- Structured state snapshots
- Complete action logs
- Human-readable audit narratives
- Event timelines

This enables:

- Debugging
- Learning
- Comparison
- Social sharing

### 11.3 Iteration velocity

Shadow Mode enables:

- Fast reruns
- Cheap failure
- Parameter exploration
- Strategy comparison

### 11.4 Safety

Live Mode provides:

- Approval gates
- Budget guardrails
- Human override
- Audit trails

---

## 12. Architectural Risks

### 12.1 Adapter boundary erosion

**Risk:** Logic that should be in adapters leaks into agents or state updates.

**Mitigation:** Strict code review, schema validation, and testing that agents cannot determine mode.

### 12.2 State model drift

**Risk:** State schema grows without discipline, becoming incoherent.

**Mitigation:** State changes require explicit migration and documentation.

### 12.3 Shadow/Live parity collapse

**Risk:** Action intent format diverges between modes, breaking the "same logic" promise.

**Mitigation:** Single action-intent schema, adapter parity tests, cross-mode comparison.

### 12.4 Reconciliation gaps

**Risk:** In Live Mode, local state drifts from external truth.

**Mitigation:** Explicit sync flows, conflict detection, human escalation for critical mismatches.

### 12.5 Scope explosion

**Risk:** Trying to simulate all of commerce too early.

**Mitigation:** Narrow scenarios first, extend only when value is proven.

---

## 13. Summary

Kosbling Sim2Real OS architecture is built around four key ideas:

1. **Layered separation:** OpenClaw handles execution; Sim2Real Core handles business simulation; Agents handle domain logic; Artifacts handle visibility.

2. **Adapter boundary:** Agents emit environment-agnostic intent; adapters translate intent into Shadow or Live effects.

3. **State centrality:** State model is the world in Shadow Mode; it becomes a digital twin and control ledger in Live Mode.

4. **Same logic, different boundary:** The entire value proposition depends on agents not knowing which mode they are in.

If these boundaries stay clean, the system can deliver on its core promise:

> Simulate with real data. Retry cheaply. Deploy the winner.