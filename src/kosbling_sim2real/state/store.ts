import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { GroundingSnapshot } from "../grounding/google-trends.js";
import type { ChunkExecution } from "../runtime/engine.js";
import type { CommerceWorldState, Scenario } from "../domain.js";

export interface PersistedRun {
  runId: string;
  scenario: Scenario;
  grounding: GroundingSnapshot;
  state: CommerceWorldState;
  chunkHistory: ChunkExecution[];
}

export function createRunId(): string {
  return `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

export function getRunDirectory(runsDir: string, runId: string): string {
  return path.join(runsDir, runId);
}

export function saveRunRecord(runsDir: string, run: PersistedRun): void {
  const runDir = getRunDirectory(runsDir, run.runId);
  mkdirSync(runDir, { recursive: true });
  writeJsonAtomic(path.join(runDir, "run.json"), run);
  writeJson(path.join(runDir, "scenario.json"), run.scenario);
  writeJson(path.join(runDir, "grounding.json"), run.grounding);
  writeJson(path.join(runDir, "state.json"), run.state);
  writeJson(path.join(runDir, "chunks.json"), run.chunkHistory);
}

export function saveArtifactMarkdown(runsDir: string, runId: string, filename: string, content: string): void {
  const runDir = getRunDirectory(runsDir, runId);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(path.join(runDir, filename), content, "utf8");
}

export function loadRunRecord(runsDir: string, runId: string): PersistedRun {
  const runDir = getRunDirectory(runsDir, runId);
  return readJson(path.join(runDir, "run.json")) as PersistedRun;
}

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function writeJsonAtomic(filePath: string, value: unknown): void {
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf8");
  renameSync(tempPath, filePath);
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}
