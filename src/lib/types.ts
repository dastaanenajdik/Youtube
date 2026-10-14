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
