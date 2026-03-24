import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createPiRuntimeContext } from "../agent_runtime/pi.js";
import { buildOpenHandoffs, buildRecentTeamMemory } from "../agent_runtime/team-memory.js";
import { createDefaultActionOrchestrator } from "../agent_runtime/team.js";
import { ExecutionAgent } from "../agent_runtime/executor.js";
import type { AppConfig } from "../config.js";
import type { CommerceWorldState, Scenario } from "../domain.js";
import { createInitialWorldState } from "../helpers.js";
import { GoogleTrendsGroundingProvider, type GroundingSnapshot } from "../grounding/google-trends.js";
import { createChunkArtifact, createFinalArtifact, createMarketSnapshotArtifact, attachArtifact, executeStage, initializeStateFromGrounding, type ChunkExecution } from "../runtime/engine.js";
import { createExecutionAdapter } from "../runtime/adapter.js";
import { applyEventsToState } from "../runtime/harness.js";
import { buildScenarioFromIdea } from "../scenario/service.js";
import { createRunId, loadRunRecord, saveArtifactMarkdown, saveRunRecord, type PersistedRun } from "../state/store.js";
import { renderChunkUpdate, renderFinalBattleReport, renderMarketSnapshot, renderTeamTrace } from "../artifacts/render.js";
import { getI18n } from "../i18n.js";

export async function runCliApp(config: AppConfig, args: string[]): Promise<void> {
  const rl = createInterface({ input, output });
  const t = getI18n(config.locale);

  try {
    const resumeIndex = args.findIndex((arg) => arg === "--resume");
    if (resumeIndex >= 0) {
      const runId = args[resumeIndex + 1];
      if (!runId) {
        throw new Error(t.missingResumeId);
      }
      await resumeRun({ config, runId, rl });
      return;
    }

    await startNewRun({ config, rl });
  } finally {
    rl.close();
  }
}

async function startNewRun(params: {
  config: AppConfig;
  rl: ReturnType<typeof createInterface>;
}): Promise<void> {
  const runtime = await createPiRuntimeContext(params.config);
  const { ceo } = createDefaultActionOrchestrator(params.config, runtime);
  const groundingProvider = new GoogleTrendsGroundingProvider(params.config);
  const t = getI18n(params.config.locale);

  console.log(t.appTitle);
  console.log(t.activeModel(runtime.modelLabel));
  console.log("");

  const idea = await ask(params.rl, t.ideaPrompt);
  console.log(t.logScenarioIntake);
  const scenario = await buildScenarioFromIdea({
    ceo,
    idea,
    askUser: (question) => ask(params.rl, t.kosFollowUp(question)),
  });
  const runId = createRunId();
  const prepared = await prepareScenarioRun({
    config: params.config,
    groundingProvider,
    scenario,
    runId,
  });
  let activeScenario = prepared.scenario;
  let activeGrounding = prepared.grounding;
  let activeState = prepared.state;

  let snapshotMarkdown = prepared.snapshotMarkdown;
  persistRun(params.config, prepared.run, "market-snapshot.md", snapshotMarkdown);
  console.log("");
  console.log(snapshotMarkdown);
  console.log("");
  console.log(t.runId(runId));

  while (true) {
    const preflight = await ask(params.rl, t.preflightPrompt);
    if (isStartCommand(preflight)) {
      break;
    }
    if (isExitCommand(preflight)) {
      activeState.meta.status = "paused";
      persistRun(
        params.config,
        {
          runId,
          scenario: activeScenario,
          grounding: activeGrounding,
          state: activeState,
          chunkHistory: [],
        },
        "market-snapshot.md",
        snapshotMarkdown,
      );
      console.log(t.paused(runId));
      return;
    }

    const refinedIdea = `${idea}\nBoss pre-launch adjustment: ${preflight}`;
    activeScenario = await buildScenarioFromIdea({
      ceo,
      idea: refinedIdea,
      askUser: (question) => ask(params.rl, t.kosFollowUp(question)),
    });
    const nextPrepared = await prepareScenarioRun({
      config: params.config,
      groundingProvider,
      scenario: activeScenario,
      runId,
    });
    activeGrounding = nextPrepared.grounding;
    activeState = nextPrepared.state;
    snapshotMarkdown = nextPrepared.snapshotMarkdown;
    persistRun(params.config, nextPrepared.run, "market-snapshot.md", snapshotMarkdown);
    console.log("");
    console.log(snapshotMarkdown);
    console.log("");
  }

  await continueRunLoop({
    config: params.config,
    rl: params.rl,
    runtime,
    scenario: activeScenario,
    grounding: activeGrounding,
    state: activeState,
    runId,
    chunkHistory: [],
    launchFromSnapshot: true,
  });
}

async function resumeRun(params: {
  config: AppConfig;
  runId: string;
  rl: ReturnType<typeof createInterface>;
}): Promise<void> {
  const runtime = await createPiRuntimeContext(params.config);
  const run = loadRunRecord(params.config.runsDir, params.runId);
  const t = getI18n(params.config.locale);

  console.log(t.resuming(params.runId));
  console.log(t.activeModel(runtime.modelLabel));
  console.log(t.currentDay(run.state.meta.current_day));
  console.log("");

  await continueRunLoop({
    config: params.config,
    rl: params.rl,
    runtime,
    scenario: run.scenario,
    grounding: run.grounding,
    state: run.state,
    runId: run.runId,
    chunkHistory: run.chunkHistory,
  });
}

async function continueRunLoop(params: {
  config: AppConfig;
  rl: ReturnType<typeof createInterface>;
  runtime: Awaited<ReturnType<typeof createPiRuntimeContext>>;
  scenario: Scenario;
  grounding: GroundingSnapshot;
  state: CommerceWorldState;
  runId: string;
  chunkHistory: ChunkExecution[];
  launchFromSnapshot?: boolean;
}): Promise<void> {
  const { ceo, orchestrator } = createDefaultActionOrchestrator(params.config, params.runtime);
  const executionAgent = new ExecutionAgent(params.config, params.runtime, createExecutionAdapter(params.config));
  const t = getI18n(params.config.locale);

  while (params.state.meta.current_day < params.scenario.simulation.total_days) {
    const stageStartDay = params.state.meta.current_day + 1;
    const stageEndDay = Math.min(
      params.scenario.simulation.total_days,
      params.state.meta.current_day + params.scenario.simulation.chunk_days,
    );
    const chunkNumber = params.chunkHistory.length + 1;
    console.log(t.logChunkStart(chunkNumber, stageStartDay, stageEndDay));

    const bossMessage = shouldAutoStartFirstChunk(params, stageStartDay)
      ? ""
      : await ask(
        params.rl,
        stageStartDay === 1
          ? t.firstChunkPrompt
          : t.nextChunkPrompt(stageStartDay, stageEndDay),
      );

    if (isExitCommand(bossMessage)) {
      params.state.meta.status = "paused";
      saveRunRecord(params.config.runsDir, {
        runId: params.runId,
        scenario: params.scenario,
        grounding: params.grounding,
        state: params.state,
        chunkHistory: params.chunkHistory,
      });
      console.log(t.paused(params.runId));
      return;
    }

    const normalizedBossMessage = normalizeBossMessage(bossMessage, stageStartDay, params.config.locale);
    const openHandoffs = buildOpenHandoffs(params.chunkHistory, chunkNumber);
    const recentTeamMemory = buildRecentTeamMemory({
      chunkHistory: params.chunkHistory,
      locale: params.config.locale,
      openHandoffs,
    });
    console.log(t.logPlanningStart);
    const actionPlan = await orchestrator.proposeActions({
      state: params.state,
      bossMessage: normalizedBossMessage,
      stageStartDay,
      stageEndDay,
      recentTeamMemory,
      openHandoffs,
      onRoleStart: (role) => {
        console.log(t.logRoleStart(role.label));
      },
      onRoleDone: (plan) => {
        console.log(t.logRoleDone(plan.roleLabel, plan.actions.length, plan.watchouts.length, plan.handoffs.length));
      },
      onRoleError: (role, error) => {
        console.log(t.logRoleFailed(role.label, error.message));
      },
    });
    console.log(t.logPlanningDone(actionPlan.rolePlans.length, actionPlan.actions.length));
    console.log(t.logExecutionStart(actionPlan.actions.length));
    const execution = await executionAgent.executeApprovedActions({
      state: params.state,
      actions: actionPlan.actions,
      currentDay: params.state.meta.current_day,
      bossMessage: normalizedBossMessage,
    });
    console.log(t.logExecutionDone(execution.results.length));

    console.log(t.logEventsStart);
    const eventPlan = await ceo.generateEvents({
      state: params.state,
      actionSummary: `${actionPlan.summary} ${execution.summary}`.trim(),
      stageStartDay,
      stageEndDay,
    });
    applyEventsToState(params.state, eventPlan.events);
    console.log(t.logEventsDone(eventPlan.events.length));

    console.log(t.logSettlementStart);
    const outcome = executeStage({
      state: params.state,
      stageStartDay,
      stageEndDay,
    });
    console.log(t.logSettlementDone(outcome.orders, outcome.revenue));

    const artifact = createChunkArtifact({
      chunkNumber,
      stageStartDay,
      stageEndDay,
      state: params.state,
      outcome,
      actionSummary: actionPlan.summary,
      eventSummary: eventPlan.summary,
    });
    attachArtifact(params.state, artifact);

    const chunkExecution: ChunkExecution = {
      chunkNumber,
      stageStartDay,
      stageEndDay,
      bossMessage: normalizedBossMessage,
      rolePlans: actionPlan.rolePlans,
      actionSummary: actionPlan.summary,
      mergeRationale: actionPlan.rationale,
      actions: actionPlan.actions,
      executionSummary: execution.summary,
      executionActionIds: execution.actionIds,
      executionResults: execution.results,
      events: eventPlan.events,
      outcome,
      artifact,
    };
    params.chunkHistory.push(chunkExecution);
    const markdown = renderChunkUpdate(artifact, params.config.locale);
    const teamTraceMarkdown = renderTeamTrace({
      chunkNumber,
      bossMessage: normalizedBossMessage,
      rolePlans: actionPlan.rolePlans,
      roleRuns: actionPlan.roleRuns,
      actionSummary: actionPlan.summary,
      mergeRationale: actionPlan.rationale,
      actions: actionPlan.actions,
      executionSummary: execution.summary,
      executionActionIds: execution.actionIds,
      executionResults: execution.results,
      openHandoffs,
      locale: params.config.locale,
    });

    persistRun(
      params.config,
        {
          runId: params.runId,
          scenario: params.scenario,
          grounding: params.grounding,
          state: params.state,
          chunkHistory: params.chunkHistory,
        },
      `chunk-${String(chunkNumber).padStart(2, "0")}.md`,
      markdown,
    );
    saveArtifactMarkdown(params.config.runsDir, params.runId, `chunk-${String(chunkNumber).padStart(2, "0")}-team-trace.md`, teamTraceMarkdown);
    console.log(t.logArtifactsDone(chunkNumber));

    console.log("");
    console.log(markdown);
    console.log("");
  }

  params.state.meta.status = "completed";
  console.log(t.logFinalizing);
  const finalArtifact = createFinalArtifact({
    state: params.state,
    chunkHistory: params.chunkHistory,
  });
  attachArtifact(params.state, finalArtifact);
  const finalMarkdown = renderFinalBattleReport(finalArtifact, params.config.locale);

  persistRun(
    params.config,
    {
      runId: params.runId,
      scenario: params.scenario,
      grounding: params.grounding,
      state: params.state,
      chunkHistory: params.chunkHistory,
    },
    "final-battle-report.md",
    finalMarkdown,
  );

  console.log(finalMarkdown);
}

async function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  const answer = await rl.question(`${question}\n> `);
  return answer.trim();
}

function normalizeBossMessage(message: string, stageStartDay: number, locale: string): string {
  if (!message || isStartCommand(message) || isContinueCommand(message)) {
    const t = getI18n(locale);
    return stageStartDay === 1
      ? t.defaultStartBossMessage
      : t.defaultContinueBossMessage;
  }
  return message;
}

function isExitCommand(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === "exit" || normalized === "quit" || normalized === "pause" || normalized === "退出" || normalized === "暂停";
}

function isStartCommand(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === "start" || normalized === "开始";
}

function isContinueCommand(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === "continue" || normalized === "继续";
}

function persistRun(config: AppConfig, run: PersistedRun, artifactFile: string, artifactMarkdown: string): void {
  saveRunRecord(config.runsDir, run);
  saveArtifactMarkdown(config.runsDir, run.runId, artifactFile, artifactMarkdown);
}

export function shouldAutoStartFirstChunk(
  params: {
    launchFromSnapshot?: boolean;
    state: CommerceWorldState;
    chunkHistory: ChunkExecution[];
  },
  stageStartDay: number,
): boolean {
  return Boolean(params.launchFromSnapshot)
    && params.state.meta.current_day === 0
    && params.chunkHistory.length === 0
    && stageStartDay === 1;
}

async function prepareScenarioRun(params: {
  config: AppConfig;
  groundingProvider: GoogleTrendsGroundingProvider;
  scenario: Scenario;
  runId: string;
}): Promise<{
  scenario: Scenario;
  grounding: GroundingSnapshot;
  state: CommerceWorldState;
  snapshotMarkdown: string;
  run: PersistedRun;
}> {
  const t = getI18n(params.config.locale);
  console.log(t.logGroundingStart);
  const grounding = await params.groundingProvider.groundScenario(params.scenario);
  console.log(t.logGroundingDone(grounding.source));
  const state = createInitialWorldState({
    sessionId: randomUUID(),
    scenarioId: params.scenario.id,
    scenario: params.scenario,
    seed: Date.now(),
  });
  initializeStateFromGrounding(state, params.scenario, grounding);
  const marketSnapshot = createMarketSnapshotArtifact({ scenario: params.scenario, grounding });
  attachArtifact(state, marketSnapshot);
  const snapshotMarkdown = renderMarketSnapshot(marketSnapshot, params.config.locale);

  return {
    scenario: params.scenario,
    grounding,
    state,
    snapshotMarkdown,
    run: {
      runId: params.runId,
      scenario: params.scenario,
      grounding,
      state,
      chunkHistory: [],
    },
  };
}
