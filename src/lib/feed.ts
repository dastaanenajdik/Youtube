import type { CommunityPost, NotificationItem, Video, WatchRecord } from "./types";

/** Categories shown in the glass chip rail (borrowed from the classic YouTube-clone home feed). */
export function filterByCategory(videos: Video[], category: string): Video[] {
  if (!category || category === "All") return videos;
  if (category === "Live") return videos.filter((video) => video.isLive);
  if (category === "Shorts") return videos.filter((video) => video.isShort);
  const needle = category.toLowerCase();
  return videos.filter(
    (video) =>
      video.category?.toLowerCase() === needle ||
      video.tags?.some((tag) => tag.toLowerCase() === needle) ||
      `${video.title} ${video.channel}`.toLowerCase().includes(needle),
  );
}

/**
 * Very small local recommender: channels you watch and videos you like pull the
 * rest of the feed forward. Everything stays inside the browser.
 */
export function scoreByAffinity(
  video: Video,
  signals: { channels?: string[]; likedIds?: string[]; searches?: string[]; watchedIds?: string[] },
): number {
  let score = 0;
  if (signals.channels?.includes(video.channel)) score += 3;
  if (signals.likedIds?.includes(video.id)) score += 2;
  if (signals.watchedIds?.includes(video.id)) score -= 1;
  const haystack = `${video.title} ${video.channel} ${video.category ?? ""} ${(video.tags ?? []).join(" ")}`.toLowerCase();
  for (const term of signals.searches ?? []) {
    for (const word of term.toLowerCase().split(/\s+/)) {
      if (word.length > 2 && haystack.includes(word)) score += 1;
    }
  }
  return score;
}

export function rankByAffinity(videos: Video[], signals: Parameters<typeof scoreByAffinity>[1]): Video[] {
  return videos
    .map((video, index) => ({ video, index, score: scoreByAffinity(video, signals) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.video);
}

export function dedupeVideos(videos: Video[], exceptId?: string): Video[] {
  const seen = new Set(exceptId ? [exceptId] : []);
  const out: Video[] = [];
  for (const video of videos) {
    if (!video || seen.has(video.id)) continue;
    seen.add(video.id);
    out.push(video);
  }
  return out;
}

export function takeEvery<T>(items: T[], count: number, offset = 0): T[] {
  if (!items.length) return [];
  const out: T[] = [];
  for (let index = offset % items.length; out.length < count; index = (index + 1) % items.length) out.push(items[index]);
  return out;
}

export type SortMode = "relevance" | "views" | "newest" | "duration";

export function sortVideos(videos: Video[], mode: SortMode): Video[] {
  const copy = [...videos];
  if (mode === "views") return copy.sort((a, b) => countValue(b.views) - countValue(a.views));
  if (mode === "duration") return copy.sort((a, b) => b.durationSeconds - a.durationSeconds);
  if (mode === "newest") return copy.sort((a, b) => recencyValue(b.published) - recencyValue(a.published));
  return copy;
}

/** "892M views" -> 892000000, so demo feeds can be sorted like real metadata. */
export function countValue(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const match = value.match(/([\d.]+)\s*([KMB]?)\s*(view|watch)?/i);
  if (!match) return 0;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2].toUpperCase()] ?? 1;
  return base * multiplier;
}

/** Turn "3 days ago" / "1 year ago" into an approximate age in days (smaller = newer). */
export function ageInDays(label: string | undefined): number {
  if (!label) return 999;
  const match = label.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(second|minute|hour|day|week|month|year|hr|sec|min|yr|d|h|m|y)/);
  if (!match) return label.toLowerCase().includes("live") ? 0 : 999;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("s")) return amount / 86_400;
  if (unit.startsWith("m") && unit !== "month") return amount / 1440;
  if (unit.startsWith("h")) return amount / 24;
  if (unit.startsWith("d")) return amount;
  if (unit.startsWith("w")) return amount * 7;
  if (unit.startsWith("mo")) return amount * 30;
  if (unit.startsWith("y")) return amount * 365;
  return 999;
}

function recencyValue(label: string | undefined): number {
  return 10_000 - ageInDays(label);
}

export function isFresh(label: string | undefined, days = 7): boolean {
  return ageInDays(label) <= days;
}

export interface HistoryDay {
  key: string;
  label: string;
  records: WatchRecord[];
}

/** Group watch history into Today / Yesterday / older day headers like YouTube does. */
export function groupByDay(records: WatchRecord[], now = Date.now()): HistoryDay[] {
  const startOfDay = (value: number) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };
  const today = startOfDay(now);
  const buckets = new Map<string, WatchRecord[]>();
  for (const record of records) {
    const day = startOfDay(record.watchedAt);
    const key = String(day);
    buckets.set(key, [...(buckets.get(key) ?? []), record]);
  }
  return [...buckets.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([key, items]) => ({ key, label: items.length ? labelOf(items[0], today) : "", records: items }));

  function labelOf(record: WatchRecord, todayStart: number): string {
    const day = startOfDay(record.watchedAt);
    const diffDays = Math.round((todayStart - day) / 86_400_000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (day > todayStart - 6 * 86_400_000) return new Date(record.watchedAt).toLocaleDateString(undefined, { weekday: "long" });
    return new Date(record.watchedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
}

export interface DerivedNotification {
  channel: string;
  videos: Video[];
}

/** Notifications are simulated from the channels you subscribe to — nothing leaves the browser. */
export function buildNotifications(subscriptions: string[], pool: Video[], existing: NotificationItem[] = []): NotificationItem[] {
  const now = Date.now();
  const derived: NotificationItem[] = [];
  subscriptions.forEach((channel, channelIndex) => {
    const uploads = pool.filter((video) => video.channel === channel).slice(0, 2);
    const fallback = pool.filter((video) => video.channel !== channel)[channelIndex % Math.max(pool.length, 1)];
    for (const [videoIndex, video] of (uploads.length ? uploads : fallback ? [fallback] : []).entries()) {
      derived.push({
        id: `${channel}-${video?.id ?? videoIndex}`,
        kind: video?.isLive ? "live" : video?.isShort ? "short" : "upload",
        channel,
        title: video?.title ?? "New upload from a channel you follow",
        videoId: video?.id,
        at: now - (channelIndex * 2 + videoIndex + 1) * 3_600_000 - 15 * 60_000,
      });
    }
  });
  const merged = [...derived, ...existing.filter((item) => item.kind === "system")];
  const seen = new Set<string>();
  return merged
    .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
    .sort((a, b) => b.at - a.at)
    .slice(0, 24);
}

export function shortIdFromUrl(value: string): string | null {
  const trimmed = value.trim();
  const direct = trimmed.match(/^[\w-]{11}$/);
  if (direct) return direct[0];
  const patterns = [/v=([\w-]{11})/, /youtu\.be\/([\w-]{11})/, /shorts\/([\w-]{11})/, /live\/([\w-]{11})/, /embed\/([\w-]{11})/];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function tallyPoll(posts: CommunityPost[]): number {
  return posts.reduce((total, post) => total + (post.poll ?? []).reduce((sum, option) => sum + option.votes, 0), 0);
}
