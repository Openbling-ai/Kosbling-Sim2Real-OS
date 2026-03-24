import { randomUUID } from "node:crypto";

import type { AppConfig } from "../config.js";
import type { ActionProposal, CommerceWorldState, ExecutionResult } from "../domain.js";
import { applyActionsToState } from "./harness.js";

export interface CommerceExecutionAdapter {
  readonly mode: "shadow" | "live";
  executeApprovedActions(params: {
    state: CommerceWorldState;
    actions: ActionProposal[];
    currentDay: number;
  }): Promise<ExecutionResult[]>;
}

interface ShopifyGraphQlResponse<TData> {
  data?: TData;
  errors?: Array<{ message?: string }>;
}

interface ProductVariantsBulkUpdateResponse {
  productVariantsBulkUpdate: {
    productVariants?: Array<{ id: string; price?: string | null }>;
    userErrors?: Array<{ field?: string[] | null; message: string }>;
  };
}

export class ShadowCommerceExecutionAdapter implements CommerceExecutionAdapter {
  readonly mode = "shadow" as const;

  async executeApprovedActions(params: {
    state: CommerceWorldState;
    actions: ActionProposal[];
    currentDay: number;
  }): Promise<ExecutionResult[]> {
    return applyActionsToState(params);
  }
}

export class LiveCommerceExecutionAdapter implements CommerceExecutionAdapter {
  readonly mode = "live" as const;

  constructor(
    private readonly config: AppConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async executeApprovedActions(_params: {
    state: CommerceWorldState;
    actions: ActionProposal[];
    currentDay: number;
  }): Promise<ExecutionResult[]> {
    if (!this.config.shopify) {
      throw new Error(
        "Live execution adapter requires Shopify store configuration. Set KOSBLING_SHOPIFY_* env vars before using KOSBLING_EXECUTION_MODE=live.",
      );
    }

    const shopifyAdapter = new ShopifyStoreExecutionAdapter(this.config.shopify, this.fetchImpl);
    return shopifyAdapter.executeApprovedActions(_params);
  }
}

export function createExecutionAdapter(config: AppConfig): CommerceExecutionAdapter {
  return config.executionMode === "live"
    ? new LiveCommerceExecutionAdapter(config)
    : new ShadowCommerceExecutionAdapter();
}

export class ShopifyStoreExecutionAdapter implements CommerceExecutionAdapter {
  readonly mode = "live" as const;

  constructor(
    private readonly shopify: NonNullable<AppConfig["shopify"]>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async executeApprovedActions(params: {
    state: CommerceWorldState;
    actions: ActionProposal[];
    currentDay: number;
  }): Promise<ExecutionResult[]> {
    const liveResults: ExecutionResult[] = [];
    const appliedActions: ActionProposal[] = [];

    for (const action of params.actions) {
      const result = action.action_type === "adjust_price"
        ? await this.executeAdjustPrice(action)
        : this.createUnsupportedResult(action);

      if (result.status === "completed") {
        appliedActions.push(action);
      }
      liveResults.push(result);
    }

    if (appliedActions.length === 0) {
      return liveResults;
    }

    const shadowResults = applyActionsToState({
      state: params.state,
      actions: appliedActions,
      currentDay: params.currentDay,
    });
    const shadowByActionId = new Map(shadowResults.map((result) => [result.action_id, result] as const));

    return liveResults.map((result) => {
      const mirrored = shadowByActionId.get(result.action_id);
      if (!mirrored) {
        return result;
      }

      return {
        ...result,
        summary: [result.summary, ...mirrored.applied_effects].join(" ").trim(),
        applied_effects: mirrored.applied_effects,
      };
    });
  }

  private async executeAdjustPrice(action: Extract<ActionProposal, { action_type: "adjust_price" }>): Promise<ExecutionResult> {
    try {
      const response = await this.shopifyGraphQl<ProductVariantsBulkUpdateResponse>({
        query: `
          mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants {
                id
                price
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          productId: toShopifyGid("Product", this.shopify.productId),
          variants: [
            {
              id: toShopifyGid("ProductVariant", this.shopify.variantId),
              price: action.payload.new_price.toFixed(2),
            },
          ],
        },
      });
      const userErrors = response.productVariantsBulkUpdate.userErrors ?? [];
      if (userErrors.length > 0) {
        return this.createFailureResult(
          action,
          userErrors.map((error) => [error.field?.join("."), error.message].filter(Boolean).join(": ")).join("; "),
        );
      }

      const updatedVariant = response.productVariantsBulkUpdate.productVariants?.[0];
      return {
        execution_id: randomUUID(),
        action_id: action.action_id,
        status: "completed",
        mode: "live",
        summary: `Updated Shopify variant price to ${action.payload.new_price.toFixed(2)}.`,
        applied_effects: [],
        external_refs: [updatedVariant?.id ?? toShopifyGid("ProductVariant", this.shopify.variantId)],
      };
    } catch (error) {
      return this.createFailureResult(action, error instanceof Error ? error.message : "Unknown Shopify API error");
    }
  }

  private createUnsupportedResult(action: ActionProposal): ExecutionResult {
    return {
      execution_id: randomUUID(),
      action_id: action.action_id,
      status: "failed",
      mode: "live",
      summary: `ShopifyStoreExecutionAdapter does not support ${action.action_type}.`,
      applied_effects: [],
      external_refs: [],
    };
  }

  private createFailureResult(action: ActionProposal, detail: string): ExecutionResult {
    return {
      execution_id: randomUUID(),
      action_id: action.action_id,
      status: "failed",
      mode: "live",
      summary: `Shopify action ${action.action_type} failed: ${detail}`,
      applied_effects: [],
      external_refs: [],
    };
  }

  private async shopifyGraphQl<TData>(params: {
    query: string;
    variables: Record<string, unknown>;
  }): Promise<TData> {
    const response = await this.fetchImpl(shopifyGraphQlUrl(this.shopify.storeDomain, this.shopify.apiVersion), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.shopify.accessToken,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as ShopifyGraphQlResponse<TData>;
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message ?? "Unknown GraphQL error").join("; "));
    }
    if (!payload.data) {
      throw new Error("Shopify response did not include data.");
    }

    return payload.data;
  }
}

function toShopifyGid(resource: "Product" | "ProductVariant" | "InventoryItem" | "Location", id: string): string {
  return id.startsWith("gid://") ? id : `gid://shopify/${resource}/${id}`;
}

function shopifyGraphQlUrl(storeDomain: string, apiVersion: string): string {
  const normalizedDomain = storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${normalizedDomain}/admin/api/${apiVersion}/graphql.json`;
}
