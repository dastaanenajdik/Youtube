import { cleanVideo } from "./format";
import type { RoomMember, RoomMessage, RoomSnapshot, Video } from "./types";

interface RoomRecord {
  code: string;
  name: string;
  createdAt: number;
  hostId: string;
  video: Video | null;
  isPlaying: boolean;
  anchorPosition: number;
  anchorMs: number;
  updatedAt: number;
  stateVersion: number;
  members: Map<string, RoomMember>;
  messages: RoomMessage[];
}

type RoomGlobals = typeof globalThis & { __youtubeGlassRooms?: Map<string, RoomRecord> };
const globalRooms = globalThis as RoomGlobals;
const rooms = (globalRooms.__youtubeGlassRooms ??= new Map<string, RoomRecord>());
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function clampPosition(value: unknown, video: Video | null): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const upper = video?.durationSeconds ? Math.max(video.durationSeconds - 0.25, 0) : 6 * 60 * 60;
  return Math.min(Math.max(numeric, 0), upper);
}

function safeName(value: unknown): string {
  if (typeof value !== "string") return "Guest";
  const name = value.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 24);
  return name || "Guest";
}

function getPosition(room: RoomRecord, now = Date.now()): number {
  const position = room.anchorPosition + (room.isPlaying ? Math.max(0, now - room.anchorMs) / 1000 : 0);
  return clampPosition(position, room.video);
}

function freshCode(): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    if (!rooms.has(code)) return code;
  }
  return `${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

function pruneRooms(now = Date.now()): void {
  for (const [code, room] of rooms) {
    const lastActivity = Math.max(room.updatedAt, ...Array.from(room.members.values(), (member) => member.lastSeen));
    if (now - lastActivity > 12 * 60 * 60 * 1000) rooms.delete(code);
  }
}

export function createRoom(input: {
  memberId: string;
  name?: unknown;
  video?: unknown;
  isPlaying?: boolean;
  positionSeconds?: unknown;
}): { room: RoomSnapshot; memberId: string } {
  pruneRooms();
  const now = Date.now();
  const memberId = input.memberId.slice(0, 80);
  const video = cleanVideo(input.video);
  const member: RoomMember = { id: memberId, name: safeName(input.name), joinedAt: now, lastSeen: now };
  const record: RoomRecord = {
    code: freshCode(),
    name: `${member.name}'s watch party`,
    createdAt: now,
    hostId: memberId,
    video,
    isPlaying: Boolean(input.isPlaying && video),
    anchorPosition: clampPosition(input.positionSeconds, video),
    anchorMs: now,
    updatedAt: now,
    stateVersion: 1,
    members: new Map([[memberId, member]]),
    messages: [],
  };
  rooms.set(record.code, record);
  return { room: publicRoom(record, now), memberId };
}

export function findRoom(codeInput: string, memberId?: string): RoomSnapshot | null {
  pruneRooms();
  const code = codeInput.toUpperCase();
  const record = rooms.get(code);
  if (!record) return null;
  if (memberId) touchMember(record, memberId);
  return publicRoom(record);
}

export function joinRoom(codeInput: string, memberIdInput: string, nameInput: unknown): RoomSnapshot | null {
  const code = codeInput.toUpperCase();
  const record = rooms.get(code);
  if (!record) return null;
  const now = Date.now();
  const memberId = memberIdInput.slice(0, 80);
  const existing = record.members.get(memberId);
  if (existing) {
    existing.name = safeName(nameInput);
    existing.lastSeen = now;
  } else {
    if (record.members.size >= 30) return null;
    record.members.set(memberId, { id: memberId, name: safeName(nameInput), joinedAt: now, lastSeen: now });
  }
  return publicRoom(record, now);
}

export function touchMember(record: RoomRecord, memberId: string): void {
  const member = record.members.get(memberId);
  if (member) member.lastSeen = Date.now();
}

export type RoomAction = "play" | "pause" | "seek" | "video";

export function controlRoom(
  codeInput: string,
  input: { action: RoomAction; video?: unknown; positionSeconds?: unknown }
): RoomSnapshot | null {
  const record = rooms.get(codeInput.toUpperCase());
  if (!record) return null;
  const now = Date.now();
  const currentPosition = getPosition(record, now);
  if (input.action === "video") {
    const video = cleanVideo(input.video);
    if (!video) return null;
    record.video = video;
    record.anchorPosition = clampPosition(input.positionSeconds, video);
    record.anchorMs = now;
    record.isPlaying = true;
  } else if (input.action === "play") {
    if (!record.video) return null;
    record.anchorPosition = currentPosition;
    record.anchorMs = now;
    record.isPlaying = true;
  } else if (input.action === "pause") {
    record.anchorPosition = input.positionSeconds === undefined ? currentPosition : clampPosition(input.positionSeconds, record.video);
    record.anchorMs = now;
    record.isPlaying = false;
  } else if (input.action === "seek") {
    record.anchorPosition = clampPosition(input.positionSeconds, record.video);
    record.anchorMs = now;
  }
  record.updatedAt = now;
  record.stateVersion += 1;
  return publicRoom(record, now);
}

export function addMessage(codeInput: string, memberId: string, nameInput: unknown, textInput: unknown): RoomSnapshot | null {
  const record = rooms.get(codeInput.toUpperCase());
  if (!record || typeof textInput !== "string") return null;
  const text = textInput.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  if (!text) return publicRoom(record);
  const now = Date.now();
  const knownMember = record.members.get(memberId);
  const name = knownMember?.name ?? safeName(nameInput);
  record.messages.push({ id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`, memberId, name, text, at: now });
  record.messages = record.messages.slice(-60);
  if (knownMember) knownMember.lastSeen = now;
  return publicRoom(record, now);
}

export function leaveRoom(codeInput: string, memberId: string): RoomSnapshot | null {
  const record = rooms.get(codeInput.toUpperCase());
  if (!record) return null;
  record.members.delete(memberId);
  if (record.hostId === memberId && record.members.size > 0) record.hostId = record.members.keys().next().value as string;
  if (record.members.size === 0) rooms.delete(record.code);
  return rooms.has(record.code) ? publicRoom(record) : null;
}

function publicRoom(record: RoomRecord, now = Date.now()): RoomSnapshot {
  const members = Array.from(record.members.values())
    .filter((member) => now - member.lastSeen < 75_000)
    .sort((a, b) => a.joinedAt - b.joinedAt);
  return {
    code: record.code,
    name: record.name,
    createdAt: record.createdAt,
    hostId: record.hostId,
    video: record.video,
    isPlaying: record.isPlaying,
    positionSeconds: getPosition(record, now),
    updatedAt: record.updatedAt,
    stateVersion: record.stateVersion,
    members,
    messages: record.messages.slice(-30),
    serverMs: now,
  };
}
