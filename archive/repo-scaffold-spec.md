# Kosbling Sim2Real OS — Repo Scaffold Spec (Phase 1)

Status: Draft v0.1
Date: 2026-03-20

---

## 1. Purpose

This document defines the **minimum repository structure** for Phase 1 implementation.

It is specifically designed to:
- Help Codex start coding with clear boundaries
- Avoid premature abstraction
- Deliver a working prototype quickly
- Stay strictly within Phase 1 scope

**Target outcome:** One working shadow simulation run that produces readable artifacts.

---

## 2. Phase 1 Scope Reminder

From `mvp-roadmap.md`:

| Aspect | Phase 1 Scope |
|--------|---------------|
| Scenarios | Single: `ice-bath-na-v1` |
| Mode | Shadow only |
| Agents | 3 roles: Supplier, Ads, Finance |
| State | In-memory + single-file JSON persistence |
| Output | `audit-log.md` + `summary.json` |
| Market Simulator | Simple heuristics + optional LLM judging |

**Out of scope:**
- Live Mode
- Multi-scenario
- Event system
- Approval workflows
- UI beyond CLI output
- Complex agent coordination

---

## 3. Repository Structure

```
kosbling-sim2real-os/
│
├── README.md                      # Quick start guide
├── pyproject.toml                 # Python package config
├── .gitignore
│
├── scenarios/
│   └── ice-bath-na-v1.yaml        # THE scenario for Phase 1
│
├── src/
│   └── sim2real/
│       │
│       ├── __init__.py
│       ├── main.py                # Entry point: run simulation
│       │
│       ├── scenario/
│       │   ├── __init__.py
│       │   ├── loader.py          # Load YAML → State object
│       │   └── validator.py       # Validate required fields
│       │
│       ├── state/
│       │   ├── __init__.py
│       │   ├── model.py           # StateModel class
│       │   └── store.py           # load_state / save_state
│       │
│       ├── runtime/
│       │   ├── __init__.py
│       │   ├── engine.py          # Simulation loop
│       │   └── clock.py           # Day counter, time utilities
│       │
│       ├── adapters/
│       │   ├── __init__.py
│       │   ├── base.py            # Adapter abstract class
│       │   └── mock.py            # AdapterMock implementation
│       │
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── base.py            # Agent abstract class
│       │   ├── supplier.py        # Supplier Agent
│       │   ├── ads.py             # Ads Agent
│       │   └── finance.py         # Finance Agent
│       │
│       ├── simulation/
│       │   ├── __init__.py
│       │   └── market.py          # Market Simulator (minimal)
│       │
│       └── output/
│           ├── __init__.py
│           ├── audit_log.py       # Generate audit-log.md
│           └── summary.py         # Generate summary.json
│
├── runs/                          # Output directory (gitignored)
│   └── <run-id>/
│       ├── scenario.json
│       ├── state.json
│       ├── actions.jsonl
│       ├── audit-log.md
│       └── summary.json
│
├── tests/
│   ├── __init__.py
│   ├── test_scenario_loader.py
│   ├── test_state_model.py
│   └── test_simulation_loop.py
│
└── docs/                          # Reference only (not for implementation)
    ├── engineering.md
    ├── state-model.md
    ├── adapter-contract.md
    ├── runtime-loop.md
    ├── architecture.md
    └── mvp-roadmap.md
```

---

## 4. Module Responsibilities (Must-Have)

### 4.1 `scenario/loader.py`

**Responsibility:** Load `ice-bath-na-v1.yaml` and convert to initial state dict.

**Minimum API:**
```python
def load_scenario(path: str) -> dict
```

**What it does:**
1. Read YAML file
2. Validate required fields exist (see `scenario-spec.md`)
3. Return dict that can initialize `StateModel`

**What it does NOT do:**
- Multi-scenario support
- Complex validation rules
- Parameter inheritance

---

### 4.2 `scenario/validator.py`

**Responsibility:** Check that scenario has required fields.

**Minimum API:**
```python
def validate_scenario(scenario: dict) -> bool  # or raise ValidationError
```

**Required fields for Phase 1:**
- `id`
- `product.name`
- `market`
- `starting_budget_usd`
- `simulation_days`

---

### 4.3 `state/model.py`

**Responsibility:** Hold all business state in memory.

**Minimum API:**
```python
class StateModel:
    def __init__(self, initial_state: dict)
    def get(self, path: str) -> Any          # e.g., "finance.cash_on_hand_usd"
    def set(self, path: str, value: Any)
    def to_dict(self) -> dict
    def compute_derived_fields(self)         # Calculate profit, etc.
```

**Key state sections (from `state-model.md`):**
- `run_id`, `scenario_id`, `mode`, `status`
- `clock`
- `business`
- `finance`
- `inventory`
- `traffic`
- `orders`
- `agents` (decision memory)

---

### 4.4 `state/store.py`

**Responsibility:** Persist and load state to/from JSON.

**Minimum API:**
```python
def save_state(state: StateModel, path: str) -> None
def load_state(path: str) -> StateModel
```

---

### 4.5 `runtime/engine.py`

**Responsibility:** Run the day-by-day simulation loop.

**Minimum API:**
```python
class SimulationEngine:
    def __init__(self, scenario_path: str, run_id: str)
    def run(self) -> None                   # Execute full simulation
    def step(self) -> None                  # Execute one day (for debugging)
```

**The loop (from `runtime-loop.md`):**
```
For each day:
  1. Advance clock
  2. Let each agent propose actions
  3. Route actions through AdapterMock
  4. Apply state changes
  5. Log action
  6. Save state snapshot
  7. Check terminal conditions
```

---

### 4.6 `runtime/clock.py`

**Responsibility:** Track simulation time.

**Minimum API:**
```python
class SimulationClock:
    def __init__(self, total_days: int)
    def advance(self) -> bool               # Returns False if terminal
    @property
    def current_day(self) -> int
    @property
    def is_complete(self) -> bool
```

---

### 4.7 `adapters/base.py`

**Responsibility:** Define adapter interface.

**Minimum API:**
```python
from abc import ABC, abstractmethod

class Adapter(ABC):
    @abstractmethod
    def execute(self, action_intent: dict) -> dict:
        """Receive action intent, return execution result."""
        pass
```

---

### 4.8 `adapters/mock.py`

**Responsibility:** Simulate action execution.

**Minimum API:**
```python
class AdapterMock(Adapter):
    def __init__(self, state: StateModel, market_simulator):
        ...
    
    def execute(self, action_intent: dict) -> dict:
        """Simulate action and return structured result."""
        ...
```

**Action types to handle (Phase 1):**
- `launch_campaign`
- `pause_campaign`
- `reorder_inventory`
- `adjust_price`

---

### 4.9 `agents/base.py`

**Responsibility:** Define agent interface.

**Minimum API:**
```python
from abc import ABC, abstractmethod

class Agent(ABC):
    def __init__(self, name: str, state: StateModel):
        ...
    
    @abstractmethod
    def propose_actions(self) -> list[dict]:
        """Return list of action intents, or empty list."""
        pass
```

---

### 4.10 `agents/supplier.py`

**Responsibility:** Propose inventory reorders.

**Minimal behavior:**
- Check `inventory.units_on_hand` vs `inventory.reorder_point`
- If below, propose `reorder_inventory` action

---

### 4.11 `agents/ads.py`

**Responsibility:** Propose campaign actions.

**Minimal behavior:**
- If no active campaign and budget available, propose `launch_campaign`
- If campaign is performing poorly, propose `pause_campaign`

---

### 4.12 `agents/finance.py`

**Responsibility:** Monitor cash and emit warnings.

**Minimal behavior:**
- Check `finance.cash_on_hand_usd` vs floor threshold
- If low, emit warning to `agents.open_warnings`
- Do NOT propose actions (Phase 1 — just observe)

---

### 4.13 `simulation/market.py`

**Responsibility:** Generate simulated outcomes.

**Minimum API:**
```python
class MarketSimulator:
    def simulate_campaign_performance(
        self,
        campaign_params: dict,
        state: StateModel
    ) -> dict:
        """Return impressions, clicks, orders, revenue."""
        ...
```

**Phase 1 approach:**
- Simple formulas: impressions ≈ budget / estimated_cpm
- CTR based on heuristic (e.g., 1-3%)
- CVR based on heuristic (e.g., 2-5%)
- No machine learning, no external data

---

### 4.14 `output/audit_log.py`

**Responsibility:** Generate human-readable `audit-log.md`.

**Minimum API:**
```python
def generate_audit_log(run_dir: str, state: StateModel, actions: list) -> None:
    """Write audit-log.md to run directory."""
    ...
```

**Content:**
- Initial assumptions
- Day-by-day summary
- Key decisions
- Final P&L
- Success/failure verdict

---

### 4.15 `output/summary.py`

**Responsibility:** Generate `summary.json`.

**Minimum API:**
```python
def generate_summary(run_dir: str, state: StateModel) -> None:
    """Write summary.json to run directory."""
    ...
```

---

### 4.16 `main.py`

**Responsibility:** Entry point for CLI.

**Minimum API:**
```python
def main():
    """Run simulation from command line."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="scenarios/ice-bath-na-v1.yaml")
    parser.add_argument("--run-id", default=None)  # Auto-generate if None
    args = parser.parse_args()
    
    engine = SimulationEngine(args.scenario, args.run_id)
    engine.run()
```

---

## 5. What to Stub (Nice-to-Have-Later)

These should exist as files but have minimal or no implementation:

### 5.1 `adapters/live.py`

**Stub behavior:**
```python
class AdapterLive(Adapter):
    def execute(self, action_intent: dict) -> dict:
        raise NotImplementedError("Live mode not implemented in Phase 1")
```

**Why stub:** Future-proofing. Shows where Live will go.

---

### 5.2 `agents/marketing.py`, `agents/creative.py`, `agents/store.py`

**Stub behavior:**
```python
class MarketingAgent(Agent):
    def propose_actions(self) -> list[dict]:
        return []  # Not active in Phase 1
```

**Why stub:** These agents come in Phase 2. Placeholder shows future structure.

---

### 5.3 `runtime/events.py`

**Stub behavior:** File does not exist in Phase 1.

**Why:** Event system is Phase 2. No placeholder needed yet.

---

## 6. What NOT to Build (Explicitly Out of Scope)

### 6.1 Web UI

**Do not create:** `ui/` directory

**Why:** Phase 1 runs from CLI only.

---

### 6.2 Approval System

**Do not create:** `approvals/` module

**Why:** All actions auto-approved in Shadow Mode. Approval logic comes in Phase 4.

---

### 6.3 Event System

**Do not create:** `events/` module

**Why:** Events come in Phase 2.

---

### 6.4 Multi-Scenario Support

**Do not create:** `scenario/library.py` or scenario templates

**Why:** Phase 1 only supports `ice-bath-na-v1`.

---

### 6.5 Complex Market Simulator

**Do not create:** `simulation/ml_model.py` or external data fetching

**Why:** Phase 1 uses simple heuristics only.

---

### 6.6 Reconciliation Logic

**Do not create:** `reconciliation/` module

**Why:** Live Mode is Phase 4+.

---

## 7. Data Flow Diagram

```
main.py
   │
   ▼
ScenarioLoader.load_scenario("scenarios/ice-bath-na-v1.yaml")
   │
   ▼
StateModel(initial_state)
   │
   ▼
SimulationEngine.run()
   │
   ├── For each day:
   │      │
   │      ├── SupplierAgent.propose_actions()
   │      ├── AdsAgent.propose_actions()
   │      ├── FinanceAgent.propose_actions()
   │      │
   │      ├── AdapterMock.execute(action)
   │      │      │
   │      │      └── MarketSimulator.simulate_campaign_performance()
   │      │
   │      ├── StateModel.set(path, value)
   │      ├── StateStore.save_state()
   │      └── Append to actions.jsonl
   │
   ▼
generate_audit_log()
generate_summary()
   │
   ▼
Output: runs/<run-id>/audit-log.md, summary.json
```

---

## 8. File-by-File Priority

| Priority | File | Must Have | Notes |
|----------|------|-----------|-------|
| 1 | `state/model.py` | ✅ | Core of everything |
| 2 | `scenario/loader.py` | ✅ | Entry point needs this |
| 3 | `runtime/engine.py` | ✅ | Main loop |
| 4 | `adapters/mock.py` | ✅ | Executes actions |
| 5 | `agents/base.py` | ✅ | Agent interface |
| 6 | `agents/supplier.py` | ✅ | First agent |
| 7 | `agents/ads.py` | ✅ | Second agent |
| 8 | `agents/finance.py` | ✅ | Third agent |
| 9 | `simulation/market.py` | ✅ | Simulates outcomes |
| 10 | `output/audit_log.py` | ✅ | Primary artifact |
| 11 | `main.py` | ✅ | Entry point |
| 12 | `state/store.py` | ✅ | Persistence |
| 13 | `runtime/clock.py` | ✅ | Time tracking |
| 14 | `adapters/base.py` | ✅ | Interface definition |
| 15 | `scenario/validator.py` | ⚠️ Nice | Can inline in loader |
| 16 | `output/summary.py` | ⚠️ Nice | Can inline in engine |
| 17 | `tests/*` | ⚠️ Nice | Tests help but not blocking |

---

## 9. Implementation Order (Recommended for Codex)

**Sprint 1 (Core):**
1. `state/model.py` — Define StateModel class
2. `scenario/loader.py` — Load YAML to dict
3. `state/store.py` — Save/load JSON

**Sprint 2 (Loop):**
4. `runtime/clock.py` — Day counter
5. `runtime/engine.py` — Skeleton loop (empty agents)
6. `main.py` — Run loop, save state

**Sprint 3 (Agents):**
7. `agents/base.py` — Agent interface
8. `agents/supplier.py` — Propose reorder
9. `agents/ads.py` — Propose campaign
10. `agents/finance.py` — Emit warnings

**Sprint 4 (Execution):**
11. `adapters/base.py` — Adapter interface
12. `adapters/mock.py` — Handle actions
13. `simulation/market.py` — Campaign outcomes

**Sprint 5 (Output):**
14. `output/audit_log.py` — Markdown generation
15. `output/summary.py` — JSON summary

---

## 10. Run Artifact Structure

After a successful Phase 1 run:

```
runs/
  run-icebath-001/
    scenario.json          # Loaded scenario (copy)
    state.json             # Final state snapshot
    actions.jsonl          # One action per line
    audit-log.md           # Human-readable narrative
    summary.json           # Machine-readable result
```

**actions.jsonl format:**
```json
{"day": 1, "actor": "ads_agent", "action_type": "launch_campaign", "payload": {...}, "result": {...}}
{"day": 3, "actor": "supplier_agent", "action_type": "reorder_inventory", "payload": {...}, "result": {...}}
...
```

---

## 11. Validation Checklist

Phase 1 is complete when:

- [ ] Can run: `python -m sim2real.main --scenario scenarios/ice-bath-na-v1.yaml`
- [ ] Creates `runs/<run-id>/` directory
- [ ] Produces `state.json` with valid final state
- [ ] Produces `actions.jsonl` with at least 5 actions
- [ ] Produces `audit-log.md` that is human-readable
- [ ] Produces `summary.json` with `status: completed`
- [ ] Finance totals are internally consistent (profit = revenue - costs)
- [ ] Simulation completes in under 60 seconds

---

## 12. Key Constraints for Codex

1. **No external dependencies beyond basics** — Only `pyyaml`, standard library
2. **No LLM integration required** — Agents can use simple if/then logic
3. **No database** — File-based JSON only
4. **No async** — Synchronous execution is fine
5. **No API keys** — Shadow Mode only

---

## 13. Main Risk

**Risk: State model inconsistency**

The state model is the heart of the system. If fields are updated inconsistently, computed values are wrong, or persistence is buggy, the entire simulation becomes untrustable.

**Mitigation:**
- `StateModel.compute_derived_fields()` should be called after every state change
- All updates go through `StateModel.set()`, never direct dict mutation
- Write tests that verify: `gross_profit = revenue - cogs - shipping`
- Write tests that verify: `cash = starting + revenue - all_outflows`

---

## 14. Summary

**Scaffold minimum:**
- 1 scenario file
- 15 core Python modules
- Clean separation: scenario → state → runtime → agents → adapters → output

**One main risk:**
- State model consistency — guard this with tests and disciplined update patterns

**Phase 1 success:**
- Run `ice-bath-na-v1` end-to-end
- Get readable `audit-log.md`
- Verify finance math is correct