import { TrendIdea } from "./types";

const GOOGLE_TRENDS_ENDPOINT =
  "https://trends.google.com/trends/api/dailytrends";

async function parseTrendsResponse(response: Response) {
  const raw = await response.text();
  const sanitized = raw.replace(/^\)\]\}',\s*/, "");
  try {
    const payload = JSON.parse(sanitized);
    return payload;
  } catch {
    throw new Error("Unable to parse Google Trends response.");
  }
}

export async function fetchTrendingTopics(region = "US"): Promise<TrendIdea[]> {
  const url = new URL(GOOGLE_TRENDS_ENDPOINT);
  url.searchParams.set("geo", region);
  url.searchParams.set("hl", "en-US");

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Trends (status: ${res.status}).`);
  }

  const data = await parseTrendsResponse(res);
  const days = data.default?.trendingSearchesDays ?? [];
  const items: TrendIdea[] = [];

  for (const day of days) {
    for (const item of day.trendingSearches ?? []) {
      const keyword = item.title?.query as string | undefined;
      if (!keyword) continue;
      const description =
        item.relatedQueries?.map((query: { query: string }) => query.query).join(", ") ??
        item.description;
      items.push({
        keyword,
        score: Number(item.formattedTraffic?.replace(/\D/g, "")) || 0,
        description,
        region,
      });
    }
  }

  return items.slice(0, 20);
}
