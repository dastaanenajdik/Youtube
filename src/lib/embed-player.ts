"use client";

import { loadYouTubeIframeApi, type YouTubePlayer } from "./youtube-api";

export interface EmbedController {
  play(): void;
  pause(): void;
  toggle(): void;
  seek(seconds: number): void;
  skip(delta: number): void;
  setVolume(value: number): void;
  setMuted(muted: boolean): void;
  setRate(rate: number): void;
  setCaptions(on: boolean): void;
  readonly playing: boolean;
  readonly time: number;
  readonly length: number;
}

type Listener = (state: { playing: boolean; time: number; length: number }) => void;

/**
 * A minimal, frame-accurate wrapper around the official YouTube IFrame API used
 * by the Shorts feed and the channel preview, where the app draws its own glass
 * controls instead of YouTube's chrome. One controller serves many subscribers.
 */
export class EmbedPlayer implements EmbedController {
  readonly host: HTMLDivElement;
  private player: YouTubePlayer | null = null;
  private listeners = new Set<Listener>();
  private poll: ReturnType<typeof setInterval> | null = null;
  private state = { playing: false, time: 0, length: 0 };
  private pending: Array<(player: YouTubePlayer) => void> = [];
  private destroyed = false;
  private lastCommand: "play" | "pause" = "pause";
  readonly mutedStart: boolean;

  constructor(
    host: HTMLDivElement,
    videoId: string,
    options: { muted?: boolean; autoplay?: boolean; controls?: number } = {},
  ) {
    this.host = host;
    this.mutedStart = options.muted ?? true;
    void this.boot(videoId, options);
  }

  private async boot(videoId: string, options: { muted?: boolean; autoplay?: boolean; controls?: number }) {
    try {
      const YT = await loadYouTubeIframeApi();
      if (this.destroyed) return;
      const target = document.createElement("div");
      target.className = "yt-player-api-target";
      this.host.replaceChildren(target);
      this.player = new YT.Player(target, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          autoplay: options.autoplay ? 1 : 0,
          controls: options.controls ?? 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YouTubePlayer }) => {
            if (this.destroyed) return;
            try {
              if (this.mutedStart) event.target.mute();
              else event.target.setVolume(70);
            } catch {
              // Older API revisions occasionally reject early commands.
            }
            this.flush();
            this.startPolling();
          },
          onStateChange: (event: { data: number }) => {
            this.state.playing = event.data === 1;
            this.emit();
          },
        },
      });
    } catch {
      // Without network access the shell still renders; the caller shows a notice.
    }
  }

  private startPolling() {
    if (this.poll) clearInterval(this.poll);
    this.poll = setInterval(() => {
      const player = this.player;
      if (!player) return;
      try {
        const time = player.getCurrentTime();
        const length = player.getDuration();
        const isPlaying = player.getPlayerState() === 1;
        const changed =
          Math.abs((this.state.time || 0) - time) > 0.2 ||
          (Number.isFinite(length) && length > 0 && Math.abs(this.state.length - length) > 0.5) ||
          this.state.playing !== isPlaying;
        this.state = {
          playing: isPlaying,
          time: Number.isFinite(time) ? time : this.state.time,
          length: Number.isFinite(length) && length > 0 ? length : this.state.length,
        };
        if (changed) this.emit();
      } catch {
        // Transient state while the embed is buffering.
      }
    }, 250);
  }

  /** Commands issued before onReady are replayed once the player exists. */
  private queue(run: (player: YouTubePlayer) => void) {
    if (this.player) run(this.player);
    else this.pending.push(run);
  }

  private flush() {
    const pending = this.pending;
    this.pending = [];
    for (const run of pending) {
      try {
        if (this.player) run(this.player);
      } catch {
        // Skip a stale command, the rest still apply.
      }
    }
  }

  private emit() {
    for (const listener of this.listeners) listener({ ...this.state });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  get playing() { return this.state.playing; }
  get time() { return this.state.time; }
  get length() { return this.state.length; }

  play() {
    this.lastCommand = "play";
    this.queue((player) => { player.playVideo(); this.state.playing = true; this.emit(); });
  }

  pause() {
    this.lastCommand = "pause";
    this.queue((player) => { player.pauseVideo(); this.state.playing = false; this.emit(); });
  }

  toggle() {
    if (this.state.playing) this.pause();
    else this.play();
  }

  seek(seconds: number) {
    this.queue((player) => {
      const total = player.getDuration?.() ?? this.state.length ?? 0;
      const next = Math.min(Math.max(seconds, 0), Math.max(total - 0.3, 0));
      player.seekTo(next, true);
      this.state = { ...this.state, time: next };
      this.emit();
    });
  }

  skip(delta: number) {
    this.queue((player) => this.seek(player.getCurrentTime() + delta));
  }

  setVolume(value: number) {
    const next = Math.min(100, Math.max(0, Math.round(value)));
    this.queue((player) => {
      player.setVolume(next);
      if (next > 0) player.unMute();
      else player.mute();
    });
  }

  setMuted(muted: boolean) {
    this.queue((player) => {
      if (muted) player.mute();
      else {
        player.unMute();
        player.setVolume(70);
      }
    });
  }

  setRate(rate: number) {
    this.queue((player) => { player.setPlaybackRate?.(rate); });
  }

  setCaptions(on: boolean) {
    this.queue((player) => {
      try {
        if (on) {
          player.loadModule?.("captions");
          player.setOption?.("captions", "trackLanguage", "en");
        } else {
          player.unloadModule?.("captions");
        }
      } catch {
        // Not every embed exposes the caption module.
      }
    });
  }

  lastIssuedCommand() {
    return this.lastCommand;
  }

  destroy() {
    this.destroyed = true;
    if (this.poll) clearInterval(this.poll);
    this.poll = null;
    this.listeners.clear();
    try {
      this.player?.destroy();
    } catch {
      // The iframe may already be gone.
    }
    this.player = null;
    this.host.replaceChildren();
  }
}
