# Kosbling Sim2Real OS — MVP Roadmap

Status: Draft v0.1  
Date: 2026-03-20

---

## 1. Purpose

This document defines a **progressive implementation roadmap** for Kosbling Sim2Real OS.

It translates the existing design documents into an ordered sequence of deliverables, following the principle:

> **先文档，后原型，再接 Live**  
> Docs first, then prototype, then live integration.

---

## 2. Guiding Principles

### 2.1 From engineering.md

1. **Local-first before cloud-first**
2. **State first, UI second**
3. **Auditability is mandatory**
4. **Adapter boundary must stay clean**
5. **One narrow scenario beats ten vague ones**
6. **Shadow value must exist before Live value**
7. **Reuse OpenClaw where possible**

### 2.2 Scope discipline

Each phase should deliver **one working increment** that:
- runs end-to-end
- produces inspectable artifacts
- validates one core assumption
- does not require the next phase to be useful

---

## 3. Phase Overview

| Phase | Name | Duration Est. | Core Deliverable |
|-------|------|---------------|------------------|
| 0 | Docs & Spec Lock | ✅ Done | Aligned design documents |
| 1 | Minimal Runnable Prototype | 2-3 weeks | Single-scenario shadow simulation |
| 2 | State Persistence & Multi-Agent | 2 weeks | Durable state, replay, 3 more agents |
| 3 | OpenClaw Integration | 2 weeks | Runtime integration, TUI/CLI |
| 4 | Live Mode Preparation | 2-3 weeks | Live adapter stub, approval boundary |
| 5 | Production Hardening | Ongoing | UX, multi-scenario, calibration |

---

## 4. Phase 0: Docs & Spec Lock

**Status: ✅ Complete**

### Deliverables
- [x] `plain-english.md` — Non-technical explanation
- [x] `engineering.md` — Architecture and layering
- [x] `state-model.md` — First version of world ledger
- [x] `scenario-spec.md` — Scenario definition format
- [x] `adapter-contract.md` — Action intent and execution contract

### Validation criteria
- [x] Terminology is consistent across all documents
- [x] State model fields map to scenario spec inputs
- [x] Adapter contract can operate on state model
- [x] No major conceptual gaps remain

### Outcome
A stable conceptual foundation that allows implementation to proceed without constant re-architecture.

---

## 5. Phase 1: Minimal Runnable Prototype

**Goal: Prove the core simulation loop works in Shadow Mode**

**Duration: 2-3 weeks**

### 5.1 Scope

#### In scope
- Single scenario: `ice-bath-na-v1`
- Mode: Shadow only
- Agents: 3 roles (Supplier, Ads, Finance)
- State: In-memory, single-file persistence
- Output: Markdown audit log + JSON summary
- Market simulator: Simple heuristics + LLM judging

#### Out of scope
- Live Mode
- Multi-scenario
- UI beyond command-line output
- Approval workflows (all auto-approved in Shadow)
- Complex event injection

### 5.2 Work breakdown

#### 5.2.1 Scenario Loader
- Load `ice-bath-na-v1.yaml`
- Validate required fields
- Convert to initial state object
- Create run directory structure

```
runs/
  run-icebath-001/
    scenario.json
    state.json
    actions.jsonl
    events.jsonl
    audit-log.md
    summary.json
```

#### 5.2.2 State Engine (minimal)
- Implement `StateModel` class from `state-model.md`
- Provide `get_state()` and `update_state()` methods
- Persist state to `state.json` after each day
- Compute derived values (gross_profit, net_profit) from ledger

#### 5.2.3 Simulation Loop
- Implement day-by-day execution
- Clock advances from day 1 to `duration_days`
- Each day:
  1. Read current state
  2. Let each enabled agent propose actions
  3. Route actions through `AdapterMock`
  4. Apply state effects
  5. Append to `actions.jsonl`
  6. Update `state.json`

#### 5.2.4 AdapterMock (minimal)
- Implement `execute(action_intent)` → `execution_result`
- Handle these action types:
  - `launch_campaign`
  - `pause_campaign`
  - `reorder_inventory`
  - `adjust_price`
- Simulate outcomes using:
  - Scenario parameters
  - Simple heuristic rules
  - Optional LLM call for ambiguous cases
- Return structured result
- Update state accordingly

#### 5.2.5 Agent Implementations (minimal)
- **Supplier Agent**: Propose `reorder_inventory` based on stock level
- **Ads Agent**: Propose `launch_campaign` / `pause_campaign` based on budget and performance
- **Finance Agent**: Emit warnings when cash falls below threshold

Each agent should:
- Read relevant state subset
- Return structured `action_intent` or `null`
- Write reasoning to agent memory

#### 5.2.6 Market Simulator (minimal)
- Given a campaign launch, simulate:
  - Impressions (based on budget, channel assumptions)
  - CTR (based on creative quality, audience fit)
  - CVR (based on product-market fit, price)
  - Orders, revenue
- Use simple formulas + scenario modifiers
- Log assumptions used

#### 5.2.7 Audit Log Generator
- After each day, append to `audit-log.md`:
  - Day number
  - Major decisions made
  - Key state changes
  - Notable events
- At end of run, append:
  - Final P&L
  - Success/failure verdict
  - Recommended next steps

### 5.3 Validation criteria

- [ ] Can run `ice-bath-na-v1` from start to finish
- [ ] State advances correctly across 30 simulated days
- [ ] Finance ledger is internally consistent
- [ ] Audit log is human-readable and complete
- [ ] Can re-run with same random_seed and get same result (deterministic)

### 5.4 What this proves

1. Scenario → State initialization works
2. Simulation loop maintains coherent state
3. Agents can propose structured actions
4. AdapterMock can simulate outcomes
5. Output artifacts are useful

---

## 6. Phase 2: State Persistence & Multi-Agent

**Goal: Make state durable and expand agent capabilities**

**Duration: 2 weeks**

### 6.1 Scope

#### In scope
- Durable state store with snapshots
- Event system (basic)
- 3 more agents: Marketing, Creative, Store
- Rerun with modified parameters
- Run comparison

#### Out of scope
- Live Mode
- Approval workflows
- UI

### 6.2 Work breakdown

#### 6.2.1 State Snapshots
- Save state snapshot at end of each day
- Enable rollback to any previous day
- Support pause/resume from any snapshot

#### 6.2.2 Action Log Enhancement
- Every action includes full `action_intent`
- Every action includes `execution_result`
- Support querying actions by day, actor, type

#### 6.2.3 Event System
- Define event types from `scenario-spec.md`:
  - `supplier_delay`
  - `cpm_spike`
  - `viral_demand_spike`
  - `stockout`
  - `creative_fatigue`
- Implement event injection based on:
  - Scenario `risk_model` settings
  - Random triggering (controlled by seed)
  - State thresholds (e.g., inventory < reorder_point)
- Events modify simulation behavior

#### 6.2.4 Additional Agents
- **Marketing Agent**: Channel mix recommendations, budget allocation
- **Creative Agent**: Creative angle proposals, performance hypotheses
- **Store Agent**: Price adjustments, bundle strategies

#### 6.2.5 Rerun Support
- Clone existing scenario
- Modify specific parameters
- Run new simulation
- Compare results side-by-side

### 6.3 Validation criteria

- [ ] Can pause and resume a run
- [ ] Can inspect state at any day
- [ ] All 6 agents can propose actions
- [ ] Events are logged and affect outcomes
- [ ] Can compare two runs of same scenario

---

## 7. Phase 3: OpenClaw Integration

**Goal: Run simulation inside OpenClaw execution environment**

**Duration: 2 weeks**

### 7.1 Scope

#### In scope
- Package Kosbling Sim2Real OS as OpenClaw extension/module
- Use OpenClaw for agent session management
- Use OpenClaw for tool access
- Basic TUI/CLI interface
- Human-in-the-loop for simulation control

#### Out of scope
- Live Mode
- Web UI

### 7.2 Work breakdown

#### 7.2.1 Extension Packaging
- Define Kosbling as OpenClaw extension
- Scenario pack structure
- Configuration wiring

#### 7.2.2 Runtime Integration
- Simulation loop runs as OpenClaw session
- Agents run as sub-sessions
- Use OpenClaw tool system for:
  - File I/O
  - LLM calls
  - Optional browser access for grounding data

#### 7.2.3 TUI/CLI
- Basic terminal interface:
  - Start new run
  - View current state
  - Pause/resume
  - View audit log
  - Export artifacts

#### 7.2.4 Human-in-the-Loop
- Pause on significant events
- Allow human to inspect state
- Allow human to inject manual actions
- Continue or abort run

### 7.3 Validation criteria

- [ ] Can start simulation from OpenClaw command
- [ ] State visible in TUI
- [ ] Can pause/resume interactively
- [ ] Artifacts stored in expected location

---

## 8. Phase 4: Live Mode Preparation

**Goal: Prepare infrastructure for real system integration**

**Duration: 2-3 weeks**

### 8.1 Scope

#### In scope
- `AdapterLive` implementation (stub → functional)
- Approval boundary framework
- Budget guard
- Credential management
- Risk classification

#### Out of scope
- Full production deployment
- All external integrations

### 8.2 Work breakdown

#### 8.2.1 AdapterLive Framework
- Implement `AdapterLive` parallel to `AdapterMock`
- Stub external calls (return structured mock for now)
- Track external refs (campaign IDs, order IDs)
- Reconciliation logic

#### 8.2.2 Approval Boundary
- Implement approval policies:
  - `auto`: Execute immediately
  - `require_budget_guard`: Check against budget rules
  - `require_human`: Pause for human approval
- Human approval interface in TUI
- Audit trail of approvals

#### 8.2.3 Budget Guard
- Track cumulative spend
- Enforce `max_daily_ad_spend_usd`
- Enforce `reserve_cash_floor_usd`
- Block actions that would violate constraints

#### 8.2.4 Credential Management
- Store credentials securely (encrypted)
- Scope credentials by mode (shadow vs live)
- Credential validation before live actions

#### 8.2.5 Risk Classification
- Classify actions by `risk_level`
- Map risk level to approval policy
- Allow scenario to override defaults

### 8.3 Validation criteria

- [ ] Can switch scenario mode to `live`
- [ ] Live actions require proper approvals
- [ ] Budget guard blocks over-spend
- [ ] Credentials are stored securely
- [ ] Approval decisions are logged

---

## 9. Phase 5: Production Hardening

**Goal: Make the system robust and usable**

**Duration: Ongoing**

### 9.1 Scope

#### In scope
- Multiple scenarios
- Real external integrations (TikTok Ads, Shopify, etc.)
- Web UI
- Performance optimization
- Error handling and recovery
- Market simulator calibration

### 9.2 Work breakdown (prioritized)

#### 9.2.1 Multi-Scenario Support
- Scenario library
- Scenario selection UI
- Parameter templating

#### 9.2.2 Real Integrations
- TikTok Ads API integration
- Shopify integration
- Supplier data sources

#### 9.2.3 Web Dashboard
- Run visualization
- State exploration
- Audit log browser
- Run comparison

#### 9.2.4 Market Simulator Calibration
- Collect real performance data
- Calibrate heuristics
- Validate predictions against outcomes

#### 9.2.5 Error Handling
- Graceful degradation
- Automatic recovery
- Clear error messages

---

## 10. Critical Path

The most important sequence is:

```
Phase 1 (Prototype) 
    → proves core loop works
Phase 2 (Persistence) 
    → makes it durable
Phase 3 (OpenClaw) 
    → makes it deployable
```

Phases 4 and 5 can be approached incrementally based on validated learning from earlier phases.

**Do not proceed to Phase 4 until Phase 1-3 deliver clear value in Shadow Mode.**

---

## 11. What NOT to Build (Scope Guards)

### 11.1 State model scope guards

Do not add these until explicitly needed:
- Multi-SKU catalogs
- Detailed warehouse geography
- Tax complexity
- Returns workflows beyond simple refund count
- Influencer seeding pipelines
- Multi-touch attribution
- LTV modeling
- Subscription retention curves

### 11.2 Agent scope guards

Do not add these until core agents prove their value:
- Customer support agent
- Influencer outreach agent
- Content calendar agent
- Email marketing agent

### 11.3 Integration scope guards

Do not add these until Shadow Mode is trusted:
- Real ad platform API calls
- Real payment processing
- Real inventory management systems
- Real shipping integrations

### 11.4 UI scope guards

Do not build these until TUI proves insufficient:
- Web dashboard
- Mobile app
- Notification system

---

## 12. Success Metrics

### Phase 1 success
- Can complete a 30-day simulation of `ice-bath-na-v1`
- Audit log is readable and useful
- State is internally consistent

### Phase 2 success
- Can pause, resume, and compare runs
- All 6 agents contribute meaningfully
- Events create believable variation

### Phase 3 success
- Runs inside OpenClaw without custom harness
- Human can observe and interact
- Artifacts are accessible

### Phase 4 success
- Live Mode is technically possible
- Approval boundaries work
- Budget guard prevents disasters

### Phase 5 success
- Multiple scenarios run successfully
- Real integrations work
- Users trust the output

---

## 13. Risk Mitigation

### Risk: Scope explosion

**Mitigation:**
- Each phase has explicit scope boundaries
- Each phase validates before proceeding
- Regular scope audits against this document

### Risk: State model drift

**Mitigation:**
- State model changes require version bump
- Backward compatibility for existing runs
- Schema validation on load

### Risk: Agent coordination complexity

**Mitigation:**
- Start with 3 agents, add 1 at a time
- Each agent has isolated decision scope
- Clear conflict resolution rules

### Risk: Premature live integration

**Mitigation:**
- Live Mode gated behind Phase 4
- Must prove Shadow value first
- No live credentials until Phase 4

---

## 14. First Implementation Tasks

When implementation begins, start with:

1. **Scenario loader** — `ice-bath-na-v1.yaml` → initial state
2. **State engine** — `StateModel` class with persistence
3. **Simulation loop** — Day 1 → Day N
4. **AdapterMock** — Handle `launch_campaign`, `reorder_inventory`
5. **Ads Agent** — Propose campaigns
6. **Audit log** — Markdown output

This sequence proves the core loop before anything else.

---

## 15. Document Maintenance

This roadmap should be updated:
- After each phase completion
- When scope decisions change
- When new risks are identified

Version history should be maintained in document header.

---

## 16. Appendix: Terminology Reference

This document uses terminology consistently with the source documents:

| Term | Source | Meaning |
|------|--------|---------|
| Scenario | scenario-spec.md | Machine-readable business setup |
| State Model | state-model.md | World ledger / save file |
| Adapter | adapter-contract.md | Execution bridge (Mock or Live) |
| Action Intent | adapter-contract.md | Structured agent action |
| Shadow Mode | engineering.md | Simulated execution, fake money |
| Live Mode | engineering.md | Real execution, real money |
| Grounding | scenario-spec.md | Real-world data sources |
| AdapterMock | adapter-contract.md | Simulates effects locally |
| AdapterLive | adapter-contract.md | Routes to real systems |
| DTC | plain-english.md | Direct to Consumer |

---

## 17. Summary

**Phase 0 (Docs):** ✅ Complete — All design documents aligned.

**Phase 1 (Prototype):** Build the smallest working shadow simulation with 1 scenario, 3 agents, in-memory state.

**Phase 2 (Persistence):** Add durability, events, 3 more agents, rerun capability.

**Phase 3 (OpenClaw):** Integrate into OpenClaw runtime, add TUI.

**Phase 4 (Live Prep):** Add Live Mode infrastructure, approvals, budget guard.

**Phase 5 (Production):** Harden, add integrations, calibrate, scale.

**The iron rule:** Prove Shadow Mode value before touching Live Mode.