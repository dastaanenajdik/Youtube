"use client";

import { Check, HardDrive, LockKeyhole, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/Providers";

export default function SettingsPage() {
  const { history, clearHistory, searchHistory, pushNotice, roomSession } = useApp();
  return <div className="settings-page">
    <div className="page-title-row"><div><span className="eyebrow">Preferences</span><h1>Settings</h1><p>Control your local experience and see how this demo handles data.</p></div></div>
    <div className="settings-list">
      <section className="settings-card glass-panel"><div className="settings-card-icon"><LockKeyhole size={19} /></div><div><h2>Privacy on this device</h2><p>Your searches, history, likes, Watch later, playlists and private notes stay in this browser&apos;s local storage.</p></div><span className="settings-status"><Check size={14} /> Local only</span></section>
      <section className="settings-card glass-panel"><div className="settings-card-icon"><ShieldCheck size={19} /></div><div><h2>YouTube playback</h2><p>Video plays in YouTube&apos;s official embedded player. YouTube may show ads; this app does not block or remove them.</p></div><span className="settings-status"><Check size={14} /> Official embed</span></section>
      <section className="settings-card glass-panel"><div className="settings-card-icon"><HardDrive size={19} /></div><div className="settings-card-copy"><h2>Local activity</h2><p>{history.length} watched videos · {searchHistory.length} recent searches</p><button className="button-soft" onClick={() => { if (window.confirm("Clear watch history stored on this device?")) { clearHistory(); pushNotice("Watch history cleared."); } }}>Clear watch history</button></div></section>
      <section className="settings-card glass-panel"><div className="settings-card-icon"><Check size={19} /></div><div><h2>Watch-together room status</h2><p>The room status banner appears while you are in a shared session.</p></div><span className="settings-status">{roomSession ? "In a room" : "Ready"}</span></section>
    </div>
  </div>;
}
