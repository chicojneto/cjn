import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { XMLParser } from "npm:fast-xml-parser@5";
import { classifyNews } from "../_shared/news-ai.ts";

const FEEDS = [
  { url: "https://investinglive.com/feed/", source: "investingLive", utcDate: false },
  { url: "https://br.investing.com/rss/news.rss", source: "Investing.com Brasil", utcDate: true },
  { url: "https://www.infomoney.com.br/feed/", source: "InfoMoney", utcDate: false },
  { url: "https://www.bomdiamercado.com.br/feed/", source: "Bom Dia Mercado", utcDate: false },
  { url: "https://bpmoney.com.br/feed/", source: "BP Money", utcDate: false },
] as const;
const MAX_ITEMS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type Candidate = { source: string; title: string; description: string; url: string; publishedAt: Date };
type FeedValue = string | number | { "#text"?: string } | null | undefined;

function text(value: FeedValue): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?.["#text"] ?? "";
}

function cleanHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string, forceUtc: boolean) {
  let normalized = raw.trim();
  if (forceUtc && normalized && !/(?:Z|[+-]\d{2}:?\d{2}|\b(?:GMT|UTC)\b)$/i.test(normalized)) normalized += " UTC";
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asItems(parsed: Record<string, unknown>): Record<string, FeedValue>[] {
  const rss = parsed.rss as { channel?: { item?: unknown } } | undefined;
  const feed = parsed.feed as { entry?: unknown } | undefined;
  const raw = rss?.channel?.item ?? feed?.entry ?? [];
  return (Array.isArray(raw) ? raw : [raw]).filter(Boolean) as Record<string, FeedValue>[];
}

function itemLink(item: Record<string, FeedValue>) {
  const raw = item.link;
  if (typeof raw === "object" && raw) {
    const href = (raw as Record<string, unknown>)["@_href"];
    return typeof href === "string" ? href : "";
  }
  return text(raw);
}

async function readFeed(feed: typeof FEEDS[number], parser: XMLParser, cutoff: number): Promise<Candidate[]> {
  const response = await fetch(feed.url, {
    headers: { "User-Agent": "BrewBias/1.0 (+market-news-reader)", Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const parsed = parser.parse(await response.text()) as Record<string, unknown>;
  return asItems(parsed).flatMap((item) => {
    const title = cleanHtml(text(item.title));
    const url = itemLink(item).trim();
    const rawDate = text(item.pubDate ?? item.published ?? item.updated);
    const publishedAt = parseDate(rawDate, feed.utcDate);
    const description = cleanHtml(text(item.description ?? item.summary));
    if (!title || !url || !publishedAt || publishedAt.getTime() < cutoff || publishedAt.getTime() > Date.now() + 300000) return [];
    return [{ source: feed.source, title, description: description.slice(0, 2000), url, publishedAt }];
  });
}

function statusOf(error: unknown): number | null {
  let current: unknown = error;
  for (let depth = 0; current && typeof current === "object" && depth < 6; depth += 1) {
    const value = (current as { statusCode?: unknown; status?: unknown }).statusCode ??
      (current as { status?: unknown }).status;
    if (typeof value === "number") return value;
    const message = (current as { message?: unknown }).message;
    if (typeof message === "string") {
      if (/payment_required|not enough credits|402/.test(message)) return 402;
      if (/forbidden|\b403\b/.test(message)) return 403;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method !== "POST" && req.method !== "GET") return respond({ error: "Método não permitido" }, 405);

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!backendUrl || !serviceKey || !lovableKey) return respond({ error: "Configuração do coletor indisponível" }, 500);

  const db = createClient(backendUrl, serviceKey, { auth: { persistSession: false } });
  const { data: acquired, error: lockError } = await db.rpc("acquire_news_collector");
  if (lockError) return respond({ error: lockError.message }, 500);
  if (!acquired) return respond({ status: "skipped", message: "Coletor já ativo, pausado ou executado recentemente" }, 202);

  let saved = 0;
  let discarded = 0;
  const feedErrors: string[] = [];
  let pausedReason: string | null = null;

  try {
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true, parseTagValue: false, cdataPropName: "#text" });
    const cutoff = Date.now() - ONE_DAY_MS;
    const settled = await Promise.allSettled(FEEDS.map((feed) => readFeed(feed, parser, cutoff)));
    const candidates: Candidate[] = [];
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") candidates.push(...result.value);
      else {
        const feed = FEEDS[index];
        const message = `${feed?.source ?? "Feed desconhecido"}: ${String(result.reason)}`;
        feedErrors.push(message);
        console.error("Falha no feed", message);
      }
    });

    const unique = [...new Map(candidates.map((item) => [item.url, item])).values()]
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const urls = unique.map((item) => item.url);
    const existing = new Set<string>();
    for (let index = 0; index < urls.length; index += 100) {
      const { data } = await db.from("noticias").select("url").in("url", urls.slice(index, index + 100));
      data?.forEach((row) => existing.add(row.url));
    }
    const pending = unique.filter((item) => !existing.has(item.url)).slice(0, MAX_ITEMS);

    for (const item of pending) {
      try {
        const classification = await classifyNews({ title: item.title, description: item.description }, lovableKey, req.signal);
        if (classification.relevancia === 0) {
          discarded += 1;
          continue;
        }
        const { error } = await db.from("noticias").upsert({
          fonte: item.source,
          titulo_original: item.title,
          titulo_pt: classification.titulo_pt,
          resumo: classification.resumo,
          ativos: classification.ativos,
          relevancia: classification.relevancia,
          url: item.url,
          publicado_em: item.publishedAt.toISOString(),
        }, { onConflict: "url", ignoreDuplicates: true });
        if (error) throw error;
        saved += 1;
      } catch (error) {
        const status = statusOf(error);
        console.error("Falha ao classificar notícia", item.url, String(error));
        if (status === 402 || status === 403) {
          pausedReason = String(error).slice(0, 500);
          break;
        }
        if (status === 429 || (status != null && status >= 500)) break;
      }
    }

    await db.from("noticias").delete().lt("publicado_em", new Date(Date.now() - 7 * ONE_DAY_MS).toISOString());
    await db.from("news_collector_state").update({
      status: pausedReason ? "paused" : "ready",
      locked_until: null,
      pause_reason: pausedReason,
      last_finished_at: new Date().toISOString(),
      last_success_at: pausedReason ? undefined : new Date().toISOString(),
      processed_count: saved,
      updated_at: new Date().toISOString(),
    }).eq("id", true);

    return respond({ status: pausedReason ? "paused" : "ok", saved, discarded, candidates: pending.length, feedErrors });
  } catch (error) {
    console.error("Falha no coletor", error);
    await db.from("news_collector_state").update({ status: "ready", locked_until: null, last_finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", true);
    return respond({ error: "Falha ao coletar notícias", detail: String(error) }, 500);
  }
});
