# Kosbling Sim2Real OS — Uncertainty and Feedback Design

Status: Draft v0.1  
Date: 2026-03-23

---

## 1. Purpose

This document defines how uncertainty should behave in the simulator and how outcomes should be explained back to the user.

It answers:
- what kinds of uncertainty are desirable
- what kinds are harmful
- how the system should expose uncertainty in results
- how the user should learn from a run

---

## 2. Core design stance

The simulator should not be fully deterministic.
That would make it too artificial.

But it also should not be arbitrarily chaotic.
That would make it useless for judgment.

So the target is:

> **bounded uncertainty** — enough randomness to feel real, but structured enough to stay interpretable.

---

## 3. Good uncertainty vs bad uncertainty

## Good uncertainty
- market performance variance
- demand fluctuation
- supplier delays
- event shocks
- modest variation in LLM decision quality

## Bad uncertainty
- hidden defaults changing across runs
- undocumented randomness in state updates
- arbitrary schema drift
- outcomes that cannot be explained afterward

---

## 4. Where uncertainty should live

Uncertainty should mainly enter through:
- market simulation
- event generation
- LLM-generated execution judgments

Uncertainty should not dominate:
- scenario loading
- strategy-frame interpretation without explanation
- state mutation rules
- artifact generation

---

## 5. User-facing feedback requirements

A useful simulator should help the user answer:
- was my idea bad?
- was my strategy bad?
- was execution bad?
- or was this mostly adverse variation?

So feedback should distinguish between:
- setup assumptions
- strategy choices
- execution decisions
- exogenous uncertainty

---

## 6. Proposed explanation frame

Each run summary should try to separate:

### A. Structural factors
What was baked into the setup?

### B. Strategic factors
What operating thesis guided decisions?

### C. Execution factors
What did the agents actually do?

### D. Uncertainty factors
What market/event variation materially affected the result?

This is much more useful than giving the user one big “here’s why you won/lost” paragraph.

---

## 7. Product implications

Because uncertainty is intentional, the simulator should eventually support:
- reruns under similar strategy
- comparison across strategy changes
- confidence language instead of fake certainty
- explanations that mention likely vs definite causes

Not all of this is required in v0.1, but the design should point this way.

---

## 8. Functional requirements

### Must have
- explicit place for uncertainty/events in run artifacts
- final summary that names uncertainty as a separate factor
- no hidden randomness in core state logic

### Should have
- seed or run metadata for partial reproducibility
- event log visible to the user
- summary wording that distinguishes “likely” from “certain”

### Not yet required
- full Monte Carlo mode
- confidence intervals everywhere
- formal statistical significance layers

---

## 9. Open questions

1. How stochastic should market simulation be in v0.1?
2. How much LLM variance is acceptable before runs stop being useful?
3. Should users rerun the same strategy multiple times to observe spread?
4. Should uncertainty be scenario-configurable from day one?

---

## 10. Current conclusion

The simulator should feel real enough to challenge user judgment, but stable enough to teach something.

That balance is one of the core product design problems, not just an implementation detail.
