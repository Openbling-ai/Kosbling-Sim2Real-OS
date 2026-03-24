import { mkdirSync } from "node:fs";
import path from "node:path";

export interface AppConfig {
  cwd: string;
  runsDir: string;
  locale: string;
  defaultGeo: string;
  executionMode: "shadow" | "live";
  shopify?: {
    storeDomain: string;
    accessToken: string;
    apiVersion: string;
    productId: string;
    variantId: string;
    inventoryItemId?: string;
    locationId?: string;
  };
  provider?: string;
  modelId?: string;
  runtimeApiKey?: string;
  modelBaseUrl?: string;
  braveSearchApiKey?: string;
}

export function loadConfig(cwd = process.cwd()): AppConfig {
  const runsDir = path.join(cwd, "runs");
  mkdirSync(runsDir, { recursive: true });
  const shopify = loadShopifyConfig();

  return {
    cwd,
    runsDir,
    locale: process.env.KOSBLING_LOCALE ?? "en-US",
    defaultGeo: process.env.KOSBLING_DEFAULT_GEO ?? "US",
    executionMode: process.env.KOSBLING_EXECUTION_MODE === "live" ? "live" : "shadow",
    ...(shopify ? { shopify } : {}),
    ...(process.env.KOSBLING_MODEL_PROVIDER ? { provider: process.env.KOSBLING_MODEL_PROVIDER } : {}),
    ...(process.env.KOSBLING_MODEL_ID ? { modelId: process.env.KOSBLING_MODEL_ID } : {}),
    ...(process.env.KOSBLING_MODEL_API_KEY ? { runtimeApiKey: process.env.KOSBLING_MODEL_API_KEY } : {}),
    ...(process.env.KOSBLING_MODEL_BASE_URL ? { modelBaseUrl: process.env.KOSBLING_MODEL_BASE_URL } : {}),
    ...(process.env.BRAVE_WEBSEARCH_API_KEY ? { braveSearchApiKey: process.env.BRAVE_WEBSEARCH_API_KEY } : {}),
  };
}

function loadShopifyConfig(): AppConfig["shopify"] | undefined {
  const storeDomain = process.env.KOSBLING_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.KOSBLING_SHOPIFY_ACCESS_TOKEN;
  const productId = process.env.KOSBLING_SHOPIFY_PRODUCT_ID;
  const variantId = process.env.KOSBLING_SHOPIFY_VARIANT_ID;

  if (!storeDomain || !accessToken || !productId || !variantId) {
    return undefined;
  }

  return {
    storeDomain,
    accessToken,
    apiVersion: process.env.KOSBLING_SHOPIFY_API_VERSION ?? "2025-10",
    productId,
    variantId,
    ...(process.env.KOSBLING_SHOPIFY_INVENTORY_ITEM_ID ? { inventoryItemId: process.env.KOSBLING_SHOPIFY_INVENTORY_ITEM_ID } : {}),
    ...(process.env.KOSBLING_SHOPIFY_LOCATION_ID ? { locationId: process.env.KOSBLING_SHOPIFY_LOCATION_ID } : {}),
  };
}
