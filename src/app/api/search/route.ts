import { NextRequest, NextResponse } from "next/server";
import { formatDuration, parseDuration } from "@/lib/format";
import type { Video } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type SearchSession = { search: (query: string, options?: { type?: string }) => Promise<unknown> };
type SearchGlobals = typeof globalThis & { __youtubeGlassSearchSession?: Promise<SearchSession> };
const searchGlobal = globalThis as SearchGlobals;
const responseCache = new Map<string, { at: number; videos: Video[] }>();

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  if (typeof item.text === "string") return item.text;
  if (Array.isArray(item.runs)) return item.runs.map((run) => text(run)).join("");
  if (item.simpleText) return text(item.simpleText);
  return "";
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.]/g, "")) || 0;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return numberValue(record.seconds ?? record.value ?? record.text);
  }
  return 0;
}

function collectVideos(input: unknown, output: unknown[] = [], depth = 0): unknown[] {
  if (depth > 5 || !input) return output;
  if (Array.isArray(input)) {
    for (const child of input) collectVideos(child, output, depth + 1);
    return output;
  }
  if (typeof input !== "object") return output;
  const item = input as Record<string, unknown>;
  const id = item.video_id ?? item.videoId ?? item.id;
  const title = text(item.title);
  if (typeof id === "string" && /^[\w-]{11}$/.test(id) && title) output.push(item);
  for (const key of ["videos", "results", "contents", "items", "contents_items", "content"]) {
    if (item[key]) collectVideos(item[key], output, depth + 1);
  }
  return output;
}

function mapVideo(input: unknown): Video | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Record<string, unknown>;
  const id = String(item.video_id ?? item.videoId ?? item.id ?? "");
  const title = text(item.title).trim();
  if (!/^[\w-]{11}$/.test(id) || !title) return null;
  const thumbnails = Array.isArray(item.thumbnails) ? item.thumbnails : [];
  const lastThumb = thumbnails[thumbnails.length - 1] as Record<string, unknown> | undefined;
  const rawThumb = typeof lastThumb?.url === "string" ? lastThumb.url : "";
  const durationObject = item.duration as Record<string, unknown> | undefined;
  const rawDuration = durationObject?.seconds ?? durationObject?.text ?? item.length_seconds ?? item.duration_seconds;
  const durationSeconds = numberValue(rawDuration) || parseDuration(text(rawDuration));
  const views = text(item.view_count ?? item.viewCount ?? item.views);
  const author = item.author as Record<string, unknown> | undefined;
  const channel = text(author?.name ?? item.author_name ?? item.channel_name) || "YouTube creator";
  const channelId = text(author?.id ?? item.author_id ?? item.channel_id) || undefined;
  const published = text(item.published ?? item.published_time ?? item.publishedTimeText);
  const description = text(item.description);
  const isLive = item.is_live === true || item.isLive === true || Boolean(item.live_now);
  const thumbnail = rawThumb.startsWith("https://") ? rawThumb : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return {
    id,
    title: title.slice(0, 240),
    channel: channel.slice(0, 120),
    channelId,
    thumbnail,
    duration: isLive ? "LIVE" : formatDuration(durationSeconds),
    durationSeconds,
    views,
    published,
    description: description.slice(0, 1800),
    isLive,
    isShort: /#shorts|\bshorts\b/i.test(title) || (durationSeconds > 0 && durationSeconds <= 60),
  };
}

async function getSearchSession(): Promise<SearchSession> {
  if (!searchGlobal.__youtubeGlassSearchSession) {
    searchGlobal.__youtubeGlassSearchSession = (async () => {
      const { Innertube } = await import("youtubei.js");
      const session = await Innertube.create({
        retrieve_player: false,
        cache: false,
        generate_session_locally: false,
        fail_fast: false,
        enable_session_cache: false,
      } as never);
      return session as unknown as SearchSession;
    })().catch((error) => {
      searchGlobal.__youtubeGlassSearchSession = undefined;
      throw error;
    });
  }
  return searchGlobal.__youtubeGlassSearchSession;
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120);
  const limit = Math.min(30, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 18));
  if (!query) return NextResponse.json({ videos: [], query: "" });

  const cacheKey = query.toLowerCase();
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 5 * 60_000) {
    return NextResponse.json({ videos: cached.videos.slice(0, limit), query }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  }

  try {
    const session = await getSearchSession();
    const page = await session.search(query, { type: "video" });
    const root = page as Record<string, unknown>;
    const rawItems = collectVideos(root.videos ?? root.results ?? page);
    const seen = new Set<string>();
    const videos = rawItems
      .map(mapVideo)
      .filter((video): video is Video => {
        if (!video || seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
      })
      .slice(0, 30);
    responseCache.set(cacheKey, { at: Date.now(), videos });
    if (responseCache.size > 60) responseCache.delete(responseCache.keys().next().value as string);
    return NextResponse.json({ videos: videos.slice(0, limit), query }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("YouTube metadata search failed:", error);
    return NextResponse.json(
      { videos: [], query, error: "YouTube search is temporarily unavailable from this server. Try again in a moment." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
