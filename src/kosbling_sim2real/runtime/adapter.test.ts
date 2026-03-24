import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultScenario, createInitialWorldState } from "../helpers.js";
import type { ActionProposal } from "../domain.js";
import type { AppConfig } from "../config.js";
import {
  LiveCommerceExecutionAdapter,
  ShadowCommerceExecutionAdapter,
  ShopifyStoreExecutionAdapter,
} from "./adapter.js";

test("ShadowCommerceExecutionAdapter executes approved actions through the shadow harness", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-adapter",
    identity: { name: "Adapter Bath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-adapter", scenarioId: scenario.id, scenario, seed: 1 });
  const adapter = new ShadowCommerceExecutionAdapter();

  const results = await adapter.executeApprovedActions({
    state,
    currentDay: 1,
    actions: [
      {
        action_id: "a1",
        actor: "kos-ceo",
        domain: "marketing",
        action_type: "set_total_budget",
        target_type: "budget",
        target_ref: null,
        reason: "Test budget",
        payload: { total_daily_budget: 120 },
        risk_level: "low",
        expected_effect: null,
      } satisfies ActionProposal,
    ],
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.mode, "shadow");
  assert.equal(state.marketing.total_daily_budget, 120);
});

test("LiveCommerceExecutionAdapter throws until real provider adapters are bound", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-live-adapter",
    identity: { name: "Live Bath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-live-adapter", scenarioId: scenario.id, scenario, seed: 1 });
  const adapter = new LiveCommerceExecutionAdapter({
    cwd: "/tmp/kosbling-live-adapter",
    runsDir: "/tmp/kosbling-live-adapter/runs",
    locale: "en-US",
    defaultGeo: "US",
    enableGoogleTrends: false,
    executionMode: "live",
  });

  await assert.rejects(
    () => adapter.executeApprovedActions({ state, currentDay: 1, actions: [] }),
    /requires Shopify store configuration/,
  );
});

test("ShopifyStoreExecutionAdapter updates price remotely and mirrors shadow state", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-shopify-price",
    identity: { name: "Shopify Bath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    business: {
      product_name: "Cold Plunge Tub",
      product_category: "Recovery",
      positioning: "Premium cold therapy recovery tub",
      initial_price: 899,
      unit_cost: 350,
    },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-shopify-price", scenarioId: scenario.id, scenario, seed: 1 });
  const calls: Array<{ url: string; body: string }> = [];
  const adapter = new ShopifyStoreExecutionAdapter(shopifyConfig(), async (input, init) => {
    calls.push({ url: String(input), body: String(init?.body ?? "") });
    return new Response(
      JSON.stringify({
        data: {
          productVariantsBulkUpdate: {
            productVariants: [{ id: "gid://shopify/ProductVariant/456", price: "849.00" }],
            userErrors: [],
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  });

  const results = await adapter.executeApprovedActions({
    state,
    currentDay: 5,
    actions: [
      {
        action_id: "a-price",
        actor: "kos-executor",
        domain: "product",
        action_type: "adjust_price",
        target_type: "product",
        target_ref: null,
        reason: "Match premium competitor pricing.",
        payload: { new_price: 849 },
        risk_level: "medium",
        expected_effect: "Improve conversion.",
      } satisfies ActionProposal,
    ],
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0]?.url ?? "", /example\.myshopify\.com\/admin\/api\/2025-10\/graphql\.json$/);
  assert.match(calls[0]?.body ?? "", /productVariantsBulkUpdate/);
  assert.match(calls[0]?.body ?? "", /849\.00/);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.status, "completed");
  assert.equal(results[0]?.mode, "live");
  assert.deepEqual(results[0]?.external_refs, ["gid://shopify/ProductVariant/456"]);
  assert.equal(state.product.price, 849);
});

test("ShopifyStoreExecutionAdapter marks unsupported actions as failed without mutating state", async () => {
  const scenario = createDefaultScenario({
    id: "scenario-shopify-unsupported",
    identity: { name: "Unsupported Bath", category: "Recovery", target_market: "Cold therapy shoppers", region: "North America" },
    budget: { starting_budget: 5000, reserve_cash: 500, daily_budget_cap: 80 },
    simulation: { total_days: 30, chunk_days: 5, mode: "shadow" },
  });
  const state = createInitialWorldState({ sessionId: "session-shopify-unsupported", scenarioId: scenario.id, scenario, seed: 1 });
  const adapter = new ShopifyStoreExecutionAdapter(shopifyConfig(), async () => {
    throw new Error("fetch should not be called for unsupported actions");
  });

  const results = await adapter.executeApprovedActions({
    state,
    currentDay: 5,
    actions: [
      {
        action_id: "a-budget",
        actor: "kos-executor",
        domain: "finance",
        action_type: "set_total_budget",
        target_type: "budget",
        target_ref: null,
        reason: "Raise paid spend.",
        payload: { total_daily_budget: 180 },
        risk_level: "medium",
        expected_effect: "Drive more traffic.",
      } satisfies ActionProposal,
    ],
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.status, "failed");
  assert.match(results[0]?.summary ?? "", /does not support set_total_budget/);
  assert.equal(state.marketing.total_daily_budget, 80);
});

function shopifyConfig(): NonNullable<AppConfig["shopify"]> {
  return {
    storeDomain: "example.myshopify.com",
    accessToken: "shpat_test",
    apiVersion: "2025-10",
    productId: "gid://shopify/Product/123",
    variantId: "gid://shopify/ProductVariant/456",
  };
}
