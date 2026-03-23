# Kosbling Sim2Real OS — Reality Ingestion Design

Status: Draft v0.1  
Date: 2026-03-23

---

## 1. Purpose

This document defines how real-world business conditions should enter the simulator.

It exists to answer:
- what parts of reality the simulator should reflect
- what “real enough” means for this product
- how market and industry differences should shape the sandbox
- how to avoid simulations that feel absurd, detached, or anti-common-sense

---

## 2. Core design stance

The simulator should **reflect reality**, not **recreate reality in full detail**.

That means:
- we do not need a perfect digital twin of the world
- we do need a sandbox that respects real business structure and common-sense constraints
- different categories, industries, user segments, and competitive environments should produce meaningfully different simulations

Short version:

> **The goal is realism of structure and behavior, not exhaustive replication.**

---

## 3. What “reality” means in this product

For Sim2Real, “reality” is not one thing.
It is a layered business environment.

At minimum, the simulator should reflect these layers:

### 3.1 Category reality
- what kind of product this is
- how expensive it is
- how purchase decisions are usually made
- typical margin structure
- normal reorder / lead-time pressures

Examples:
- impulse beauty product ≠ bulky home product ≠ niche hobby tool

### 3.2 Competitive reality
- price band
- competitor density
- offer saturation
- differentiation difficulty
- expected creative pressure

### 3.3 Customer reality
- who the buyer is
- what problem they are solving
- price sensitivity
- trust requirements
- patience / urgency / repeat-purchase tendency

### 3.4 Channel reality
- how traffic behaves in this channel
- how expensive attention is
- how creative fatigue works
- what conversion friction exists
- what platform-specific dynamics matter

### 3.5 Supply reality
- supplier cost range
- MOQ / lead time
- restock risk
- product fragility / logistics complexity

### 3.6 Financial reality
- cash conversion pressure
- capital lock-up risk
- margin sensitivity
- ad spend tolerance

---

## 4. What we are NOT trying to do

The simulator is **not** trying to:
- perfectly model every competitor
- exactly forecast real future revenue
- reproduce every market signal in full fidelity
- be a magical prediction oracle

The simulator **is** trying to:
- make different business ideas behave differently in believable ways
- make obviously weak ideas fail for understandable reasons
- make tradeoffs visible
- make outcomes feel grounded in recognizable business logic

---

## 5. Design principle: anti-anti-common-sense

A core success condition is:

> the simulator should not produce outcomes that feel obviously anti-common-sense to an experienced operator.

Examples of anti-common-sense failure:
- a bulky low-margin product scales like a no-friction digital offer
- a commodity product wins despite totally irrational CAC assumptions
- a supply-constrained business somehow grows without inventory pressure
- customer behavior looks identical across wildly different categories

This means realism checks matter as much as raw simulation logic.

---

## 6. How reality should enter the system

Reality should enter the simulator in three distinct ways.

## 6.1 As `world_context` at initialization

Before the run starts, the system should build a structured `world_context`.

This is the simulator’s starting picture of the world.

It should include things like:
- category type
- customer segment assumptions
- competitor density / price band
- supply and logistics baseline
- channel dynamics baseline
- financial pressure assumptions

This is not the evolving state.
It is the world backdrop the state lives inside.

## 6.2 As `signals` and `events` during runtime

Reality does not stop existing after day 1.
So the simulator should also allow the world to influence the run through:
- market signal updates
- demand shifts
- CPM/CTR/CVR changes
- supply disruptions
- competitive pressure events

This is how reality keeps pushing back during the run.

## 6.3 As `calibration` and realism checks after or during execution

Even if the simulator can technically produce a result, it should also ask:
- does this result still feel plausible?
- are the implied economics too unrealistic?
- did we violate normal business intuition?

This is the realism boundary layer.

---

## 7. Core engineering objects

To make this design implementable, reality should be represented through explicit objects.

## 7.1 `idea_input`
Raw user idea and constraints.

## 7.2 `world_context`
Structured business-world backdrop derived from idea + scenario + grounded assumptions.

## 7.3 `strategy_frame`
The operating thesis for this run under the given world context.

## 7.4 `state`
The evolving business ledger during execution.

## 7.5 `signals`
Time-varying external conditions during the run.

## 7.6 `events`
Discrete shocks or changes that materially affect the state.

## 7.7 `calibration_report`
A realism-check layer explaining whether results stayed inside plausible bounds.

---

## 8. What should be encoded in `world_context`

Suggested first shape:

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

This is not the final schema, but it is the right kind of object.

---

## 9. Category-specific behavior should differ structurally

A core requirement is that different business types should not behave like generic copies of one another.

Examples:

### Example A — bulky physical product
- slower decision cycle
- higher logistics burden
- more inventory pressure
- less pricing freedom

### Example B — hobby / passion category
- stronger niche identity
- more creative/storytelling dependence
- user trust/community matter more
- repeat purchase may depend on engagement loops

### Example C — commodity offer
- more price pressure
- harder differentiation
- ad efficiency decays faster
- margin is more fragile

The simulator does not need to perfectly model every category,
but it must preserve these kinds of directional differences.

---

## 10. Customer and competitor realism

The sandbox should not treat “the market” as one undifferentiated blob.

At minimum, we should design for:
- different user segments responding differently to price and trust
- different category norms affecting expected CAC / conversion behavior
- different competitor density affecting difficulty and margin pressure

This can be simple in v0.1, but it must be present in structure.

---

## 11. Engineering module implications

This design suggests at least these modules:

```text
grounding/
  world_context_builder.py
  category_profiles.py
  customer_profiles.py
  competition_profiles.py
  channel_profiles.py
  supply_profiles.py
  finance_profiles.py

environment/
  signal_engine.py
  event_engine.py
  calibration.py
```

### `world_context_builder`
Builds a first structured world from:
- idea input
- scenario config
- reference defaults / profiles
- optional grounded data

### `signal_engine`
Updates time-varying conditions during runtime.

### `event_engine`
Injects discrete shocks and changes.

### `calibration`
Checks whether outcomes remain plausible and flags anti-common-sense patterns.

---

## 12. What can be simple in v0.1

We do not need:
- real-time competitor scraping
- perfect customer research ingestion
- high-fidelity econometric models
- fully custom world generation for every niche

We do need:
- category profiles
- customer/competition/channel structure
- grounded default assumptions
- simple but believable variation
- realism checks

So the right first move is:

> build a profile-driven world model, not a perfect real-world mirror.

---

## 13. Functional requirements

### Must have
- a structured `world_context`
- different category types producing different simulation conditions
- customer / competition / channel / supply / finance represented separately
- runtime signals/events that can modify the world during execution
- realism checks to catch anti-common-sense outputs

### Should have
- profile presets by category / channel / business type
- explicit explanation of world assumptions in run artifacts
- visible links between world assumptions and final outcome

### Not yet required
- external live data connectors
- detailed competitor entity tracking
- personalized customer-level simulation
- statistically rigorous forecasting layers

---

## 14. Open questions

1. How many category profiles do we want in v0.1?
2. Are customer/competition/channel profiles hand-authored first, or partly LLM-derived?
3. How strict should realism checks be before they become overbearing?
4. How much of `world_context` should be user-visible and editable?

---

## 15. Current conclusion

The simulator becomes meaningful only when reality enters as structured world assumptions, runtime signals, and realism checks.

The goal is not to recreate the world.
The goal is to make the sandbox behave in ways that a human operator recognizes as directionally real.
