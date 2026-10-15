export interface Video {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  views: string;
  published: string;
  description?: string;
  category?: string;
  tags?: string[];
  likes?: string;
  chapters?: { title: string; at: number }[];
  isShort?: boolean;
  isLive?: boolean;
}

export interface WatchRecord {
  video: Video;
  watchedAt: number;
  positionSeconds: number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  videoIds: string[];
}

export interface ChannelProfile {
  name: string;
  handle: string;
  tagline: string;
  subscribers: string;
  videoCount: number;
  joined: string;
  location: string;
  links: { label: string; href: string }[];
}

export interface CommunityPost {
  id: string;
  author: string;
  text: string;
  at: number;
  likes: number;
  liked?: boolean;
  poll?: { label: string; votes: number }[];
}

export interface CommentEntry {
  id: string;
  videoId: string;
  author: string;
  text: string;
  at: number;
  likes: number;
  liked?: boolean;
  pinned?: boolean;
  replies?: number;
}

export interface NotificationItem {
  id: string;
  kind: "upload" | "live" | "short" | "system";
  channel: string;
  title: string;
  videoId?: string;
  at: number;
}

export interface QueueEntry {
  video: Video;
  addedAt: number;
}

export type ThemeName = "dark" | "light";
export type AccentName = "rose" | "violet" | "aqua" | "amber";
export type Visibility = "public" | "unlisted" | "private";

export interface RoomMember {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface RoomMessage {
  id: string;
  memberId: string;
  name: string;
  text: string;
  at: number;
}

export interface RoomSnapshot {
  code: string;
  name: string;
  createdAt: number;
  hostId: string;
  video: Video | null;
  isPlaying: boolean;
  positionSeconds: number;
  updatedAt: number;
  stateVersion: number;
  members: RoomMember[];
  messages: RoomMessage[];
  serverMs: number;
}

export interface RoomSession {
  code: string;
  memberId: string;
  name: string;
}
