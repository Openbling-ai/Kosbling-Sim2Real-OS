# Kosbling Sim2Real OS

> From paper ideas to real money machines.
>
> **Slogan:** _Don't burn real money on bad ideas. Sim it, tweak it, then deploy it._

## 1. Project Definition

**Kosbling Sim2Real OS** is an open-source e-commerce agent sandbox for testing DTC business ideas with real-world data before deploying the winning workflows into reality.

The core product promise is:

- use **real market inputs**
- run a **safe simulation** first
- iterate on strategy, prompts, creative, and operating rules
- then **deploy the exact same agent logic** to live systems

In one sentence:

> **Kosbling Sim2Real OS = a DTC simulator where agent teams can paper-trade a business, then go live with one click.**

Another outward-facing description:

> **Kosbling: The Open-Source E-commerce Agent Sandbox. Paper-trade your business ideas with real-world data, then deploy the winning agents to reality with one click.**

### 1.1 Current v0.1 implementation status

The codebase currently implements a **bounded v0.1 slice**, not the full long-term vision described later in this document.

Current implemented shape:
- CLI-first, local-first runtime
- shadow-first execution by default
- CEO + specialist role agents for marketing / supply / finance / brand
- execution agent that commits approved actions through an adapter boundary
- lightweight real grounding via Google Trends and Brave web search
- 30-day run in 5-day chunks with pause / resume
- market snapshot, chunk updates, final battle report, and per-chunk team trace artifacts

Current non-goals for this phase:
- full live commerce operations
- broad Shopify / Meta / payments / email write coverage
- GUI / IM product surfaces

So when this document discusses full Sim2Real deployment, treat that as the **product direction**, while the repository today should be read as the **Layer 0 / v0.1 implementation** of that direction.

---

## 2. Core Product Thesis

Most founders burn money because they test bad ideas directly in the real world:

- they buy inventory too early
- launch weak creatives
- misprice products
- underestimate CAC and logistics
- fail to react to stockouts, platform shocks, or cashflow pressure

Kosbling Sim2Real OS flips this.

Instead of learning by paying real tuition immediately, the user first enters **Shadow Mode**:

- real supplier data
- real trend data
- real logistics assumptions
- real platform dynamics approximated by simulation
- fake settlement / fake money / safe action boundaries

Once the user finds a setup that repeatedly wins, they can switch to **Live Mode**, where the same agents operate with real APIs and real money.

This creates the key magic:

> **One codebase. Two environments. Same agent logic. Different execution boundary.**

---

## 3. Product Positioning

### 3.1 What it is

Kosbling Sim2Real OS is simultaneously:

1. **A business simulator**
2. **An agent operating system**
3. **A commercial sandbox for AI-native workflows**
4. **A teaching tool for DTC operators**
5. **A showcase for OpenBling / OpenClaw runtime capabilities**

### 3.2 What it is not

It is **not**:

- just a dashboard
- just a prompt playground
- just a Shopify automation tool
- just a marketing simulator
- just a toy game

The real value is the bridge between **simulation and deployment**.

### 3.3 Why it matters

This is valuable because it reduces the scariest part of starting a DTC business:

- users can test a category before risking cash
- teams can compare strategies before running ads
- operators can train judgment by replaying scenarios
- developers can visibly understand why stateful agent systems matter

---

## 4. Signature User Journey

## Stage 1 — Setup: budget, idea, and grounding

Example input:

> “I have a $5000 budget. I want to build an outdoor portable ice bath tub business for North American fitness users.”

The system then grounds itself with real-world inputs:

- **Supplier Agent** pulls current supplier pricing, MOQ, and logistics timing from 1688 / Alibaba
- **Marketing Agent** pulls Google Trends, TikTok hashtags, and traffic signals
- **Finance Agent** estimates unit economics and working-capital risk
- **Store Agent** drafts the offer structure and storefront assumptions

The system outputs a realistic initial sandbox state, for example:

- landed cost: $50
- recommended retail: $119
- target gross margin range
- logistics timing and reorder risk

## Stage 2 — Time-lapse simulation

The user clicks:

**Run 30-Day Simulation**

The runtime then accelerates time and lets the agents operate across a simulated business timeline.

Illustrative timeline:

- **Day 1**: Store Agent launches a virtual storefront
- **Day 5**: Creative Agent produces the first ad set
- **Day 5-10**: Ads Agent spends virtual budget through a market simulator
- **Day 15**: Chaos event injected — TikTok demand spikes, inventory runs out, emergency air freight is triggered, gross margin falls by 12%
- **Day 30**: System outputs a full P&L and operational postmortem

Example result:

- budget: $5000
- ending cash: $1200
- business failed because restocking policy was too slow and creatives underperformed

## Stage 3 — Tweak and retry

The user modifies strategy, for example:

- switch ad creative style to “minimal premium”
- raise safety stock threshold to 100 units
- reduce early testing spend concentration

Then reruns the same 30-day simulation.

Example second result:

- budget: $5000
- ending cash: $8500
- profit margin: 22%

This loop is the addictive part of the product.

## Stage 4 — Deploy to reality

Once a setup shows repeatable wins in simulation, the user clicks:

**Grant Live Access**

They connect real credentials through OpenClaw / gateway flows:

- Shopify
- Meta Ads
- Stripe / payment stack
- email tooling
- possibly logistics / ERP / supplier systems later

At that point, the exact same agent logic leaves Shadow Mode and starts operating in Live Mode.

---

## 5. The Big Product Idea: Same Logic, Different Boundary

This is the central architecture principle.

### Shadow Mode

- real inputs
- simulated write actions
- virtual money
- sandbox state transitions
- chaos injections allowed
- safe to fail

### Live Mode

- real inputs
- real write actions
- real money
- real operational consequences
- tighter approvals and guardrails
- safe only after validation

### Invariant

The **agent logic remains the same**.

What changes is the execution adapter underneath.

This is the strongest proof that the runtime, not the prompt alone, is the real product.

---

## 6. Why This Perfectly Shows OpenBling / OpenClaw Runtime Value

## 6.1 Action boundaries and state isolation

This project visibly demonstrates that the system can separate:

- mock APIs from real APIs
- fake settlement from real settlement
- simulation state from production state

The model should not need to “know” whether it is in Shadow or Live mode.
That boundary belongs to the runtime.

## 6.2 Stateful memory and long-horizon execution

A 30-day business simulation requires the system to remember:

- prior ad performance
- recent inventory decisions
- pending supplier lead times
- previously triggered emergency actions
- budget depletion and recovery logic

This naturally showcases stateful, multi-step, long-running agents.

## 6.3 Real-time grounding

Although the environment is simulated, it is grounded by real data such as:

- supplier prices
- lead times
- search and social trends
- platform signals
- shipping costs

That makes the simulation feel alive and economically credible.

## 6.4 Multi-agent coordination

Different agents may have conflicting objectives:

- Marketing wants to scale spend
- Finance wants to preserve cash
- Supply wants to avoid stockouts
- Creative wants more testing room

Their argument, compromise, and coordination become part of the visible product experience.

---

## 7. System Architecture

## 7.1 Main components

### A. OpenClaw — Player Gateway

OpenClaw is the player-facing interaction layer.

Responsibilities:

- chat interface for the user / operator
- model routing
- session management
- pause / resume / interrupt simulation
- conversational inspection of agent decisions
- access control for live credential binding

Example interaction:

> “Why did Ads Agent keep spending on day 15 if CAC was already broken?”

### B. OpenBling — OS and physics engine

OpenBling is the runtime / operating system layer.

Responsibilities:

- environment abstraction
- state machine execution
- simulated time progression
- action boundary enforcement
- event injection / chaos system
- message bus between agents
- audit logging

### C. Adapter layer

Two adapters expose the same action surface to the agent system.

#### `Adapter_Mock`

- intercepts writes
- routes them into simulation logic
- uses market simulator outputs
- updates shadow ledger and shadow state

#### `Adapter_Live`

- routes approved writes into real systems
- hits Shopify / Meta / payment / email APIs
- enforces live guardrails, budgets, and approval policies

### D. Market Simulator

This is the internal evaluator / world model for outcomes not directly fetched from real APIs.

Possible uses:

- simulate ad CTR / CVR response
- simulate competitive pressure
- simulate user purchase response by creative quality and offer quality
- simulate platform volatility and sudden trend changes

This can start as:

- a prompt-driven LLM judge

and later evolve into:

- hybrid rules + retrieval + learned distributions + scenario libraries

---

## 8. Core Agents in the Initial Demo

The first demo does not need every possible agent.

Recommended MVP set:

### 1. Supplier Agent
- fetches supplier offers
- evaluates MOQ, lead time, shipping method
- manages reorder logic

### 2. Marketing Agent
- gathers trend data
- estimates audience heat and acquisition difficulty
- proposes channel mix

### 3. Creative Agent
- drafts ad angles and creative variants
- evaluates style experiments
- feeds options into ad testing

### 4. Store Agent
- builds storefront assumptions
- defines pricing, offer structure, bundles, landing-page strategy

### 5. Ads Agent
- allocates testing budget
- launches simulated campaigns
- shifts spend based on performance

### 6. Finance Agent
- tracks P&L, runway, working capital, and reorder safety thresholds
- acts as the risk governor inside the simulation

Optional later agents:

- Customer Support Agent
- CRM / Email Agent
- Inventory Planner Agent
- Operations QA Agent

---

## 9. The Simulation Engine

## 9.1 Time acceleration

The simulation should support compressed time such as:

- 7-day run
- 30-day run
- 90-day run

The runtime advances the world clock and applies state transitions.

## 9.2 Daily loop

A simple simulation loop may look like:

1. Read current state
2. Pull fresh real-world signals where needed
3. Let agents propose actions
4. Resolve conflicts / approvals
5. Execute actions through Shadow adapter
6. Update inventory, cash, traffic, demand, and outcome metrics
7. Inject events if triggered
8. Write audit log and step summary
9. Advance clock

## 9.3 Chaos engineering / event injection

This should be a first-class feature, not an afterthought.

Example events:

- ad account banned
- stock delayed at customs
- product goes viral on TikTok
- CPM spikes unexpectedly
- shipping cost jumps 30%
- top creative fatigues early
- supplier misses promised lead time

These events make the simulator useful as an operator training system, not just a toy optimizer.

---

## 10. User Experience Principles

The product should feel like a hybrid of:

- a management sim
- an AI copilot
- a command center
- an operating system for commercial agents

### UX qualities to preserve

- high feedback frequency
- visible causality
- dramatic but interpretable outcomes
- easy retry loop
- clear distinction between Shadow and Live
- satisfying “I found a winning setup” moment

### Key surfaces

#### A. Terminal UI / CLI

Should show:

- current day / simulation speed
- cash balance
- inventory levels
- active campaigns
- critical alerts
- recent agent decisions

#### B. Minimal web dashboard

Should show:

- simulation timeline
- P&L curve
- inventory waterline
- agent activity feed
- event log
- leaderboard / scenario outcomes

Current next-step note:
- the preferred next implementation is a **Web Observatory** focused on run replay, team collaboration visibility, and chunk-level causality rather than a generic KPI dashboard
- see `design/web-observatory-design.md`
- see `implementation/web-ui-v0.1-brief.md`

#### C. Audit log

Each run should output a markdown report containing:

- initial assumptions
- key decisions
- turning points
- failures and recoveries
- final outcome
- reasons behind major actions

This is both a debugging artifact and a shareable social object.

---

## 11. Open Source Distribution Strategy

## 11.1 Why this can spread

This project has unusually good open-source spread mechanics because it combines:

- agents
- simulation
- business fantasy
- competition
- shareable results
- “what if I tried this idea?” curiosity

## 11.2 Distribution loops

### A. DTC Million-Dollar Simulation Hackathon

Compete on:

- who can make the most virtual profit
- who can survive the hardest scenario
- who can achieve the best margin with limited capital

This turns prompt iteration into a spectator sport.

### B. Scenario / recipe library

Ship a public library of ready-to-run scenarios.

Examples:

- **Easy Mode:** $500 budget, trending impulse toy, TikTok-first growth
- **Hard Mode:** Black Friday stock delay + Meta ad ban + freight spike
- **Creator Mode:** UGC-only launch with no professional creatives
- **Cash Crunch Mode:** survive with strict reorder discipline

### C. Learning simulator

Beginners do not need to buy a course first.
They can fail safely inside the simulator, read the audit log, and build commercial intuition.

---

## 12. MVP Scope Recommendation

To make this buildable, MVP should stay narrow.

## MVP v0.1 Goal

Prove the Sim2Real pattern with one narrow DTC loop.

### Initial vertical

Recommend one constrained scenario such as:

- one product
- one market
- one storefront
- one paid channel
- one supplier data source

Example:

- North America DTC product test
- Shopify store
- Meta or TikTok as the ad channel
- Alibaba/1688 supplier grounding

### MVP capabilities

1. User inputs budget + product idea + audience
2. System pulls real supplier and trend data
3. System runs a 30-day simulation
4. System outputs P&L + timeline + decisions
5. User edits operating instructions and reruns
6. User can inspect why the agents made decisions

### Explicitly defer for MVP

- full autonomous media buying in live mode
- many simultaneous stores
- complex multichannel attribution
- deep warehouse / ERP integration
- polished game graphics
- full-blown marketplace simulator

---

## 13. PRD Skeleton

## 13.1 Problem

New DTC founders and operators burn money because they test directly in reality without a safe way to validate strategy, pricing, creative, inventory, and operating rules.

## 13.2 User

Primary users:

- aspiring DTC founders
- small operators testing product ideas
- e-commerce agencies prototyping strategies
- AI builders who want to experiment with commercial agents

Secondary users:

- educators
- incubators
- internal growth teams

## 13.3 Job to be done

> Help me test whether a business idea and operating playbook can work before I risk real money — and if it works, help me push the same playbook into reality.

## 13.4 Core promise

> Simulate with real data. Retry cheaply. Deploy the winner.

## 13.5 Functional requirements

### Required for MVP
- simulation session creation
- real-world data ingestion
- agent orchestration
- time-accelerated state engine
- shadow ledger / mock settlement
- audit log generation
- replay / inspect decisions

### Required for Sim2Real transition
- environment abstraction
- mock/live adapter parity
- credential binding for live systems
- approval and budget guardrails
- action audit trail

## 13.6 Non-functional requirements
- deterministic enough to compare runs
- inspectable outcomes
- resumable sessions
- state persistence across long runs
- explicit approval boundaries for live mode

## 13.7 Success metrics

### Product metrics
- number of simulations run per user
- rerun rate
- time spent in simulation
- number of scenarios shared
- % of users who connect real credentials after simulation success

### Runtime metrics
- simulation completion rate
- action trace completeness
- state recovery reliability
- agent conflict resolution visibility

---

## 14. Proposed Repository Shape

```text
kosbling-sim2real-os/
  README.md
  scenarios/
    ice-bath-north-america.yaml
    black-friday-hard-mode.yaml
  runtime/
    adapter_mock.py
    adapter_live.py
    simulation_engine.py
    state_store.py
    event_bus.py
  agents/
    supplier_agent.py
    marketing_agent.py
    creative_agent.py
    ads_agent.py
    finance_agent.py
    store_agent.py
  outputs/
    audit_logs/
  ui/
    tui/
    web/
  docs/
    architecture.md
    scenario-spec.md
    action-boundaries.md
```

---

## 15. Recommended First Build Plan

## Phase 1 — Write the design clearly

Produce:

- README narrative
- architecture doc
- scenario spec
- state model doc
- mock/live adapter contract

## Phase 2 — Build the narrowest credible loop

Build only:

- one scenario loader
- one simulation engine
- two adapters
- basic state store
- markdown audit log output

## Phase 3 — Add visibility

Build:

- CLI / TUI status view
- step-by-step event feed
- replay / inspection commands

## Phase 4 — Add live bridge carefully

Only after simulation value is proven:

- credential binding
- live approval workflow
- controlled real-system actions

---

## 16. Key Risks

### 1. Simulation credibility risk
If outcomes feel arbitrary, users will not trust the system.

### 2. Scope explosion risk
Trying to simulate all of commerce too early will kill the project.

### 3. Live transition risk
If Shadow and Live adapters drift, the “same logic” promise breaks.

### 4. UX confusion risk
Users must always know whether they are in Shadow or Live mode.

### 5. Safety risk
Live deployment must be gated by explicit approvals, budgets, and action boundaries.

---

## 17. Sharp Product Principles

1. **Same logic, different boundary**
2. **Real data, safe writes**
3. **Fast reruns beat perfect realism**
4. **Auditability is part of the product**
5. **Teach judgment, not just automation**
6. **The simulator must be fun enough to replay**
7. **Deploy only after repeated wins**

---

## 18. Suggested Next Documents

To continue building, the next docs should be:

1. `README.md` — external open-source narrative
2. `docs/architecture.md` — runtime architecture and component boundaries
3. `docs/scenario-spec.md` — how a business scenario is defined
4. `docs/state-model.md` — ledger, inventory, campaign, and memory state
5. `docs/action-boundaries.md` — what changes between Shadow and Live
6. `docs/mvp-roadmap.md` — implementation plan by phase

---

## 19. Working Summary

Kosbling Sim2Real OS is not just an e-commerce tool.
It is a proof that long-running, stateful, multi-agent systems can safely learn in simulation and then act in reality.

If built well, it can become:

- a sandbox
- a teaching machine
- a developer magnet
- a benchmark for runtime design
- a gateway into a broader OpenBling ecosystem

And the most important emotional hook stays simple:

> **Don’t burn real money on bad ideas. Sim it, tweak it, then deploy it.**
