"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadYouTubeIframeApi, type YouTubePlayer } from "@/lib/youtube-api";
import { cleanVideo, videoFromId } from "@/lib/format";
import { readStorage, writeStorage } from "@/lib/storage";
import type { Playlist, RoomSession, RoomSnapshot, Video, WatchRecord } from "@/lib/types";

interface AppContextValue {
  hydrated: boolean;
  videos: Record<string, Video>;
  currentVideo: Video | null;
  isPlaying: boolean;
  playbackTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playerReady: boolean;
  playerIssue: string;
  history: WatchRecord[];
  searchHistory: string[];
  likedIds: string[];
  watchLaterIds: string[];
  playlists: Playlist[];
  subscribedChannels: string[];
  roomSession: RoomSession | null;
  roomSnapshot: RoomSnapshot | null;
  roomBusy: boolean;
  notice: string;
  cacheVideos: (videos: Video[]) => void;
  rememberSearch: (query: string) => void;
  openVideo: (video: Video, autoplay?: boolean) => void;
  setVideoFromUrl: (video: Video, autoplay?: boolean) => void;
  togglePlayback: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (value: number) => void;
  toggleMute: () => void;
  toggleLiked: (video: Video) => void;
  toggleWatchLater: (video: Video) => void;
  createPlaylist: (name: string) => Playlist | null;
  addToPlaylist: (playlistId: string, video: Video) => void;
  removePlaylist: (playlistId: string) => void;
  toggleSubscription: (channel: string) => void;
  clearHistory: () => void;
  removeHistoryEntry: (videoId: string) => void;
  registerPlayerHost: (host: HTMLDivElement | null) => void;
  createRoom: (name?: string) => Promise<string>;
  joinRoom: (code: string, name?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendRoomMessage: (text: string) => Promise<void>;
  pushNotice: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE = {
  history: "ytglass.history.v1",
  searches: "ytglass.searches.v1",
  liked: "ytglass.liked.v1",
  watchLater: "ytglass.watch-later.v1",
  playlists: "ytglass.playlists.v1",
  subscriptions: "ytglass.subscriptions.v1",
  videos: "ytglass.video-cache.v1",
  currentVideo: "ytglass.current-video.v1",
  room: "ytglass.room-session.v1",
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `member-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function setSafeTimeout(ref: { current: ReturnType<typeof setTimeout> | null }, callback: () => void, delay: number) {
  if (ref.current) clearTimeout(ref.current);
  ref.current = setTimeout(callback, delay);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [videos, setVideos] = useState<Record<string, Video>>({});
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(72);
  const [muted, setMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerIssue, setPlayerIssue] = useState("");
  const [history, setHistory] = useState<WatchRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
  const [roomSession, setRoomSession] = useState<RoomSession | null>(null);
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [roomBusy, setRoomBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerReadyRef = useRef(false);
  const playerLoadingRef = useRef(false);
  const loadedVideoIdRef = useRef("");
  const lastPlayerCommandRef = useRef<"play" | "pause" | "">("");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomSyncGuardRef = useRef(false);
  const playerStateRef = useRef({
    currentVideo: null as Video | null,
    isPlaying: false,
    volume: 72,
    muted: false,
    roomSession: null as RoomSession | null,
    roomSnapshot: null as RoomSnapshot | null,
  });
  const lastRoomControlVersionRef = useRef(0);
  const syncPlayerToStateRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    setHistory(readStorage(STORAGE.history, []));
    setSearchHistory(readStorage(STORAGE.searches, []));
    setLikedIds(readStorage(STORAGE.liked, []));
    setWatchLaterIds(readStorage(STORAGE.watchLater, []));
    setPlaylists(readStorage(STORAGE.playlists, []));
    setSubscribedChannels(readStorage(STORAGE.subscriptions, []));
    setVideos(readStorage(STORAGE.videos, {}));
    setCurrentVideo(readStorage(STORAGE.currentVideo, null));
    setRoomSession(readStorage(STORAGE.room, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    playerStateRef.current = { currentVideo, isPlaying, volume, muted, roomSession, roomSnapshot };
  }, [currentVideo, isPlaying, volume, muted, roomSession, roomSnapshot]);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE.history, history);
    writeStorage(STORAGE.searches, searchHistory);
    writeStorage(STORAGE.liked, likedIds);
    writeStorage(STORAGE.watchLater, watchLaterIds);
    writeStorage(STORAGE.playlists, playlists);
    writeStorage(STORAGE.subscriptions, subscribedChannels);
    writeStorage(STORAGE.videos, videos);
    writeStorage(STORAGE.currentVideo, currentVideo);
    writeStorage(STORAGE.room, roomSession);
  }, [hydrated, history, searchHistory, likedIds, watchLaterIds, playlists, subscribedChannels, videos, currentVideo, roomSession]);

  const cacheVideos = useCallback((items: Video[]) => {
    const clean = items.filter((item) => item && /^[\w-]{11}$/.test(item.id));
    if (!clean.length) return;
    setVideos((previous) => {
      const next = { ...previous };
      for (const video of clean) next[video.id] = video;
      const ids = Object.keys(next);
      if (ids.length > 120) for (const oldId of ids.slice(0, ids.length - 120)) delete next[oldId];
      return next;
    });
  }, []);

  const rememberSearch = useCallback((raw: string) => {
    const query = raw.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120);
    if (!query) return;
    setSearchHistory((previous) => [query, ...previous.filter((entry) => entry.toLowerCase() !== query.toLowerCase())].slice(0, 12));
  }, []);

  const pushNotice = useCallback((message: string) => {
    setNotice(message);
    setSafeTimeout(noticeTimerRef, () => setNotice(""), 3000);
  }, []);

  const sendRoomControl = useCallback(async (action: "play" | "pause" | "seek" | "video", payload: Record<string, unknown> = {}) => {
    const session = playerStateRef.current.roomSession;
    if (!session) return;
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(session.code)}/control`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: session.memberId, action, ...payload }),
      });
      const result = (await response.json()) as { room?: RoomSnapshot; error?: string };
      if (response.ok && result.room) {
        setRoomSnapshot(result.room);
        lastRoomControlVersionRef.current = result.room.stateVersion;
      }
    } catch {
      // Local playback remains available even if a room control request drops.
    }
  }, []);

  const registerPlayerHost = useCallback((host: HTMLDivElement | null) => {
    if (!host) {
      playerHostRef.current = null;
      return;
    }
    playerHostRef.current = host;
    const player = playerRef.current;
    if (player) {
      try {
        const iframe = player.getIframe();
        if (iframe && iframe.parentElement !== host) host.replaceChildren(iframe);
      } catch {
        // The iframe may still be booting; the ready handler will attach it.
      }
    } else if (playerStateRef.current.currentVideo) {
      void syncPlayerToStateRef.current();
    }
  }, []);

  const openVideo = useCallback((video: Video, autoplay = true) => {
    const safeVideo = cleanVideo(video) ?? videoFromId(video.id);
    playerStateRef.current.currentVideo = safeVideo;
    playerStateRef.current.isPlaying = autoplay;
    setCurrentVideo(safeVideo);
    setIsPlaying(autoplay);
    setPlaybackTime(0);
    setDuration(safeVideo.durationSeconds || 0);
    setPlayerIssue("");
    setVideos((previous) => ({ ...previous, [safeVideo.id]: safeVideo }));
    setHistory((previous) => {
      const without = previous.filter((record) => record.video.id !== safeVideo.id);
      return [{ video: safeVideo, watchedAt: Date.now(), positionSeconds: 0 }, ...without].slice(0, 100);
    });
    lastPlayerCommandRef.current = autoplay ? "play" : "pause";
    void syncPlayerToStateRef.current();
    if (playerStateRef.current.roomSession) {
      void sendRoomControl("video", { video: safeVideo, positionSeconds: 0 });
    }
  }, [sendRoomControl]);

  const setVideoFromUrl = useCallback((video: Video, autoplay = false) => {
    const safeVideo = cleanVideo(video) ?? videoFromId(video.id);
    if (playerStateRef.current.currentVideo?.id === safeVideo.id) return;
    playerStateRef.current.currentVideo = safeVideo;
    playerStateRef.current.isPlaying = autoplay;
    setCurrentVideo(safeVideo);
    setIsPlaying(autoplay);
    setPlaybackTime(0);
    setDuration(safeVideo.durationSeconds || 0);
    setPlayerIssue("");
    setVideos((previous) => ({ ...previous, [safeVideo.id]: safeVideo }));
    lastPlayerCommandRef.current = autoplay ? "play" : "pause";
    void syncPlayerToStateRef.current();
  }, []);

  const togglePlayback = useCallback(() => {
    const next = !playerStateRef.current.isPlaying;
    playerStateRef.current.isPlaying = next;
    setIsPlaying(next);
    lastPlayerCommandRef.current = next ? "play" : "pause";
    if (playerReadyRef.current && playerRef.current) {
      try {
        if (next) playerRef.current.playVideo();
        else playerRef.current.pauseVideo();
      } catch {
        // The API can be between states; its next onReady callback retries.
      }
    } else {
      void syncPlayerToStateRef.current();
    }
    if (playerStateRef.current.roomSession) {
      void sendRoomControl(next ? "play" : "pause", { positionSeconds: playbackTime });
    }
  }, [playbackTime, sendRoomControl]);

  const seekTo = useCallback((seconds: number) => {
    const upper = duration || playerRef.current?.getDuration() || 6 * 60 * 60;
    const next = Math.min(Math.max(Number(seconds) || 0, 0), Math.max(upper - 0.25, 0));
    setPlaybackTime(next);
    try {
      if (playerReadyRef.current) playerRef.current?.seekTo(next, true);
    } catch {
      // Seek remains reflected in the local slider until the player is ready.
    }
    if (playerStateRef.current.roomSession) void sendRoomControl("seek", { positionSeconds: next });
  }, [duration, sendRoomControl]);

  const setVolumeLevel = useCallback((value: number) => {
    const next = Math.min(100, Math.max(0, Math.round(value)));
    playerStateRef.current.volume = next;
    setVolume(next);
    setMuted(next === 0);
    try {
      playerRef.current?.setVolume(next);
      if (next > 0) playerRef.current?.unMute();
      if (next === 0) playerRef.current?.mute();
    } catch {
      // Volume is kept in app state if the embed has not initialized yet.
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !playerStateRef.current.muted;
    playerStateRef.current.muted = next;
    setMuted(next);
    try {
      if (next) playerRef.current?.mute();
      else {
        playerRef.current?.unMute();
        playerRef.current?.setVolume(playerStateRef.current.volume);
      }
    } catch {
      // State persists until the player becomes available.
    }
  }, []);

  const syncPlayerToState = useCallback(async () => {
    const host = playerHostRef.current;
    const selected = playerStateRef.current.currentVideo;
    if (!host || !selected) return;

    if (!playerRef.current) {
      if (playerLoadingRef.current) return;
      playerLoadingRef.current = true;
      try {
        const YT = await loadYouTubeIframeApi();
        const latestHost = playerHostRef.current;
        const latestVideo = playerStateRef.current.currentVideo;
        if (!latestHost || !latestVideo || playerRef.current) return;
        const target = document.createElement("div");
        target.className = "yt-player-api-target";
        latestHost.replaceChildren(target);
        loadedVideoIdRef.current = latestVideo.id;
        const instance = new YT.Player(target, {
          width: "100%",
          height: "100%",
          videoId: latestVideo.id,
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: { target: YouTubePlayer }) => {
              playerReadyRef.current = true;
              setPlayerReady(true);
              setPlayerIssue("");
              try {
                const iframe = event.target.getIframe();
                if (playerHostRef.current && iframe.parentElement !== playerHostRef.current) {
                  playerHostRef.current.replaceChildren(iframe);
                }
                event.target.setVolume(playerStateRef.current.volume);
                if (playerStateRef.current.muted) event.target.mute();
                const current = playerStateRef.current.currentVideo;
                if (current && loadedVideoIdRef.current !== current.id) {
                  loadedVideoIdRef.current = current.id;
                  event.target.loadVideoById({ videoId: current.id, startSeconds: 0 });
                }
                if (playerStateRef.current.isPlaying) {
                  lastPlayerCommandRef.current = "play";
                  event.target.playVideo();
                } else {
                  lastPlayerCommandRef.current = "pause";
                  event.target.pauseVideo();
                }
              } catch {
                // A click on the player controls or the app play button can retry playback.
              }
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              pollTimerRef.current = setInterval(() => {
                const currentPlayer = playerRef.current;
                if (!currentPlayer || !playerReadyRef.current) return;
                try {
                  const time = currentPlayer.getCurrentTime();
                  const length = currentPlayer.getDuration();
                  if (Number.isFinite(time)) setPlaybackTime(time);
                  if (Number.isFinite(length) && length > 0) setDuration(length);
                  if (playerStateRef.current.roomSession && !roomSyncGuardRef.current && playerStateRef.current.isPlaying) {
                    const room = playerStateRef.current.roomSnapshot;
                    if (room && room.isPlaying && Date.now() - room.updatedAt > 1000) {
                      const expected = room.positionSeconds + Math.max(0, Date.now() - room.serverMs) / 1000;
                      if (Math.abs(time - expected) > 5) void sendRoomControl("seek", { positionSeconds: time });
                    }
                  }
                } catch {
                  // Some embed states briefly reject timeline queries.
                }
              }, 500);
            },
            onStateChange: (event: { data: number; target: YouTubePlayer }) => {
              if (event.data === 1) {
                const priorCommand = lastPlayerCommandRef.current;
                playerStateRef.current.isPlaying = true;
                setIsPlaying(true);
                lastPlayerCommandRef.current = "play";
                const playingVideo = playerStateRef.current.currentVideo;
                if (playingVideo) {
                  setHistory((previous) => [{ video: playingVideo, watchedAt: Date.now(), positionSeconds: 0 }, ...previous.filter((record) => record.video.id !== playingVideo.id)].slice(0, 100));
                }
                if (playerStateRef.current.roomSession && !roomSyncGuardRef.current && priorCommand !== "play") {
                  void sendRoomControl("play", { positionSeconds: event.target.getCurrentTime() });
                }
              } else if (event.data === 2 || event.data === 0 || event.data === 5) {
                const wasPlaying = playerStateRef.current.isPlaying;
                playerStateRef.current.isPlaying = false;
                setIsPlaying(false);
                lastPlayerCommandRef.current = "pause";
                if (wasPlaying && playerStateRef.current.roomSession && !roomSyncGuardRef.current) {
                  void sendRoomControl("pause", { positionSeconds: event.target.getCurrentTime() });
                }
              }
            },
            onError: (event: { data: number }) => {
              setPlayerIssue(`YouTube could not play this video (error ${event.data}). It may be unavailable or embedding may be disabled.`);
              playerStateRef.current.isPlaying = false;
              setIsPlaying(false);
            },
          },
        });
        playerRef.current = instance;
      } catch (error) {
        setPlayerIssue(error instanceof Error ? error.message : "YouTube player could not load.");
      } finally {
        playerLoadingRef.current = false;
      }
      return;
    }

    const player = playerRef.current;
    const iframe = player.getIframe?.();
    if (iframe && iframe.parentElement !== host) host.replaceChildren(iframe);
    if (!playerReadyRef.current) return;
    const playing = playerStateRef.current.isPlaying;
    if (loadedVideoIdRef.current !== selected.id) {
      loadedVideoIdRef.current = selected.id;
      lastPlayerCommandRef.current = playing ? "play" : "pause";
      if (playing) player.loadVideoById({ videoId: selected.id, startSeconds: 0 });
      else player.cueVideoById({ videoId: selected.id, startSeconds: 0 });
      return;
    }
    try {
      if (playing && lastPlayerCommandRef.current !== "play") {
        lastPlayerCommandRef.current = "play";
        player.playVideo();
      } else if (!playing && lastPlayerCommandRef.current !== "pause") {
        lastPlayerCommandRef.current = "pause";
        player.pauseVideo();
      }
    } catch {
      // The IFrame API will report its current state on the next poll.
    }
  }, [sendRoomControl]);
  useEffect(() => {
    syncPlayerToStateRef.current = syncPlayerToState;
  }, [syncPlayerToState]);

  useEffect(() => {
    if (currentVideo && playerHostRef.current) void syncPlayerToState();
  }, [currentVideo, isPlaying, syncPlayerToState]);

  useEffect(() => () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (roomGuardTimerRef.current) clearTimeout(roomGuardTimerRef.current);
  }, []);

  const applyRemoteRoom = useCallback((room: RoomSnapshot) => {
    setRoomSnapshot(room);
    playerStateRef.current.roomSnapshot = room;
    if (!room.video) return;
    const current = playerStateRef.current.currentVideo;
    const targetTime = room.positionSeconds + (room.isPlaying ? Math.max(0, Date.now() - room.serverMs) / 1000 : 0);
    const guardRemotePlayerEvent = () => {
      roomSyncGuardRef.current = true;
      setSafeTimeout(roomGuardTimerRef, () => { roomSyncGuardRef.current = false; }, 650);
    };
    if (current?.id !== room.video.id) {
      guardRemotePlayerEvent();
      playerStateRef.current.currentVideo = room.video;
      playerStateRef.current.isPlaying = room.isPlaying;
      setCurrentVideo(room.video);
      setVideos((previous) => ({ ...previous, [room.video!.id]: room.video! }));
      setIsPlaying(room.isPlaying);
      setPlaybackTime(targetTime);
      setDuration(room.video.durationSeconds || 0);
      loadedVideoIdRef.current = "";
      lastPlayerCommandRef.current = "";
      void syncPlayerToStateRef.current();
      return;
    }
    if (playerStateRef.current.isPlaying !== room.isPlaying) {
      guardRemotePlayerEvent();
      playerStateRef.current.isPlaying = room.isPlaying;
      setIsPlaying(room.isPlaying);
      lastPlayerCommandRef.current = room.isPlaying ? "play" : "pause";
      try {
        if (playerReadyRef.current) {
          if (room.isPlaying) playerRef.current?.playVideo();
          else playerRef.current?.pauseVideo();
        }
      } catch {
        // Remote state will be applied on the next room poll.
      }
    }
    if (playerReadyRef.current) {
      try {
        const local = playerRef.current?.getCurrentTime() ?? 0;
        if (Math.abs(local - targetTime) > 2.25) {
          guardRemotePlayerEvent();
          playerRef.current?.seekTo(targetTime, true);
          setPlaybackTime(targetTime);
        }
      } catch {
        // Drift correction is best-effort; next poll retries.
      }
    }
  }, []);

  const applyRemoteRoomRef = useRef(applyRemoteRoom);
  useEffect(() => {
    applyRemoteRoomRef.current = applyRemoteRoom;
  }, [applyRemoteRoom]);

  useEffect(() => {
    if (!hydrated || !roomSession) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomSession.code)}?memberId=${encodeURIComponent(roomSession.memberId)}`, { cache: "no-store" });
        const result = (await response.json()) as { room?: RoomSnapshot; error?: string };
        if (!response.ok || !result.room) {
          if (!stopped && response.status === 404) {
            setRoomSnapshot(null);
            setRoomSession(null);
            pushNotice("This watch party is no longer available.");
          }
        } else if (!stopped) {
          applyRemoteRoomRef.current(result.room);
          lastRoomControlVersionRef.current = result.room.stateVersion;
        }
      } catch {
        // Keep the current room UI while a heartbeat is temporarily unavailable.
      }
      if (!stopped) timer = setTimeout(poll, 1100);
    };
    void poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [hydrated, roomSession, pushNotice]);

  useEffect(() => {
    if (!currentVideo || playbackTime <= 0 || Math.floor(playbackTime) % 8 !== 0) return;
    setHistory((previous) => {
      const found = previous.find((record) => record.video.id === currentVideo.id);
      if (!found || Math.abs(found.positionSeconds - playbackTime) >= 7) {
        return previous.map((record) => record.video.id === currentVideo.id ? { ...record, positionSeconds: playbackTime } : record);
      }
      return previous;
    });
  }, [currentVideo, playbackTime]);

  const toggleLiked = useCallback((video: Video) => {
    setVideos((previous) => ({ ...previous, [video.id]: video }));
    setLikedIds((previous) => previous.includes(video.id) ? previous.filter((id) => id !== video.id) : [video.id, ...previous]);
  }, []);

  const toggleWatchLater = useCallback((video: Video) => {
    setVideos((previous) => ({ ...previous, [video.id]: video }));
    setWatchLaterIds((previous) => previous.includes(video.id) ? previous.filter((id) => id !== video.id) : [video.id, ...previous]);
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const cleanName = name.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    if (!cleanName) return null;
    const playlist: Playlist = { id: newId(), name: cleanName, createdAt: Date.now(), videoIds: [] };
    setPlaylists((previous) => [playlist, ...previous]);
    return playlist;
  }, []);

  const addToPlaylist = useCallback((playlistId: string, video: Video) => {
    setVideos((previous) => ({ ...previous, [video.id]: video }));
    setPlaylists((previous) => previous.map((playlist) => playlist.id === playlistId
      ? { ...playlist, videoIds: [video.id, ...playlist.videoIds.filter((id) => id !== video.id)] }
      : playlist));
    pushNotice("Added to playlist");
  }, [pushNotice]);

  const removePlaylist = useCallback((playlistId: string) => {
    setPlaylists((previous) => previous.filter((playlist) => playlist.id !== playlistId));
  }, []);

  const toggleSubscription = useCallback((channel: string) => {
    const id = channel.trim();
    if (!id) return;
    setSubscribedChannels((previous) => previous.includes(id) ? previous.filter((entry) => entry !== id) : [id, ...previous]);
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);
  const removeHistoryEntry = useCallback((videoId: string) => setHistory((previous) => previous.filter((record) => record.video.id !== videoId)), []);

  const createRoom = useCallback(async (name = "You") => {
    const memberId = newId();
    setRoomBusy(true);
    try {
      const current = playerStateRef.current.currentVideo;
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          memberId,
          name,
          video: current,
          isPlaying: playerStateRef.current.isPlaying,
          positionSeconds: playerRef.current?.getCurrentTime?.() ?? playbackTime,
        }),
      });
      const result = (await response.json()) as { room?: RoomSnapshot; error?: string };
      if (!response.ok || !result.room) throw new Error(result.error || "Could not create a watch party.");
      const session = { code: result.room.code, memberId, name };
      playerStateRef.current.roomSession = session;
      playerStateRef.current.roomSnapshot = result.room;
      setRoomSession(session);
      setRoomSnapshot(result.room);
      lastRoomControlVersionRef.current = result.room.stateVersion;
      return result.room.code;
    } catch (error) {
      pushNotice(error instanceof Error ? error.message : "Could not create a watch party.");
      throw error;
    } finally {
      setRoomBusy(false);
    }
  }, [playbackTime, pushNotice]);

  const joinRoom = useCallback(async (rawCode: string, name = "Guest") => {
    const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (!code) throw new Error("Enter a room code first.");
    const memberId = playerStateRef.current.roomSession?.code === code ? playerStateRef.current.roomSession.memberId : newId();
    setRoomBusy(true);
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId, name }),
      });
      const result = (await response.json()) as { room?: RoomSnapshot; error?: string };
      if (!response.ok || !result.room) throw new Error(result.error || "Room not found.");
      const session = { code: result.room.code, memberId, name: name.trim() || "Guest" };
      playerStateRef.current.roomSession = session;
      playerStateRef.current.roomSnapshot = result.room;
      setRoomSession(session);
      setRoomSnapshot(result.room);
      lastRoomControlVersionRef.current = result.room.stateVersion;
      applyRemoteRoomRef.current(result.room);
    } catch (error) {
      pushNotice(error instanceof Error ? error.message : "Could not join this room.");
      throw error;
    } finally {
      setRoomBusy(false);
    }
  }, [pushNotice]);

  const leaveRoom = useCallback(async () => {
    const session = playerStateRef.current.roomSession;
    if (!session) return;
    try {
      await fetch(`/api/rooms/${encodeURIComponent(session.code)}/leave`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: session.memberId }),
      });
    } catch {
      // Local session is still cleared if the room server is unavailable.
    }
    playerStateRef.current.roomSession = null;
    playerStateRef.current.roomSnapshot = null;
    roomSyncGuardRef.current = false;
    setRoomSession(null);
    setRoomSnapshot(null);
  }, []);

  const sendRoomMessage = useCallback(async (text: string) => {
    const session = playerStateRef.current.roomSession;
    if (!session || !text.trim()) return;
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(session.code)}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: session.memberId, name: session.name, text: text.trim().slice(0, 240) }),
      });
      const result = (await response.json()) as { room?: RoomSnapshot };
      if (result.room) {
        playerStateRef.current.roomSnapshot = result.room;
        setRoomSnapshot(result.room);
      }
    } catch {
      pushNotice("Chat message could not be sent.");
    }
  }, [pushNotice]);

  const value = useMemo<AppContextValue>(() => ({
    hydrated,
    videos,
    currentVideo,
    isPlaying,
    playbackTime,
    duration,
    volume,
    muted,
    playerReady,
    playerIssue,
    history,
    searchHistory,
    likedIds,
    watchLaterIds,
    playlists,
    subscribedChannels,
    roomSession,
    roomSnapshot,
    roomBusy,
    notice,
    cacheVideos,
    rememberSearch,
    openVideo,
    setVideoFromUrl,
    togglePlayback,
    seekTo,
    setVolumeLevel,
    toggleMute,
    toggleLiked,
    toggleWatchLater,
    createPlaylist,
    addToPlaylist,
    removePlaylist,
    toggleSubscription,
    clearHistory,
    removeHistoryEntry,
    registerPlayerHost,
    createRoom,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    pushNotice,
  }), [hydrated, videos, currentVideo, isPlaying, playbackTime, duration, volume, muted, playerReady, playerIssue, history, searchHistory, likedIds, watchLaterIds, playlists, subscribedChannels, roomSession, roomSnapshot, roomBusy, notice, cacheVideos, rememberSearch, openVideo, setVideoFromUrl, togglePlayback, seekTo, setVolumeLevel, toggleMute, toggleLiked, toggleWatchLater, createPlaylist, addToPlaylist, removePlaylist, toggleSubscription, clearHistory, removeHistoryEntry, registerPlayerHost, createRoom, joinRoom, leaveRoom, sendRoomMessage, pushNotice]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

export function PlayerMount({ className = "" }: { className?: string }) {
  const { registerPlayerHost } = useApp();
  const setRef = useCallback((node: HTMLDivElement | null) => registerPlayerHost(node), [registerPlayerHost]);
  return <div className={`player-mount ${className}`}><div className="player-mount-host" ref={setRef} /></div>;
}

export function SavedVideoList({ ids, emptyMessage = "Nothing here yet." }: { ids: string[]; emptyMessage?: string }) {
  const { videos } = useApp();
  const videoList = ids.map((id) => videos[id]).filter((video): video is Video => Boolean(video));
  if (!videoList.length) return <div className="empty-state"><div className="empty-state-icon">▶</div><strong>{emptyMessage}</strong><span>Videos you save will show up here.</span></div>;
  return <div className="saved-video-list">{videoList.map((video) => <div className="saved-video-row" key={video.id}>{video.title}</div>)}</div>;
}
