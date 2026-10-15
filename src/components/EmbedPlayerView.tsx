"use client";

import { useEffect, useRef, useState } from "react";
import { Captions, CaptionsOff, Gauge, Maximize2, Pause, Play, RotateCcw, RotateCw, Settings2, Volume1, Volume2, VolumeX } from "lucide-react";
import { EmbedPlayer } from "@/lib/embed-player";
import { formatDuration } from "@/lib/format";

interface EmbedPlayerViewProps {
  videoId: string;
  title?: string;
  vertical?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  controls?: "glass" | "none";
  variant?: "full" | "compact";
  className?: string;
  onEnded?: () => void;
  onState?: (state: { playing: boolean; time: number; length: number }) => void;
  onReady?: (player: EmbedPlayer) => void;
}

const RATES = [0.75, 1, 1.25, 1.5, 2];

export default function EmbedPlayerView({
  videoId,
  title,
  vertical = false,
  muted = true,
  autoplay = false,
  controls = "glass",
  variant = "full",
  className = "",
  onEnded,
  onState,
  onReady,
}: EmbedPlayerViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<EmbedPlayer | null>(null);
  const endedRef = useRef(onEnded);
  const stateRef = useRef(onState);
  const readyRef = useRef(onReady);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 70);
  const [isMuted, setIsMuted] = useState(muted);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keep the latest callbacks available to the player without touching refs during render.
  useEffect(() => {
    endedRef.current = onEnded;
    stateRef.current = onState;
    readyRef.current = onReady;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !videoId) return;
    const player = new EmbedPlayer(host, videoId, {
      muted,
      autoplay,
      controls: variant === "compact" ? 0 : 0,
    });
    playerRef.current = player;
    readyRef.current?.(player);
    const unsubscribe = player.subscribe((state) => {
      setPlaying(state.playing);
      setTime(state.time);
      if (state.length > 0) setLength(state.length);
      stateRef.current?.(state);
      if (state.length > 0 && state.time >= state.length - 0.6 && state.playing) endedRef.current?.();
    });
    return () => {
      unsubscribe();
      player.destroy();
      playerRef.current = null;
    };
    // Rebuilding the embed on video change is the intent for feed cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const progress = length > 0 ? Math.min(100, (time / length) * 100) : 0;
  const toggleFullscreen = () => {
    const node = frameRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void node.requestFullscreen?.();
  };

  return (
    <div ref={frameRef} className={`embed-player ${vertical ? "is-vertical" : "is-wide"} ${captions ? "has-captions" : ""} ${className}`}>
      <div ref={hostRef} className="embed-host" />
      {controls === "glass" && (
        <>
          <button
            type="button"
            className="embed-tap-layer"
            aria-label={playing ? "Pause video" : "Play video"}
            onClick={() => playerRef.current?.toggle()}
          />
          <div className="embed-chrome">
            {variant === "full" && title && (
              <div className="embed-topline">
                <span className="embed-title">{title}</span>
                <button type="button" className="embed-chip" aria-label="Fullscreen" onClick={toggleFullscreen}><Maximize2 size={15} /></button>
              </div>
            )}
            {captions && (
              <p className="embed-caption"><span>Captions on · YouTube serves the transcript for this video</span></p>
            )}
            <div className="embed-bottom">
              <div className="embed-seek">
                <input
                  aria-label="Video progress"
                  type="range"
                  min="0"
                  max={length || 100}
                  step="0.1"
                  value={length ? Math.min(time, length) : 0}
                  onChange={(event) => playerRef.current?.seek(Number(event.target.value))}
                  style={{ "--progress": `${progress}%` } as React.CSSProperties}
                />
                <span className="embed-time">{formatDuration(time)} / {length > 0 ? formatDuration(length) : "--:--"}</span>
              </div>
              <div className="embed-buttons">
                <div className="embed-buttons-group">
                  <button type="button" className="glass-icon-button round" aria-label={playing ? "Pause" : "Play"} onClick={() => playerRef.current?.toggle()}>
                    {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <button type="button" className="glass-icon-button tiny" aria-label="Back 5 seconds" onClick={() => playerRef.current?.skip(-5)}><RotateCcw size={15} /><small>5</small></button>
                  <button type="button" className="glass-icon-button tiny" aria-label="Forward 5 seconds" onClick={() => playerRef.current?.skip(5)}><RotateCw size={15} /><small>5</small></button>
                </div>
                <div className="embed-buttons-group">
                  <button
                    type="button"
                    className="glass-icon-button tiny"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      playerRef.current?.setMuted(next);
                      setVolume(next ? 0 : 70);
                    }}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={15} /> : volume < 45 ? <Volume1 size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    aria-label="Volume"
                    className="embed-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setVolume(next);
                      setIsMuted(next === 0);
                      playerRef.current?.setVolume(next);
                    }}
                  />
                  {variant === "full" && (
                    <>
                      <button
                        type="button"
                        className={`glass-icon-button tiny ${captions ? "active" : ""}`}
                        aria-label={captions ? "Turn captions off" : "Turn captions on"}
                        onClick={() => {
                          const next = !captions;
                          setCaptions(next);
                          playerRef.current?.setCaptions(next);
                        }}
                      >
                        {captions ? <Captions size={16} /> : <CaptionsOff size={16} />}
                      </button>
                      <div className="embed-settings-wrap">
                        <button type="button" className={`glass-icon-button tiny ${settingsOpen ? "active" : ""}`} aria-label="Playback settings" onClick={() => setSettingsOpen((open) => !open)}>
                          <Settings2 size={16} />
                        </button>
                        {settingsOpen && (
                          <div className="embed-settings glass-pop" role="menu">
                            <span className="glass-menu-label">Playback speed</span>
                            {RATES.map((option) => (
                              <button
                                key={option}
                                type="button"
                                role="menuitemradio"
                                aria-checked={rate === option}
                                className={rate === option ? "selected" : ""}
                                onClick={() => {
                                  setRate(option);
                                  playerRef.current?.setRate(option);
                                  setSettingsOpen(false);
                                }}
                              >
                                <Gauge size={14} /> {option === 1 ? "Normal" : `${option}×`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
