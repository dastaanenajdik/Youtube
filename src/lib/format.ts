import type { Video } from "./types";

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function parseDuration(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value !== "string") return 0;
  const parts = value.trim().split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function formatCount(value: string | number | undefined): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B views`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${value} views`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2_592_000) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function videoFromId(id: string): Video {
  const safeId = /^[\w-]{11}$/.test(id) ? id : "dQw4w9WgXcQ";
  return {
    id: safeId,
    title: "YouTube video",
    channel: "Open in YouTube",
    thumbnail: `https://i.ytimg.com/vi/${safeId}/hqdefault.jpg`,
    duration: "",
    durationSeconds: 0,
    views: "",
    published: "",
    description: "This video is loaded directly from a YouTube link. Playback and availability are controlled by YouTube.",
  };
}

export function cleanVideo(input: unknown): Video | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const id = typeof value.id === "string" ? value.id : typeof value.videoId === "string" ? value.videoId : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (!/^[\w-]{11}$/.test(id) || !title) return null;
  const durationSeconds = typeof value.durationSeconds === "number" && Number.isFinite(value.durationSeconds)
    ? Math.max(0, value.durationSeconds)
    : parseDuration(value.duration);
  const thumbnail = typeof value.thumbnail === "string" && value.thumbnail.startsWith("https://")
    ? value.thumbnail
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return {
    id,
    title: title.slice(0, 240),
    channel: typeof value.channel === "string" ? value.channel.slice(0, 120) : "YouTube creator",
    channelId: typeof value.channelId === "string" ? value.channelId.slice(0, 80) : undefined,
    thumbnail,
    duration: typeof value.duration === "string" ? value.duration : formatDuration(durationSeconds),
    durationSeconds,
    views: typeof value.views === "string" ? value.views : "",
    published: typeof value.published === "string" ? value.published : "",
    description: typeof value.description === "string" ? value.description.slice(0, 2000) : undefined,
    category: typeof value.category === "string" ? value.category.slice(0, 40) : undefined,
    isShort: value.isShort === true,
    isLive: value.isLive === true,
  };
}
