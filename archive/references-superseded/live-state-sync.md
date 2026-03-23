# Kosbling Sim2Real OS — Live State Sync

Status: Draft v0.1  
Date: 2026-03-20

---

## 1. Purpose

This document explains one key question:

> Once the system switches from Shadow Mode to Live Mode and starts calling real APIs, how can the internal state model still remain useful?

Short answer:

> In Live Mode, the state model does not disappear.
> It becomes a **digital twin + control ledger + decision memory** that must keep reconciling with real systems.

---

## 2. Shadow vs Live

## Shadow Mode

In Shadow Mode, the internal state model is basically the business world itself.

- orders are simulated
- spend is simulated
- inventory movement is simulated
- financial results are simulated

## Live Mode

In Live Mode, the internal state model is no longer the only source of truth.

External systems now hold real truth in their own domains:

- e-commerce platform holds real products / orders
- ad platform holds real spend / delivery
- payment platform holds real transactions
- inventory or procurement systems hold real operational updates

So in Live Mode, the internal state model becomes:

- a **local mirror of the business state**
- a **cross-system control ledger**
- a **decision memory layer**
- a **reconciliation surface**

---

## 3. Why the internal state model is still necessary

Without an internal state model in Live Mode, the system loses:

- cross-system unified view
- agent continuity and memory
- auditability
- decision explanations
- policy / threshold tracking
- local simulation-to-live inheritance

Real systems are fragmented.
No single external platform knows the whole business context.

That means the internal state model is still required to answer questions like:

- Why was this campaign paused?
- Was this reorder caused by a stockout warning or by a manual override?
- What safety-stock rule is currently active?
- Which policy was inherited from the simulation?
- Which actions were approved vs auto-executed?

---

## 4. Source-of-truth model

Live Mode should not pretend that everything is owned locally.

Instead, state should be split into three categories.

## A. Locally-owned fields

These are fields our system owns directly.

Examples:
- mode (`shadow` / `live`)
- policy thresholds
- approval states
- internal warnings
- agent decisions and rationale
- automation rules
- simulation-derived operating parameters

## B. Externally-owned fields

These are fields owned by external systems and mirrored locally.

Examples:
- product ids
- variant ids
- actual inventory from commerce system
- actual campaign spend
- actual order counts
- actual revenue receipts
- shipment status

## C. Derived fields

These are fields computed by our system from local + external data.

Examples:
- cash runway
- net profit estimate
- reorder urgency
- CAC alert state
- margin compression alert
- whether a policy threshold has been violated

---

## 5. How sync should work

The mental model is:

1. local system records intent
2. action goes through Live adapter
3. external API returns result
4. local state model records external ids / outcomes
5. background reads or refreshes keep reconciling real status

In other words:

> intent first, execution second, reconciliation always

---

## 6. The three sync flows

## 6.1 Write-through flow

When an agent wants to do something real, the system should first create a local action record.

Example:
- Ads Agent wants to launch a campaign with $50/day

Flow:
1. create local action record
2. mark as pending / awaiting approval if needed
3. execute through `AdapterLive`
4. store external object ids and result payload
5. update local state snapshot

Why this matters:
- we retain auditability
- we do not lose intent if the external API partially fails
- we can reason about what was attempted

## 6.2 Pull-sync flow

At regular intervals, or before major decisions, the system should refresh selected external data.

Examples:
- current spend
- current orders
- current inventory
- fulfillment state
- payment settlement state

Why this matters:
- external systems can change outside our immediate write path
- we need periodic re-alignment with reality

## 6.3 Event / webhook flow

Later, if external systems support webhooks or events, those should update the local mirror more quickly.

Examples:
- new order webhook
- refund webhook
- inventory changed webhook
- ad status webhook

This is not required for v0.1, but it is a strong future direction.

---

## 7. Practical reconciliation rule

Do not chase perfect strong consistency everywhere.

For the first live version, the goal should be:

> **useful operational consistency**

That means:
- important numbers stay reasonably aligned
- conflicts can be detected
- stale data can be refreshed
- agents do not operate on obviously broken assumptions

This is much more achievable than trying to mirror every external field in real time.

---

## 8. What should happen when local and external state disagree

Disagreement is normal.
The system must treat it as a first-class case.

### Example mismatch cases
- local inventory says 120, external says 97
- local campaign status says active, external says rejected
- local order count says 23, external says 26
- local reorder marked executed, external PO never got created

### First response rule
When mismatch is detected:
1. record a reconciliation warning
2. mark affected objects as out-of-sync
3. prefer external truth for externally-owned fields
4. preserve local decision history instead of deleting it
5. ask for human review if the mismatch affects money, orders, or irreversible actions

---

## 9. Suggested state additions for Live Mode

The current `state-model.md` is still mostly Shadow-oriented.
For Live Mode, we will likely need extra metadata fields such as:

```yaml
sync:
  last_full_refresh_at: timestamp
  sync_status: healthy | stale | conflict
  conflicts: []

external_refs:
  shopify_product_id: string
  shopify_variant_id: string
  ads_campaign_ids: []
  payment_account_ref: string

actions:
  pending_actions: []
  completed_actions: []
  failed_actions: []

reconciliation:
  external_inventory_units: integer
  external_revenue_usd: number
  external_ad_spend_usd: number
  last_reconciled_at: timestamp
```

These do not need to be fully implemented yet, but they are the likely extension path.

---

## 10. Example: product launch handoff into Live Mode

Suppose the simulation produced a winning operating plan:

- product price: $119
- safety stock: 100
- reorder point: 40
- creative style: minimal premium
- initial ad budget: $50/day
- stop-loss rule: pause if CAC exceeds threshold for 3 days

When switching to Live Mode:

1. system generates a structured deployment plan
2. user reviews and approves it
3. product is created in real system
4. external ids are written back into local state
5. campaigns are created in real system
6. real spend / orders / inventory begin flowing back in
7. local state remains the unified operational mirror

The internal state model still matters because it stores:
- inherited policy
- decision rationale
- thresholds
- internal warnings
- full run continuity across systems

---

## 11. Main design principle

In Live Mode:

> **the internal state model should not try to replace real systems**

It should instead act as:

- the orchestration memory
- the policy layer
- the cross-system mirror
- the reconciliation ledger
- the audit surface

That is the right mental model.

---

## 12. Main takeaway

The question is not:

> “Can the state model still be used after real APIs are involved?”

The better question is:

> “What role should the state model play once reality becomes the source of truth?”

The answer is:

> In Shadow Mode, the state model is the world.
> In Live Mode, the state model becomes the world’s digital twin and control ledger.

That is why it remains necessary in both phases.
