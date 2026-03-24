import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "./config.js";

test("loadConfig reads env overrides", () => {
  withEnv(
    {
      KOSBLING_MODEL_PROVIDER: "anthropic",
      KOSBLING_MODEL_ID: "claude-sonnet-4.6",
      KOSBLING_MODEL_API_KEY: "secret",
      KOSBLING_MODEL_BASE_URL: "https://api.example.com",
      BRAVE_WEBSEARCH_API_KEY: "brave",
      KOSBLING_LOCALE: "en-US",
      KOSBLING_DEFAULT_GEO: "US",
    },
    () => {
      const config = loadConfig("/tmp/kosbling-config-test");

      assert.equal(config.provider, "anthropic");
      assert.equal(config.modelId, "claude-sonnet-4.6");
      assert.equal(config.runtimeApiKey, "secret");
      assert.equal(config.modelBaseUrl, "https://api.example.com");
      assert.equal(config.braveSearchApiKey, "brave");
      assert.equal(config.locale, "en-US");
      assert.equal(config.defaultGeo, "US");
    },
  );
});

test("loadConfig reads Shopify live adapter env overrides", () => {
  withEnv(
    {
      KOSBLING_EXECUTION_MODE: "live",
      KOSBLING_SHOPIFY_STORE_DOMAIN: "example.myshopify.com",
      KOSBLING_SHOPIFY_ACCESS_TOKEN: "shpat_test",
      KOSBLING_SHOPIFY_API_VERSION: "2025-10",
      KOSBLING_SHOPIFY_PRODUCT_ID: "gid://shopify/Product/123",
      KOSBLING_SHOPIFY_VARIANT_ID: "gid://shopify/ProductVariant/456",
      KOSBLING_SHOPIFY_INVENTORY_ITEM_ID: "gid://shopify/InventoryItem/789",
      KOSBLING_SHOPIFY_LOCATION_ID: "gid://shopify/Location/321",
    },
    () => {
      const config = loadConfig("/tmp/kosbling-config-test-shopify");

      assert.equal(config.executionMode, "live");
      assert.equal(config.shopify?.storeDomain, "example.myshopify.com");
      assert.equal(config.shopify?.accessToken, "shpat_test");
      assert.equal(config.shopify?.apiVersion, "2025-10");
      assert.equal(config.shopify?.productId, "gid://shopify/Product/123");
      assert.equal(config.shopify?.variantId, "gid://shopify/ProductVariant/456");
      assert.equal(config.shopify?.inventoryItemId, "gid://shopify/InventoryItem/789");
      assert.equal(config.shopify?.locationId, "gid://shopify/Location/321");
    },
  );
});

function withEnv(overrides: Record<string, string>, fn: () => void): void {
  const previous = new Map<string, string | undefined>();

  for (const key of [
    "KOSBLING_MODEL_PROVIDER",
    "KOSBLING_MODEL_ID",
    "KOSBLING_MODEL_API_KEY",
    "KOSBLING_MODEL_BASE_URL",
    "BRAVE_WEBSEARCH_API_KEY",
    "KOSBLING_LOCALE",
    "KOSBLING_DEFAULT_GEO",
    "KOSBLING_EXECUTION_MODE",
    "KOSBLING_SHOPIFY_STORE_DOMAIN",
    "KOSBLING_SHOPIFY_ACCESS_TOKEN",
    "KOSBLING_SHOPIFY_API_VERSION",
    "KOSBLING_SHOPIFY_PRODUCT_ID",
    "KOSBLING_SHOPIFY_VARIANT_ID",
    "KOSBLING_SHOPIFY_INVENTORY_ITEM_ID",
    "KOSBLING_SHOPIFY_LOCATION_ID",
  ]) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  Object.assign(process.env, overrides);

  try {
    fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
