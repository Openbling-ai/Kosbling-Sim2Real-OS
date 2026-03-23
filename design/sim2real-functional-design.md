# Kosbling Sim2Real OS — Functional Design

Status: Draft v0.2  
Date: 2026-03-23

---

## 1. Purpose

This is the single canonical functional-design document for Kosbling Sim2Real OS.

It defines, in one place:
- what the simulator is for
- how user ideas enter the system
- how reality enters the sandbox
- how strategy, agents, runtime, and feedback interact
- what has already been decided
- what remains intentionally open

This document is meant to be the **design-layer source of truth**.
It is not yet the implementation spec, but it should be strong enough to guide the next implementation-adjacent specs.

---

## 2. Product goal

Kosbling Sim2Real OS is not primarily a generic multi-agent simulator.

Its core purpose is:

> help users test, revise, and understand business ideas inside a shadow environment before risking real-world money.

The product should help users answer:
- Is this business idea directionally viable?
- What assumptions are fragile?
- What strategy seems promising under realistic conditions?
- What likely caused success or failure?
- What should I change in the next iteration?

So the product is centered on:
- idea validation
- strategy refinement
- realistic tradeoff exposure
- iteration through feedback

not on full autonomous commerce in v0.1.

---

## 3. Core loop

The core product loop is:

```text
User Idea -> Reality Framing -> Strategy Framing -> Simulation Run -> Outcome Explanation -> User Revision -> Next Run
```

This is the real heart of the system.

The simulator should therefore be designed not just as an engine, but as a structured business-learning loop.

---

## 4. What has been decided

The following decisions are currently treated as settled unless explicitly revisited.

A major new input is the business-layer MVP document:
- `project/opc-mvp-business-version-2026-03-23.md`

That document does not replace this design document, but it does sharpen how v0.1 should be cut.

### 4.1 Product and runtime stance
- v0.1 is a **local-first shadow engine**
- it should remain **OpenClaw-friendly**, but not deeply integrated yet as a full multi-agent runtime
- realism matters, but the goal is to **reflect reality**, not fully recreate reality
- the first useful cut should be **IM-native**, not dashboard-first
- here, **IM-native** means the product should live inside OpenClaw-supported chat surfaces and conversation flows; it does **not** mean v0.1 should build its own IM channel infrastructure
- the first user-visible MVP may use **one LLM playing multiple visible agent roles**, before true multi-agent routing is introduced later

### 4.2 User interaction stance
- the system may derive a `strategy_frame` automatically
- default behavior is **run immediately**, but the user should be able to inspect and adjust the strategy framing
- users may edit a **limited subset** of reality-layer assumptions, not arbitrary internal state

### 4.3 Reality and calibration stance
- the system should use **lightweight web grounding by default**
- profile/default assumptions may exist, but should stay lightweight
- realism / calibration checks should **warn**, not silently rewrite outcomes

### 4.4 Agent stance
- execution agents are **LLM-first**
- at the system-design layer, first-pass baseline execution domains remain:
  - `ads_agent`
  - `supply_agent`
  - `finance_agent`
- at the product/UX layer, the user may experience a visible team such as:
  - Kos / CEO coordinator
  - Supply Chain Ops
  - Social Media & Growth
  - Brand & PR
  - Finance Guard
- this means **visible personas** and **internal execution structure** are related but not identical, and should not be conflated
- `finance_agent` is **advisory/warning-only** in v0.1, not hard veto

---

## 5. Design principles

1. **Reflect reality, do not attempt to fully recreate reality**
2. **Do not produce anti-common-sense outcomes**
3. **Keep user intent separate from execution behavior**
4. **Use bounded uncertainty, not uncontrolled chaos**
5. **State and outcomes must remain inspectable**
6. **Reality collection should stay lightweight in v0.1**
7. **The design should be OpenClaw-friendly, but v0.1 should remain a local-first shadow engine**

---

## 6. Core system objects

The current design centers on these objects:

### 6.1 `idea_input`
The raw user idea and constraints.

Examples:
- business concept
- budget
- target market
- channel preference
- risk preference
- user revisions

### 6.2 `world_context`
The structured reality backdrop for the simulation.

It is not the evolving state.
It is the business environment the state lives inside.

### 6.3 `strategy_frame`
The operating thesis for this run.

This is the bridge between:
- what the user wants
- what kind of world exists
- what execution agents should try to do

### 6.4 `state`
The evolving business ledger during the run.

### 6.5 `signals`
Runtime updates that represent changing external conditions.

### 6.6 `events`
Discrete shocks or disruptions.

### 6.7 `action_intent`
Structured proposed action from an execution agent.

### 6.8 `execution_result`
Structured outcome of action execution through the adapter.

### 6.9 `calibration_report`
A realism / plausibility layer used to flag anti-common-sense outputs.

---

## 7. User idea and strategy framing

### 7.1 Why this layer exists

The user’s idea should not be fed directly into execution agents.

That would blur together:
- user intent
- business strategy
- execution behavior

The system needs an intermediate object:

## `strategy_frame`

### 7.2 Role of `strategy_frame`

The strategy frame captures the current operating thesis for a run.

It should express things like:
- primary objective
- risk posture
- growth vs margin preference
- budget style
- inventory posture
- experimentation style
- explicit guardrails

### 7.3 Suggested first shape

```yaml
strategy_frame:
  objective: validate_unit_economics | maximize_growth | protect_cash | mixed
  priority_order: []
  risk_posture: conservative | balanced | aggressive
  budget_style: cautious_testing | staged_scaling | front_loaded
  margin_preference: low | medium | high
  inventory_posture: conservative | balanced | aggressive
  experimentation_style: narrow | iterative | broad
  guardrails:
    max_daily_ad_spend_usd: number | null
    minimum_cash_buffer_usd: number | null
    margin_floor_pct: number | null
  thesis_notes: []
```

### 7.4 User revision model

A user revision should primarily update the `strategy_frame`, rather than directly tweak random execution details.

Examples:
- “Be more conservative on inventory.”
- “Profit matters more than GMV now.”
- “Test cheaper creatives first.”

### 7.5 Current UX stance

Default behavior should be:
- system derives strategy framing
- user may inspect and lightly edit it
- run may proceed without a mandatory approval gate

This keeps the product fast while still keeping the strategy visible.

---

## 8. Reality model: what the simulator must reflect

The simulator’s credibility depends on whether the sandbox behaves in a directionally real way.

Reality in this product is multi-layered.

### 8.1 Category reality
- what kind of product this is
- how purchase decisions are usually made
- typical margin structure
- lead-time and logistics pressure

### 8.2 Competitive reality
- price band
- competitor density
- offer saturation
- differentiation difficulty

### 8.3 Customer reality
- user segment
- trust requirement
- price sensitivity
- decision speed

### 8.4 Channel reality
- attention cost
- creative fatigue
- platform friction
- channel-specific behavior

### 8.5 Supply reality
- cost range
- MOQ
- lead time
- restock risk
- logistics complexity

### 8.6 Financial reality
- working capital pressure
- payback pressure
- margin sensitivity
- cash tolerance

### 8.7 Reality principle

The simulator should not try to fully mirror reality.
It should reflect the structural differences that make one business idea behave differently from another.

---

## 9. How reality enters the system

Reality should enter the simulator in three distinct ways.

### 9.1 Initialization: `world_context`

Before a run starts, the system should build a `world_context`.

This object should capture the world backdrop for the scenario.

Suggested shape:

```yaml
world_context:
  category:
    type: string
    price_band: low | medium | high
    purchase_frequency: low | medium | high
    margin_profile: thin | normal | rich

  customer:
    primary_segment: string
    price_sensitivity: low | medium | high
    trust_requirement: low | medium | high
    decision_speed: fast | medium | slow

  competition:
    density: low | medium | high
    price_pressure: low | medium | high
    differentiation_difficulty: low | medium | high

  channel:
    primary_channel: string
    acquisition_friction: low | medium | high
    creative_fatigue_speed: low | medium | high
    baseline_attention_cost: low | medium | high

  supply:
    lead_time_days: number
    moq_units: number | null
    logistics_complexity: low | medium | high
    restock_risk: low | medium | high

  finance:
    working_capital_pressure: low | medium | high
    cash_tolerance: low | medium | high
    payback_speed_expectation: fast | medium | slow
```

### 9.2 Runtime: `signals` and `events`

Reality continues to affect the run after day 1.

Examples:
- demand shifts
- CPM changes
- supply delay
- competitive pressure
- sudden event spikes

### 9.3 Result boundary: `calibration`

Even when a run completes, the system should still ask:
- is the result plausible?
- does it violate normal business intuition?
- does it feel anti-common-sense?

In v0.1, calibration should:
- raise warnings
- lower confidence
- help explanation

It should **not** silently rewrite results.

---

## 10. How to collect reality-layer information

This is a core part of the same design layer.

Reality collection is not a separate concern from reality modeling.
It is part of how reality enters the sandbox.

### 10.1 Recommended collection model

#### Main source: lightweight grounding
The default should be lightweight external grounding.

Possible tools/sources:
- `web_search`
- `web_fetch`
- user-provided source material
- manually curated assumptions

Use cases:
- checking price bands
- understanding common competitors
- identifying customer characteristics
- confirming category/channel norms
- spotting obvious supply or margin constraints

#### Secondary source: lightweight profiles/defaults
Profiles and defaults should exist as structure helpers, not as a giant prebuilt knowledge base.

Examples:
- broad category profiles
- broad channel profiles
- common supply-finance defaults

### 10.2 What v0.1 should NOT do

- heavy real-time market data ingestion
- large-scale competitor scraping
- maintaining a massive hand-authored profile library for every category
- turning every run into a research pipeline

### 10.3 Key rule

`web_search` should be an auxiliary grounding tool for building `world_context`, not the core simulation engine itself.

### 10.4 Product implication

The simulator should be able to say:
- what reality assumptions were collected
- what was inferred from grounding
- what remained defaulted

That way the user can understand what world the sandbox was built from.

---

## 11. Execution agent design

Execution agents are not the source of business intent.
They operate under the `strategy_frame` inside the current `world_context` and `state`.

A useful distinction here is:
- **visible team layer** = what the user feels they are talking to in chat
- **execution layer** = what the system is actually using internally to think, propose, and update state

For v0.1 / Layer 0, these two layers may intentionally be looser than a one-to-one mapping.

### 11.1 First-pass baseline
At the internal execution layer, the minimum enduring domains remain:
- `ads_agent`
- `supply_agent`
- `finance_agent`

At the visible product layer, the system may additionally package outputs through:
- `Kos`
- `Supply Chain Ops`
- `Social Media & Growth`
- `Brand & PR`
- `Finance Guard`

This allows the product to feel richer than the first internal implementation needs to be.

### 11.2 Responsibilities

#### `ads_agent`
Owns:
- campaign launch / pause / scale suggestions
- testing recommendations
- traffic allocation judgment

#### `supply_agent`
Owns:
- reorder suggestions
- safety stock adjustments
- inventory health interpretation

#### `finance_agent`
Owns:
- cash-flow warnings
- budget caution
- margin and burn-rate guardrails

In v0.1, finance remains advisory/warning-only.

### 11.3 Important constraint

Agents should:
- propose structured actions
- explain reasoning briefly
- not mutate state directly
- not replace user strategy intent

### 11.4 Coordination model

Current preferred model:
- agents propose independently
- runtime validates and resolves
- adapter executes
- state updates
- artifacts record everything

No full super-orchestrator agent is required in v0.1.

---

## 12. Simulation loop design

There are two loops.

A key adjustment from the business MVP document is that the product loop should feel like a chat-native operating rhythm, not a batch simulation tool.

### 12.1 Outer loop (product loop)
- user provides idea
- system frames reality and strategy
- simulation runs
- outcomes are explained
- user revises
- next run begins

### 12.2 Inner loop (runtime loop)
For each simulated day:
1. read current state
2. refresh environment signals
3. inject relevant events
4. assemble agent context under current strategy
5. collect action intents
6. validate / resolve / risk-check
7. execute via mock adapter
8. update state
9. write artifacts and realism checks

### 12.3 Layer 0 interaction rhythm
For the first MVP cut, the runtime should be surfaced in staged chat beats rather than as a fully exposed simulator console.

Recommended first rhythm:
1. idea intake
2. fast market/reality snapshot
3. user chooses start / adjust / switch idea
4. simulation advances in chunked stages (for example every 5 simulated days)
5. after each chunk, the system pauses and waits for user input
6. the system never auto-continues unless the user explicitly says to continue

This interaction rhythm is part of the product design, not just UI wrapping.

---

## 13. Uncertainty model

The simulator should not be fully deterministic.
That would make it too artificial.

But it also should not be arbitrarily chaotic.
That would make it useless for judgment.

### 13.1 Target

> **Bounded uncertainty**

Enough uncertainty to feel real, but structured enough to stay interpretable.

### 13.2 Good uncertainty
- market variance
- demand fluctuation
- supplier delays
- event shocks
- modest LLM decision variation

### 13.3 Bad uncertainty
- hidden defaults
- undocumented randomness in state updates
- arbitrary schema drift
- outcomes that cannot be explained afterward

### 13.4 Product requirement

A useful summary must distinguish between:
- setup factors
- strategy factors
- execution factors
- uncertainty factors

So the user can judge whether the problem was:
- the idea
- the strategy
- the execution
- or adverse variation

---

## 14. Runtime responsibilities

The runtime should act as:
- world-rule enforcer
- action validator
- conflict resolver
- adapter caller
- state updater
- artifact writer
- realism boundary checker

It should not behave like an unbounded creative planner.

---

## 15. OpenClaw relationship

Current stance:
- v0.1 should remain a **local-first shadow engine**
- it should be **OpenClaw-friendly**, but not yet deeply integrated

That means:
- clear runtime boundaries
- clear input/output interfaces
- artifacts that can later be surfaced through OpenClaw
- no need to make OpenClaw the core runtime host in v0.1

---

## 16. What should be visible to the user

A useful system should let the user see:
- what idea is being tested
- how that idea was interpreted into strategy
- what reality assumptions were used
- what data was grounded vs defaulted
- what agents decided
- what happened during the run
- why the run likely succeeded or failed
- what the user might revise next

For the MVP, this visibility should usually be packaged as:
- a chat-native market snapshot
- staged progress updates
- explicit decision points
- end-of-run recap / battle report

The system should feel like an AI business team reporting upward to the boss inside chat.

---

## 17. Current v0.1 scope

### 17.1 Design target vs MVP cut
The full design target remains broader than the first MVP cut.

The business MVP document suggests a sharper first cut:
- IM-native interaction
- one visible AI team in chat
- one LLM may initially play multiple roles
- JSON-based `SimState`
- Google Trends as the first hard reality anchor
- staged 30-day simulation with explicit user-controlled continuation

Important clarification:
- this is a **product interaction constraint**, not an instruction to build new IM-channel plumbing
- v0.1 should assume OpenClaw already provides the messaging/channel layer
- implementation should focus on simulation logic, state, agent behavior, and chat-shaped responses on top of existing OpenClaw surfaces

This should be treated as the preferred **Layer 0 / first-deliverable cut**.

### 17.2 Must have
- idea input
- strategy frame
- world context
- lightweight grounding for reality framing
- state
- runtime loop
- artifacts and summary
- realism / calibration checks in warning-only form
- explicit pause / continue control in chat

### 17.3 Should have
- visible team-style reporting in chat
- a lightweight mapping from visible personas to internal execution domains
- staged 5-day reporting rhythm
- a small library of defaults/profiles to support grounding
- Google Trends as first reality anchor

### 17.4 Can be stubbed in Layer 0
- true multi-agent routing
- richer brand PR logic
- deep cross-agent conflict resolution
- rich scenario branching / parallel universe replay
- sophisticated calibration scoring

### 17.5 Not yet required
- heavy external data pipelines
- full Live adapter
- heavy OpenClaw integration
- competitor/entity-level simulation
- perfect forecasting fidelity
- giant category-specific config libraries

---

## 18. Open questions

1. How reviewable/editable should `strategy_frame` be in the actual UX?
2. Which specific reality-layer fields should be user-editable in v0.1?
3. How strict should realism warnings be before they become noisy?
4. How much history should execution agents see in v0.1?
5. Should user revisions be strictly between runs, or eventually allowed mid-run?

---

## 19. Final summary

Kosbling Sim2Real OS should be designed as a business-idea validation system, not merely a multi-agent simulator.

Its credibility depends on three things:
- user ideas are translated into explicit strategy
- reality enters the sandbox through lightweight grounding, structured world assumptions, runtime signals/events, and warning-only realism checks
- outcomes are explained in a way that supports revision and learning

That is the current center of gravity for the design.
