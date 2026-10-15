"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Captions, CaptionsOff, Gauge, ListVideo, Maximize, Pause, Play, RotateCcw, RotateCw, Settings2, Volume1, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { useApp } from "./Providers";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerControls({
  compact = false,
  chapters = [],
  captionsNote = false,
}: {
  compact?: boolean;
  chapters?: { title: string; at: number }[];
  captionsNote?: boolean;
}) {
  const router = useRouter();
  const framelessRef = useRef<HTMLDivElement | null>(null);
  const {
    isPlaying, togglePlayback, playbackTime, duration, seekTo, volume, muted, setVolumeLevel, toggleMute,
    currentVideo, captions, toggleCaptions, rate, setRate, queue, pushNotice,
  } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const length = duration || currentVideo?.durationSeconds || 0;
  const progress = length > 0 ? Math.min(100, (playbackTime / length) * 100) : 0;
  const buffered = Math.min(100, progress + 8);
  const activeChapter = chapters.length ? chapters.reduce((found, chapter) => (chapter.at <= playbackTime ? chapter : found), chapters[0]) : null;

  const goFullscreen = () => {
    const node = framelessRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void node.requestFullscreen?.();
  };

  return (
    <div className={`player-controls glass-panel ${compact ? "compact" : ""}`} ref={framelessRef}>
      <div className="player-seek-row">
        <span>{formatDuration(playbackTime)}</span>
        <div className="seek-wrap">
          <span className="seek-buffered" style={{ width: `${length ? buffered : 0}%` }} />
          <input
            aria-label="Video progress"
            type="range"
            min="0"
            max={length || 100}
            step="0.5"
            value={length ? Math.min(playbackTime, length) : 0}
            onChange={(event) => seekTo(Number(event.target.value))}
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          />
          {chapters.length > 1 && length > 0 && (
            <span className="seek-chapters" aria-hidden="true">
              {chapters.slice(1).map((chapter) => <i key={`${chapter.at}-${chapter.title}`} style={{ left: `${Math.min(100, (chapter.at / length) * 100)}%` }} />)}
            </span>
          )}
        </div>
        <span>{length > 0 ? formatDuration(length) : "--:--"}</span>
      </div>
      <div className="player-control-buttons">
        <div className="transport-group">
          <button className="glass-icon-button tiny" aria-label="Back 10 seconds" onClick={() => seekTo(Math.max(0, playbackTime - 10))}><RotateCcw size={17} /><small>10</small></button>
          <button className="control-play glass-icon-button" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={togglePlayback}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
          <button className="glass-icon-button tiny" aria-label="Forward 10 seconds" onClick={() => seekTo(Math.min(length || playbackTime + 10, playbackTime + 10))}><RotateCw size={17} /><small>10</small></button>
        </div>
        <div className="player-center">
          {!compact && activeChapter && <span className="control-chapter"><Gauge size={12} /> {activeChapter.title}</span>}
          {!compact && !activeChapter && <span className="control-video-title">{currentVideo?.title}</span>}
          {captionsNote && captions && <span className="control-caption-note" aria-live="polite">CC on · YouTube serves this transcript</span>}
        </div>
        <div className="volume-group">
          <button className="glass-icon-button tiny" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>{muted ? <VolumeX size={18} /> : volume < 35 ? <Volume1 size={18} /> : <Volume2 size={18} />}</button>
          {!compact && <input aria-label="Volume" type="range" min="0" max="100" value={muted ? 0 : volume} onChange={(event) => setVolumeLevel(Number(event.target.value))} />}
          <button className={`glass-icon-button tiny ${captions ? "active" : ""}`} aria-label={captions ? "Turn captions off" : "Turn captions on"} title="Captions" onClick={toggleCaptions}>
            {captions ? <Captions size={17} /> : <CaptionsOff size={17} />}
          </button>
          {!compact && <div className="player-settings-wrap">
            <button className={`glass-icon-button tiny ${settingsOpen ? "active" : ""}`} aria-label="Playback settings" onClick={() => setSettingsOpen((open) => !open)}><Settings2 size={17} /></button>
            {settingsOpen && (
              <div className="embed-settings glass-pop" role="menu">
                <span className="glass-menu-label">Speed</span>
                {RATES.map((option) => (
                  <button key={option} type="button" role="menuitemradio" aria-checked={rate === option} className={rate === option ? "selected" : ""} onClick={() => { setRate(option); setSettingsOpen(false); pushNotice(`Playback speed ${option === 1 ? "normal" : `${option}×`}`); }}>
                    <Gauge size={14} /> {option === 1 ? "Normal" : `${option}×`}
                  </button>
                ))}
                <span className="glass-menu-label">Queue</span>
                <button type="button" onClick={() => { setSettingsOpen(false); router.push("/library?tab=watch-later"); }}><ListVideo size={14} /> {queue.length} waiting in queue</button>
              </div>
            )}
          </div>}
          <button className="glass-icon-button tiny fullscreen-action" aria-label="Fullscreen player" title="Fullscreen" onClick={goFullscreen}><Maximize size={16} /></button>
        </div>
      </div>
    </div>
  );
}
