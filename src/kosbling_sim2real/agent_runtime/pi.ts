import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getModel, Type, type Static } from "@mariozechner/pi-ai";
import {
  AuthStorage,
  createAgentSession,
  createExtensionRuntime,
  type CreateAgentSessionOptions,
  type ToolDefinition,
  ModelRegistry,
  SessionManager,
  SettingsManager,
  type ResourceLoader,
} from "@mariozechner/pi-coding-agent";

import type { AppConfig } from "../config.js";

export { Type, type Static, type ToolDefinition };

export interface PiRuntimeContext {
  authStorage: AuthStorage;
  modelRegistry: ModelRegistry;
  model: NonNullable<Awaited<ReturnType<ModelRegistry["getAvailable"]>>[number]>;
  modelLabel: string;
  modelProvider: string;
}

export interface DynamicModelsConfig {
  providers: Record<string, {
    baseUrl: string;
    api?: "anthropic-messages";
    apiKey?: string;
    models?: Array<{ id: string }>;
  }>;
}

export async function createPiRuntimeContext(config: AppConfig): Promise<PiRuntimeContext> {
  const authStorage = AuthStorage.create(path.join(config.cwd, ".kosbling-auth.json"));
  const providerName = config.provider ?? (config.modelBaseUrl ? "anthropic" : undefined);
  const modelsConfigPath = ensureModelsConfig(config, providerName);

  if (providerName && config.runtimeApiKey) {
    authStorage.setRuntimeApiKey(providerName, config.runtimeApiKey);
  }

  const modelRegistry = new ModelRegistry(authStorage, modelsConfigPath);
  let model = providerName && config.modelId ? modelRegistry.find(providerName, config.modelId) : undefined;

  if (!model && providerName && config.modelId && !config.modelBaseUrl) {
    model = getModel(providerName as never, config.modelId) ?? undefined;
  }

  if (!model) {
    const availableModels = await modelRegistry.getAvailable();
    model = availableModels[0];
  }

  if (!model) {
    throw new Error(
      "No tool-capable model is available. Set provider credentials such as OPENAI_API_KEY or ANTHROPIC_API_KEY, or set KOSBLING_MODEL_PROVIDER/KOSBLING_MODEL_ID. For Anthropic-compatible gateways, also set KOSBLING_MODEL_BASE_URL.",
    );
  }

  return {
    authStorage,
    modelRegistry,
    model,
    modelLabel: `${model.provider}/${model.id}`,
    modelProvider: model.provider,
  };
}

function ensureModelsConfig(config: AppConfig, providerName: string | undefined): string | undefined {
  if (!config.modelBaseUrl || !providerName) {
    return undefined;
  }

  const modelsPath = path.join(config.cwd, ".kosbling-models.json");
  mkdirSync(path.dirname(modelsPath), { recursive: true });

  const payload = buildDynamicModelsConfig({
    providerName,
    modelBaseUrl: config.modelBaseUrl,
    ...(config.modelId ? { modelId: config.modelId } : {}),
  });

  writeFileSync(modelsPath, JSON.stringify(payload, null, 2), "utf8");
  return modelsPath;
}

export function buildDynamicModelsConfig(params: {
  providerName: string;
  modelBaseUrl: string;
  modelId?: string;
}): DynamicModelsConfig {
  return {
    providers: {
      [params.providerName]: {
        baseUrl: params.modelBaseUrl,
        ...(params.providerName === "anthropic" ? { api: "anthropic-messages" } : {}),
        ...(params.modelId ? { apiKey: "KOSBLING_MODEL_API_KEY", models: [{ id: params.modelId }] } : {}),
      },
    },
  };
}

export async function runPiToolSession<TCapture>(params: {
  config: AppConfig;
  runtime: PiRuntimeContext;
  systemPrompt: string;
  userPrompt: string;
  customTools: ToolDefinition[];
  capture: TCapture;
  isCaptureReady?: (capture: TCapture) => boolean;
  maxAttempts?: number;
  timeoutMs?: number;
}): Promise<TCapture> {
  const maxAttempts = params.maxAttempts ?? 2;
  const timeoutMs = params.timeoutMs ?? 120_000;
  let promptText = params.userPrompt;
  let lastErrorMessage = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const resourceLoader: ResourceLoader = {
      getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
      getSkills: () => ({ skills: [], diagnostics: [] }),
      getPrompts: () => ({ prompts: [], diagnostics: [] }),
      getThemes: () => ({ themes: [], diagnostics: [] }),
      getAgentsFiles: () => ({ agentsFiles: [] }),
      getSystemPrompt: () => params.systemPrompt,
      getAppendSystemPrompt: () => [],
      extendResources: () => {},
      reload: async () => {},
    };

    const sessionOptions: CreateAgentSessionOptions = {
      cwd: params.config.cwd,
      agentDir: path.join(params.config.cwd, ".pi"),
      model: params.runtime.model,
      thinkingLevel: "medium",
      authStorage: params.runtime.authStorage,
      modelRegistry: params.runtime.modelRegistry,
      resourceLoader,
      tools: [],
      customTools: params.customTools,
      sessionManager: SessionManager.inMemory(),
      settingsManager: SettingsManager.inMemory({
        compaction: { enabled: false },
        retry: { enabled: true, maxRetries: 1 },
      }),
    };

    const { session } = await createAgentSession(sessionOptions);

    try {
      await Promise.race([
        session.prompt(promptText),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Agent session timed out after ${timeoutMs}ms.`));
          }, timeoutMs);
        }),
      ]);
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
    }

    const sessionError = getSessionErrorMessage(session.state.messages.at(-1));
    if (sessionError) {
      lastErrorMessage = sessionError;
    }

    if (!lastErrorMessage && (!params.isCaptureReady || params.isCaptureReady(params.capture))) {
      return params.capture;
    }

    promptText = [
      params.userPrompt,
      "",
      "IMPORTANT: You must call one of the provided tools with valid arguments.",
      "Do not answer in plain text.",
      lastErrorMessage ? `Previous attempt failed with: ${lastErrorMessage}` : "Previous attempt did not produce a valid tool call.",
    ].join("\n");
  }

  throw new Error(lastErrorMessage || "Agent session completed without producing a valid tool result.");
}

function getSessionErrorMessage(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const candidate = message as { stopReason?: unknown; errorMessage?: unknown };
  if (candidate.stopReason === "error" && typeof candidate.errorMessage === "string" && candidate.errorMessage.length > 0) {
    return candidate.errorMessage;
  }
  return null;
}
