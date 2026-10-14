"use client";

import { useRouter } from "next/navigation";
import { Maximize, Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { useApp } from "./Providers";

export default function PlayerControls({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { isPlaying, togglePlayback, playbackTime, duration, seekTo, volume, muted, setVolumeLevel, toggleMute, currentVideo } = useApp();
  const length = duration || currentVideo?.durationSeconds || 0;
  const progress = length > 0 ? Math.min(100, (playbackTime / length) * 100) : 0;
  return <div className={`player-controls ${compact ? "compact" : ""}`}>
    <div className="player-seek-row">
      <span>{formatDuration(playbackTime)}</span>
      <input aria-label="Video progress" type="range" min="0" max={length || 100} step="0.5" value={length ? Math.min(playbackTime, length) : 0} onChange={(event) => seekTo(Number(event.target.value))} style={{ "--progress": `${progress}%` } as React.CSSProperties} />
      <span>{length > 0 ? formatDuration(length) : "--:--"}</span>
    </div>
    <div className="player-control-buttons">
      <div className="transport-group">
        <button className="icon-button control-small" aria-label="Back 10 seconds" onClick={() => seekTo(Math.max(0, playbackTime - 10))}><RotateCcw size={17} /><small>10</small></button>
        <button className="control-play" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={togglePlayback}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
        <button className="icon-button control-small" aria-label="Forward 10 seconds" onClick={() => seekTo(Math.min(length || playbackTime + 10, playbackTime + 10))}><RotateCw size={17} /><small>10</small></button>
      </div>
      {!compact && <span className="control-video-title">{currentVideo?.title}</span>}
      <div className="volume-group">
        <button className="icon-button control-small" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>{muted ? <VolumeX size={18} /> : volume < 35 ? <Volume1 size={18} /> : <Volume2 size={18} />}</button>
        {!compact && <input aria-label="Volume" type="range" min="0" max="100" value={muted ? 0 : volume} onChange={(event) => setVolumeLevel(Number(event.target.value))} />}
        <button className="icon-button control-small fullscreen-action" aria-label="Open video page" onClick={() => { if (currentVideo) router.push(`/watch?v=${encodeURIComponent(currentVideo.id)}`); }}><Maximize size={16} /></button>
      </div>
    </div>
  </div>;
}
