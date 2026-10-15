"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Pause, Play, Search, Trash2, X } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { useApp } from "@/components/Providers";
import { groupByDay } from "@/lib/feed";
import { formatDuration } from "@/lib/format";

export default function HistoryPage() {
  const router = useRouter();
  const { history, clearHistory, removeHistoryEntry, settings, updateSettings, openVideo, pushNotice } = useApp();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => history.filter((record) => `${record.video.title} ${record.video.channel} ${record.video.description ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [history, query],
  );
  const days = useMemo(() => groupByDay(filtered), [filtered]);
  const resumable = history.find((record) => record.positionSeconds > 10) ?? history[0];

  return <div className="history-page">
    <div className="page-title-row">
      <div>
        <span className="eyebrow">Your activity</span>
        <h1>Watch history</h1>
        <p>Only saved in this browser. Clear it any time — nothing is uploaded anywhere.</p>
      </div>
      <div className="title-row-actions">
        <button
          className={`glass-button ${settings.pauseHistory ? "warn" : ""}`}
          onClick={() => { updateSettings({ pauseHistory: !settings.pauseHistory }); pushNotice(settings.pauseHistory ? "Watch history resumed" : "Watch history paused"); }}
          title="Pause recording of new watches"
        >
          {settings.pauseHistory ? <Play size={15} /> : <Pause size={15} />} {settings.pauseHistory ? "Resume history" : "Pause history"}
        </button>
        {history.length > 0 && <button className="glass-button danger" onClick={() => { if (window.confirm("Clear all watch history on this device?")) clearHistory(); }}><Trash2 size={15} /> Clear all</button>}
      </div>
    </div>

    {resumable && (
      <section className="resume-card glass-panel">
        <div className="resume-copy">
          <span className="eyebrow">{settings.pauseHistory ? "History is paused" : "Continue watching"}</span>
          <h2>{resumable.video.title}</h2>
          <p>{resumable.video.channel} · {formatDuration(resumable.positionSeconds)} in{resumable.video.duration ? ` of ${resumable.video.duration}` : ""}</p>
        </div>
        <div className="resume-progress"><span style={{ width: `${Math.min(100, (resumable.positionSeconds / Math.max(resumable.video.durationSeconds, 1)) * 100)}%` }} /></div>
        <button className="glass-button primary" onClick={() => { openVideo(resumable.video, true); router.push(`/watch?v=${resumable.video.id}&t=${Math.floor(resumable.positionSeconds)}`); }}><Play size={15} /> Resume</button>
      </section>
    )}

    {history.length > 0 && (
      <label className="history-search glass-input">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search watch history" aria-label="Search watch history" />
        {query && <button type="button" className="search-clear" aria-label="Clear" onClick={() => setQuery("")}><X size={15} /></button>}
      </label>
    )}

    {days.length ? days.map((day) => (
      <section className="history-day" key={day.key}>
        <div className="history-day-head">
          <h2><Clock3 size={15} /> {day.label}</h2>
          <span className="glass-chip micro">{day.records.length} {day.records.length === 1 ? "video" : "videos"}</span>
          <button className="glass-button ghost tiny" onClick={() => { day.records.forEach((record) => removeHistoryEntry(record.video.id)); pushNotice(`Removed ${day.label} from history`); }}>Remove {day.label.toLowerCase()}</button>
        </div>
        <div className="history-list">
          {day.records.map((record) => (
            <div className="history-item" key={record.video.id}>
              <VideoCard
                video={record.video}
                variant="row"
                progress={(record.positionSeconds / Math.max(record.video.durationSeconds, 1)) * 100}
                footer={<div className="history-details"><span>{new Date(record.watchedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {record.positionSeconds > 0 ? `${formatDuration(record.positionSeconds)} watched` : "just opened"}</span></div>}
              />
              <button className="glass-icon-button tiny history-remove" aria-label="Remove from history" onClick={() => removeHistoryEntry(record.video.id)}><X size={16} /></button>
            </div>
          ))}
        </div>
      </section>
    )) : (
      <div className="empty-state">
        <div className="empty-state-icon"><Clock3 size={24} /></div>
        <strong>{query ? "No history matches that search." : "Your watch history is empty"}</strong>
        <span>{settings.pauseHistory ? "History is paused right now, so nothing is being recorded." : "Videos you start watching will appear here, grouped by day."}</span>
      </div>
    )}
  </div>;
}
