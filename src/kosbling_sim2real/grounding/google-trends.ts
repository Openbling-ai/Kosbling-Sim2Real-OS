import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { trends } from "google-trends-api-client";

import type { AppConfig } from "../config.js";
import type { Scenario } from "../domain.js";
import { roundTo } from "../helpers.js";
import { BraveSearchProvider, type BraveSearchSnapshot } from "./brave-search.js";

export interface GroundingSnapshot {
  source: "google-trends+brave" | "brave-web";
  query: string;
  geo: string;
  trendsScore: number | null;
  trendsDirection: "up" | "flat" | "down" | null;
  seasonalFactor: number | null;
  topRegions: string[];
  relatedQueries: string[];
  relatedTopics: string[];
  competitivePosture: string;
  indicativeCostPosture: string;
  webContext: Array<{ title: string; url: string; note: string }>;
}

export class GroundingError extends Error {}

export class GoogleTrendsGroundingProvider {
  private readonly braveSearch: BraveSearchProvider;

  constructor(private readonly config: AppConfig) {
    this.braveSearch = new BraveSearchProvider(config);
  }

  async groundScenario(scenario: Scenario): Promise<GroundingSnapshot> {
    const query = scenario.grounding.query ?? scenario.business.product_name ?? scenario.identity.name;
    const geo = inferGeo(scenario.identity.region, this.config.defaultGeo);
    const cached = this.readCache(query, geo);
    if (cached) {
      return cached;
    }

    const braveSnapshot = await this.buildWebContext(query);
    if (!this.config.enableGoogleTrends) {
      if (braveSnapshot) {
        const braveOnly = createBraveOnlySnapshot({
          query,
          geo,
          braveSnapshot,
        });
        this.writeCache(query, geo, braveOnly);
        return braveOnly;
      }
      throw new GroundingError("No grounding source is available. Configure Brave web search, or explicitly enable Google Trends best-effort grounding.");
    }

    let interest;
    try {
      interest = await trends.getInterestOverTime({
        keywords: [query],
        geo,
        time: "today 3-m",
      });
    } catch (error) {
      if (braveSnapshot) {
        const degraded = createBraveOnlySnapshot({
          query,
          geo,
          braveSnapshot,
        });
        this.writeCache(query, geo, degraded);
        return degraded;
      }
      throw new GroundingError(toGroundingMessage(error));
    }

    await delay(350);

    const queries = await trends.getRelatedQueries({
      keywords: [query],
      geo,
      time: "today 3-m",
    }).catch(() => ({ top: [], rising: [] }));

    await delay(350);

    const topics = await trends.getRelatedTopics({
      keywords: [query],
      geo,
      time: "today 3-m",
    }).catch(() => ({ top: [], rising: [] }));

    const values = interest.map((point) => point.value[0] ?? 0);
    const avgScore = values.length > 0 ? roundTo(values.reduce((sum, value) => sum + value, 0) / values.length, 2) : null;
    const recent = values.slice(-3);
    const earlier = values.slice(Math.max(0, values.length - 6), Math.max(0, values.length - 3));
    const recentAvg = recent.length > 0 ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
    const earlierAvg = earlier.length > 0 ? earlier.reduce((sum, value) => sum + value, 0) / earlier.length : recentAvg;
    const delta = recentAvg - earlierAvg;

    const topQueries = queries.top.slice(0, 5).map((item) => item.query);
    const topTopics = topics.top.slice(0, 5).map((item) => item.topic.title);
    const competitivePosture = deriveCompetitivePosture(topQueries, braveSnapshot);
    const indicativeCostPosture = deriveCostPosture(avgScore, braveSnapshot);

    const snapshot: GroundingSnapshot = {
      source: "google-trends+brave",
      query,
      geo,
      trendsScore: avgScore,
      trendsDirection: avgScore == null ? null : delta > 5 ? "up" : delta < -5 ? "down" : "flat",
      seasonalFactor: avgScore == null ? null : roundTo(0.8 + avgScore / 250, 2),
      topRegions: [],
      relatedQueries: topQueries,
      relatedTopics: topTopics,
      competitivePosture,
      indicativeCostPosture,
      webContext: braveSnapshot?.results.map((result) => ({
        title: result.title,
        url: result.url,
        note: result.description || result.extraSnippets[0] || "",
      })) ?? [],
    };

    this.writeCache(query, geo, snapshot);
    return snapshot;
  }

  private readCache(query: string, geo: string): GroundingSnapshot | null {
    const filePath = this.cachePath(query, geo);
    try {
      const raw = JSON.parse(readFileSync(filePath, "utf8")) as { savedAt: number; value: GroundingSnapshot };
      const isFresh = Date.now() - raw.savedAt < 12 * 60 * 60 * 1000;
      return isFresh ? raw.value : null;
    } catch {
      return null;
    }
  }

  private writeCache(query: string, geo: string, value: GroundingSnapshot): void {
    const dir = path.join(this.config.cwd, ".cache", "google-trends");
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.cachePath(query, geo), JSON.stringify({ savedAt: Date.now(), value }, null, 2), "utf8");
  }

  private cachePath(query: string, geo: string): string {
    const key = createHash("sha1").update(`${geo}:${query}`).digest("hex");
    return path.join(this.config.cwd, ".cache", "google-trends", `${key}.json`);
  }

  private async buildWebContext(query: string): Promise<BraveSearchSnapshot | null> {
    try {
      return await this.braveSearch.search(`${query} ecommerce competitor pricing demand`);
    } catch {
      return null;
    }
  }
}

function inferGeo(region: string | undefined, fallback: string): string {
  if (!region) {
    return fallback;
  }

  const normalized = region.toLowerCase();
  if (normalized.includes("north america") || normalized.includes("us") || normalized.includes("united states")) {
    return "US";
  }
  if (normalized.includes("canada")) {
    return "CA";
  }
  if (normalized.includes("uk") || normalized.includes("united kingdom")) {
    return "GB";
  }
  return fallback;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toGroundingMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    return "Google Trends grounding is currently rate-limited (HTTP 429). Treat it as optional enrichment, or retry later if you explicitly enabled it.";
  }
  return `Google Trends grounding failed: ${message}`;
}

function deriveCompetitivePosture(topQueries: string[], braveSnapshot: BraveSearchSnapshot | null): string {
  const resultCount = braveSnapshot?.results.length ?? 0;
  if (topQueries.length >= 4 || resultCount >= 4) {
    return "Crowded but validated demand, with multiple visible competing offers.";
  }
  if (resultCount >= 2) {
    return "Moderate competition signal with some visible market proof.";
  }
  return "Early or lightly saturated signal; demand proof is still thin.";
}

function deriveCostPosture(avgScore: number | null, braveSnapshot: BraveSearchSnapshot | null): string {
  const hasPricingSignals = Boolean(
    braveSnapshot?.results.some((result) =>
      /\$|price|pricing|cost|amazon|shopify|store/i.test(`${result.title} ${result.description} ${result.extraSnippets.join(" ")}`),
    ),
  );

  if (avgScore != null && avgScore >= 60) {
    return hasPricingSignals
      ? "Demand is warm and the web shows active commercial intent; expect pricier acquisition."
      : "Demand is warm; expect paid traffic pressure.";
  }

  return hasPricingSignals
    ? "Commercial intent is visible, but demand looks moderate enough for disciplined testing."
    : "Demand is moderate; CAC pressure should be manageable.";
}

export function createBraveOnlySnapshot(params: {
  query: string;
  geo: string;
  braveSnapshot: BraveSearchSnapshot;
}): GroundingSnapshot {
  return {
    source: "brave-web",
    query: params.query,
    geo: params.geo,
    trendsScore: null,
    trendsDirection: null,
    seasonalFactor: null,
    topRegions: [],
    relatedQueries: [],
    relatedTopics: [],
    competitivePosture: deriveCompetitivePosture([], params.braveSnapshot),
    indicativeCostPosture: deriveCostPosture(null, params.braveSnapshot),
    webContext: params.braveSnapshot.results.map((result) => ({
      title: result.title,
      url: result.url,
      note: result.description || result.extraSnippets[0] || "",
    })),
  };
}
