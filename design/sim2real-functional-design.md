# Kosbling Sim2Real OS — Functional Design

Status: Draft v0.3  
Date: 2026-03-23

---

## 1. Purpose

This is the canonical functional-design document for Kosbling Sim2Real OS.

It defines:
- what the product fundamentally is
- what role agents play in the system
- how reality enters the system
- how the commerce runtime should be structured
- how shadow simulation works as the first execution mode
- what v0.1 / Layer 0 should actually build

This document is the design-layer source of truth.

---

## 2. Core product identity

Kosbling Sim2Real OS should **not** be framed as a traditional simulator with agents layered on top.

A better mental model is:

> **an agent-native, commerce-specific runtime**
> that currently operates in **shadow mode first**.

Or more plainly:

> a commerce-shaped OpenClaw-style runtime, specialized for e-commerce decision-making, store operations, and shadow/live execution.

Simulation is therefore not the whole identity of the system.
It is the first operating mode.

---

## 3. Product goal

The system exists to help a user:
- test business ideas
- see how commerce decisions play out over time
- revise plans before spending real money
- eventually move from shadow execution toward live execution

The product loop is:

```text
User Idea -> Agent Understanding -> Reality Framing -> Shadow Execution -> Outcome Explanation -> User Revision -> Next Run
```

---

## 4. Design correction

The most important design correction is this:

### Wrong framing
- build a rule-heavy simulator core
- let agents sit on top as a chat shell

### Better framing
- agents are the primary decision-making runtime
- the commerce system gives them world state, tools, and execution boundaries
- shadow simulation is the current execution environment

That means the system should be designed around:
1. agent cognition
2. commerce harness/tooling
3. stateful world continuity
4. grounded shadow execution

not around a pure rules engine.

---

## 5. Core design principles

1. **Agent-first, not rule-first**
2. **Shadow-first, not live-first**
3. **Reflect reality, do not fully recreate reality**
4. **Preserve state continuity across stages**
5. **Use structured action boundaries, not free-form chaos**
6. **Let the CEO agent interpret natural language**
7. **Do not require a separate user-facing DSL in v0.1**
8. **Build a commerce harness, not a generic agent platform clone**

---

## 6. System layers

The system should be thought of as five layers.

### 6.1 User / boss layer
The human talks naturally in chat.

### 6.2 Agent layer
Agents interpret goals, reason about tradeoffs, and decide what to do.

At the top sits the CEO agent (`Kos`), which:
- understands user intent
- coordinates downstream roles
- asks clarifying questions
- translates user adjustments into structured downstream actions
- reports back to the user

Below the CEO, the system may include:
- specialist planning agents for marketing / supply / finance / brand
- execution agents that actually commit approved actions through the active adapter

### 6.3 Commerce harness layer
This is the key middle layer.

It exposes e-commerce-specific actions/tools such as:
- marketing actions
- supply actions
- finance actions
- pricing actions
- promotion actions
- brand actions

Agents should operate this layer, not raw engineering internals.

The harness remains the domain action surface, but approved actions may now be committed through an execution agent before the harness or live provider adapter applies them.

### 6.4 Runtime / world layer
This layer maintains:
- state
- grounding
- stage progression
- shadow execution effects
- events
- artifacts

### 6.5 Provider / execution layer
This layer interacts with:
- grounding providers (for example Google Trends)
- future live providers
- current shadow execution handlers

The execution boundary should be adapter-backed:
- a `shadow` adapter for simulated commerce effects
- a `live` adapter for real commerce writes later

The agent logic should stay as stable as possible while the adapter underneath changes.

---

## 7. Core objects

### 7.1 `idea_input`
Raw user idea and high-level constraints.

### 7.2 `scenario`
Compact structured starting setup for one run.

### 7.3 `world_context`
The grounded business environment for the run.

### 7.4 `state`
The evolving commerce world during execution.

### 7.5 `action_proposal`
Structured action proposed by an agent.

### 7.6 `execution_result`
Structured result after the runtime applies that action.

This result may come from:
- a shadow adapter + commerce harness path
- a future live adapter + provider write path

### 7.7 `artifact`
User-facing and machine-readable outputs such as snapshots, chunk updates, and final recap.

---

## 8. Agent model

### 8.1 CEO agent is substantive, not decorative
`Kos` / CEO is not just a presentation wrapper.

It is the top-level semantic planner/coordinator.

It should:
- understand natural language
- infer likely user intent
- determine which commerce domains are implicated
- ask for clarification only when needed
- decompose the request into downstream actions/tool use

### 8.2 Visible team vs internal execution
At the product layer, the user may feel they are talking to a team such as:
- Kos / CEO
- Supply Chain Ops
- Social Media & Growth
- Brand & PR
- Finance Guard

At the internal layer, the first implementation may use fewer enduring execution domains.

This is acceptable.

However, `shadow-first` should not be interpreted as `planner-only`.
Agents may still participate in execution, as long as the execution boundary is routed through the active adapter rather than through raw state mutation.

### 8.3 No separate user DSL required
The user should not need to learn a formal adjustment language.

The CEO agent should interpret natural language changes such as:
- “put more budget into TikTok”
- “raise the price to 129”
- “pause ads for now”
- “ship the first batch by air”

and route them into structured downstream actions.

---

## 9. Commerce harness layer

This is one of the most important parts of the architecture.

The harness should present a domain-specific action surface to agents.

Instead of having agents manipulate raw state directly, the system should expose commerce-native action types such as:
- adjust channel budget
- pause campaign
- launch creator campaign
- reuse creator content as creative
- adjust price
- start promotion
- reorder inventory
- change shipping mode
- switch to presale
- set cash reserve

The preferred path is:
- planner agents propose structured actions
- the CEO merges and approves them
- an execution agent commits them through the active adapter
- the shadow harness or live provider layer applies the effects

This layer is what makes the system feel like a real commerce runtime rather than a generic chat system.

---

## 10. Reality model and grounding

Reality should enter the system in three ways.

### 10.1 Initial grounding
Before a run starts, the system should gather a lightweight but real market context.

### 10.2 Ongoing refresh
During the run, some grounded data may refresh at stage boundaries or periodic intervals.

### 10.3 Calibration
The system should perform realism checks and warnings, but not silently rewrite outcomes.

### 10.4 Grounding stance
The product should assume **real networked grounding by default**.

For v0.1, the first hard anchor should be:
- Google Trends

`web_search` or similar web-assisted grounding may be used where useful, but should remain lightweight.

Offline fixture/mock data may exist for:
- development
- testing
- degraded fallback

It should **not** become the default product mode.

---

## 11. State model stance

The state is not just a ledger.
It is the evolving commerce world the agents operate inside.

It should retain enough continuity for:
- stage-to-stage reasoning
- grounded tradeoffs
- user intervention
- final recap

For v0.1, it should remain compact, but it must still model:
- product
- supply
- marketing
- brand
- finance
- grounded market data
- decisions
- events

### 11.1 Four change mechanisms

Not every state variable should be driven in the same way.

The design should distinguish four mechanisms:

#### A. Deterministic accounting
Use hard computation for things like:
- revenue
- cost
- cash balance
- gross profit
- inventory movement

#### B. Business constraints / harness rules
Use deterministic domain constraints for things like:
- reserve cash boundaries
- shipping-mode consequences
- inventory cannot go below zero
- paused ads should stop paid traffic

#### C. Bounded stochasticity with grounding
Use grounded but uncertain updates for things like:
- impressions / reach
- CPC / traffic efficiency
- creator/KOL performance
- supply delay risk
- trend-driven shifts

This should not be pure random noise. It should be constrained by grounded priors and current world state.

#### D. Agent judgment
Use agent reasoning for things like:
- intent decomposition
- prioritization
- strategy adaptation
- explanation of tradeoffs

This four-way distinction is critical. It prevents the system from collapsing into either a giant rules engine or unconstrained LLM improvisation.

---

## 12. Runtime model

### 12.1 Runtime identity
The runtime is not merely a simulator engine.
It is the operating substrate for commerce agents.

### 12.2 Internal loop
Internally, the runtime should:
1. load current state
2. refresh grounded signals if needed
3. let agents reason
4. collect structured proposals
5. merge and approve the proposals
6. commit approved actions through an execution agent and adapter
7. apply shadow or live effects through the active execution boundary
6. update state
7. generate artifacts

### 12.3 External rhythm
Externally, the user should experience a staged chat rhythm:
- idea intake
- market snapshot
- start / adjust / switch
- 5-day chunk updates
- pause / continue
- final battle report

The user must remain in control of progression.

---

## 13. Shadow mode vs live mode

### 13.1 Shadow mode
In v0.1, shadow mode is the real target.

In shadow mode:
- agents operate through the same execution surface they will later use in live mode
- approved actions are committed through an execution agent
- the active adapter routes them into simulated/shadow effects
- state evolves as if the business were running
- recap and learning are the goal

### 13.2 Live mode
Live mode is future-facing.

In live mode:
- the same planning and execution agent logic may remain in place
- the active adapter changes from `shadow` to `live`
- approved actions route into real provider writes with stronger guardrails and approvals

It should remain outside the main v0.1 build, except for clean boundary stubs if useful.

---

## 14. V0.1 / Layer 0 implementation target

The first useful cut should be:
- chat-native
- local-first
- shadow-first
- agent-native
- lightly grounded
- stateful
- staged
- narrow enough to ship

A valid first implementation may use:
- one LLM
- multiple visible roles/personas
- structured downstream action proposals
- a compact commerce harness
- simple state persistence

This is acceptable as long as the system feels coherent and causally continuous.

---

## 15. What is explicitly out of scope for v0.1

- heavy live integrations
- building custom IM infrastructure
- full generic multi-agent platform work
- giant category-specific rule libraries
- heavy competitor scraping systems
- overly elaborate approval trees
- full dashboard product
- deep branching simulation engine

---

## 16. User-visible artifacts

The system should produce artifacts such as:
- market snapshot
- 5-day chunk update
- warnings and decision points
- final battle report
- lightweight counterfactual guidance

These should feel like an AI commerce team reporting to the boss.

---

## 17. Final summary

Kosbling Sim2Real OS should be designed as:

> **an agent-native, commerce-specific, shadow-first runtime**
> rather than a traditional simulator with agents wrapped around it.

Agents provide business intelligence and semantic decomposition.
The commerce harness provides domain actions.
The runtime provides continuity, grounding, shadow execution, and artifacts.

That is the current design center of gravity.
