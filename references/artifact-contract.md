# Kosbling Sim2Real OS — Artifact Contract

Status: Current reference for v0.1 / Layer 0  
Date: 2026-03-24

---

## 1. Purpose

This document defines the minimum boss-facing artifact outputs for Layer 0.

The product is not just state transitions.
The user experiences the system through staged updates and recap artifacts.

---

## 2. Required artifact types

Layer 0 should support at least:
- market snapshot
- stage/chunk update
- final battle report

Optional later artifacts can exist, but these three are the minimum product surface.

Current implementation note:
- a per-chunk `team trace` markdown artifact may also be emitted to show role proposals, CEO merge rationale, execution order, and execution results

---

## 3. Market snapshot contract

Purpose:
- translate scenario + grounding into an initial commerce picture
- help the user decide whether to start, adjust, or switch

Minimum content:
- product/category label
- market heat / trend direction
- indicative cost posture
- indicative competitive posture
- initial recommendation summary
- clear next decision options

---

## 4. Stage/chunk update contract

Purpose:
- report what happened in the last stage
- explain why it happened
- surface pressure points and next decisions

Minimum content:
- stage/day range
- orders
- revenue
- spend / cost posture
- balance snapshot
- inventory snapshot
- biggest win
- biggest risk
- what changed from last stage
- suggested next options or explicit decision point

Strongly recommended:
- best-performing channel
- best-performing creative
- one-sentence explanation from CEO / team voice

Current implementation note:
- the chunk update may be accompanied by a separate team trace artifact so the main boss-facing update stays concise

## 4.1 Team trace artifact

Purpose:
- make multi-agent collaboration observable
- help the boss or developer understand why a chunk plan was chosen
- surface execution ordering and execution results without overloading the main chunk update

Recommended content:
- boss message for the chunk
- role-by-role summaries
- role watchouts / constraints
- final CEO merge summary
- CEO merge rationale
- approved actions
- execution order
- execution results

---

## 5. Final battle report contract

Purpose:
- conclude the run in business language
- highlight key wins, mistakes, and counterfactuals

Minimum content:
- starting budget -> ending balance
- total orders
- total revenue
- total cost
- gross profit
- best channel
- best creative or best growth lever
- biggest mistake / biggest drag
- biggest winning decision
- recommended next move

Strongly recommended:
- 2-3 key decision recap bullets
- 1-2 counterfactual bullets

---

## 6. Tone and shape

Artifacts should feel like:
- an AI commerce team briefing the boss
- chat-native
- concise but decision-useful

They should not feel like raw database dumps.

---

## 7. Summary

Layer 0 artifacts are a core part of the product contract.
They are how the user experiences the world, not just a reporting afterthought.
