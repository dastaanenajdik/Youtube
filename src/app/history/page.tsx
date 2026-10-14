"use client";

import { useMemo, useState } from "react";
import { Clock3, Search, Trash2 } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { useApp } from "@/components/Providers";

export default function HistoryPage() {
  const { history, clearHistory, removeHistoryEntry } = useApp();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => history.filter((record) => `${record.video.title} ${record.video.channel}`.toLowerCase().includes(query.toLowerCase())), [history, query]);
  return <div className="history-page">
    <div className="page-title-row"><div><span className="eyebrow">Your activity</span><h1>Watch history</h1><p>Only saved in this browser. Your history is private to this device.</p></div>{history.length > 0 && <button className="button-soft danger-soft" onClick={() => { if (window.confirm("Clear all watch history on this device?")) clearHistory(); }}><Trash2 size={16} /> Clear history</button>}</div>
    {history.length > 0 && <label className="history-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search watch history" /></label>}
    {filtered.length ? <div className="history-list">{filtered.map((record) => <div className="history-item" key={record.video.id}><VideoCard video={record.video} variant="row" /><div className="history-details"><span><Clock3 size={14} /> Watched {new Date(record.watchedAt).toLocaleString()}</span>{record.positionSeconds > 0 && <div className="history-progress"><i style={{ width: `${Math.min(100, (record.positionSeconds / Math.max(record.video.durationSeconds, 1)) * 100)}%` }} /></div>}</div><button className="icon-button tiny" aria-label="Remove from history" onClick={() => removeHistoryEntry(record.video.id)}><Trash2 size={15} /></button></div>)}</div> : <div className="empty-state"><div className="empty-state-icon"><Clock3 size={24} /></div><strong>{query ? "No history matches that search." : "Your watch history is empty"}</strong><span>Videos you start watching will appear here.</span></div>}
  </div>;
}
