# Kosbling Sim2Real OS — Open Functional Design Questions

Status: Working draft  
Date: 2026-03-23

---

## Purpose

This document collects the major functional-design questions that are still not fully decided.

The goal is to avoid pretending the design is settled when it is not.

---

## 1. Idea and strategy

- How free-form is user input in v0.1?
- Is `strategy_frame` explicitly user-reviewable before a run starts?
- Do user revisions apply between runs only, or can they happen mid-run?
- Does each revision create a new run, a branch, or an overwrite?

## 2. Execution agents

- Are the first three agents enough, or does v0.1 also need a store/creative role?
- Is finance advisory only, or can it block actions?
- How much state context should each agent see?
- Do we eventually need a separate strategy agent, or is strategy-frame generation enough?

## 3. Simulation loop

- Is the loop strictly day-based in v0.1, or do we need special sub-steps?
- Does the user only interact before/after a run, or also at checkpoints?
- Do we support branching and comparison in early versions?

## 4. Uncertainty

- How much randomness should market simulation include initially?
- Are events purely scripted at first, or lightly stochastic?
- How much LLM variance is acceptable before runs become noisy rather than useful?

## 5. Product experience

- What should the user see before a run starts?
- What should the user see at the end of a run?
- How much explanation is enough without becoming overwhelming?
- How do we help the user separate idea problems from execution problems?

---

## Current recommendation

These questions should remain visible while the design matures.

The existence of this document is intentional: it marks uncertainty honestly instead of burying it inside supposedly final specs.
