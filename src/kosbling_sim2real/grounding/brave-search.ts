import type { AppConfig } from "../config.js";

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  extraSnippets: string[];
}

export interface BraveSearchSnapshot {
  query: string;
  results: BraveSearchResult[];
}

interface BraveWebResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      extra_snippets?: string[];
    }>;
  };
}

export class BraveSearchProvider {
  constructor(private readonly config: AppConfig) {}

  async search(query: string, freshness = "pm"): Promise<BraveSearchSnapshot | null> {
    if (!this.config.braveSearchApiKey) {
      return null;
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("freshness", freshness);
    url.searchParams.set("search_lang", languageFromLocale(this.config.locale));
    url.searchParams.set("country", this.config.defaultGeo);
    url.searchParams.set("extra_snippets", "true");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.config.braveSearchApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search failed with HTTP ${response.status}`);
    }

    const payload = await response.json() as BraveWebResponse;
    const results = (payload.web?.results ?? [])
      .filter((item) => item.title && item.url)
      .map((item) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        description: item.description ?? "",
        extraSnippets: item.extra_snippets ?? [],
      }));

    return {
      query,
      results,
    };
  }
}

function languageFromLocale(locale: string): string {
  const [language] = locale.split("-");
  return language || "en";
}
