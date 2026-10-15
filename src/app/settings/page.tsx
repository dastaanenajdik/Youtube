"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Check, Clock3, HardDrive, LockKeyhole, Moon, Palette, Repeat2, ShieldCheck, Sparkles, Sun, Trash2, Users } from "lucide-react";
import { ACCENTS, useApp } from "@/components/Providers";
import type { AccentName } from "@/lib/types";

export default function SettingsPage() {
  const { history, clearHistory, searchHistory, pushNotice, roomSession, settings, updateSettings, queue, clearQueue, comments, likedIds, watchLaterIds, playlists, subscribedChannels, notifications } = useApp();
  const storedEntries = [likedIds, watchLaterIds, playlists.map((playlist) => playlist.id), subscribedChannels, queue.map((entry) => entry.video.id), Object.keys(comments)].reduce((total, list) => total + list.length, 0);

  const wipe = () => {
    if (!window.confirm("Delete every local record on this device? (History, likes, playlists, comments, queue, settings)")) return;
    Object.keys(window.localStorage).filter((key) => key.startsWith("ytglass.")).forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  };

  return <div className="settings-page">
    <div className="page-title-row">
      <div><span className="eyebrow">Preferences</span><h1>Settings</h1><p>Everything here is applied instantly and stored in this browser only.</p></div>
    </div>
    <div className="settings-list">
      <section className="settings-card glass-panel">
        <div className="settings-card-icon">{settings.theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}</div>
        <div>
          <h2>Glass finish</h2>
          <p>Dark glass keeps the frosting on a near-black room. Light glass flips the backdrop to frosted daylight while keeping the same blur, border and highlight.</p>
          <div className="settings-row">
            <div className="glass-toggle">
              <button type="button" className={settings.theme === "dark" ? "active" : ""} onClick={() => updateSettings({ theme: "dark" })}><Moon size={14} /> Dark</button>
              <button type="button" className={settings.theme === "light" ? "active" : ""} onClick={() => updateSettings({ theme: "light" })}><Sun size={14} /> Light</button>
            </div>
            <Palette size={15} className="settings-inline-icon" />
            <div className="accent-picker">
              {(Object.keys(ACCENTS) as AccentName[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`accent-swatch ${settings.accent === key ? "active" : ""}`}
                  style={{ "--swatch": ACCENTS[key].swatch } as CSSProperties}
                  title={ACCENTS[key].label}
                  aria-label={`Accent ${ACCENTS[key].label}`}
                  onClick={() => updateSettings({ accent: key })}
                >
                  <i />
                  {ACCENTS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <span className="settings-status"><Check size={14} /> {ACCENTS[settings.accent].label}</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><Sparkles size={19} /></div>
        <div>
          <h2>Motion</h2>
          <p>Aurora drift, card lift and glass shine can be dialled down — or off — without losing the frosting.</p>
          <div className="settings-row">
            <button type="button" className={`glass-button ${!settings.reduceMotion ? "active" : ""}`} onClick={() => updateSettings({ reduceMotion: false })}><Sparkles size={14} /> Full motion</button>
            <button type="button" className={`glass-button ${settings.reduceMotion ? "active" : ""}`} onClick={() => updateSettings({ reduceMotion: true })}><ShieldCheck size={14} /> Reduced</button>
          </div>
        </div>
        <span className="settings-status">{settings.reduceMotion ? "Calm" : "Animated"}</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><Repeat2 size={19} /></div>
        <div>
          <h2>Playback</h2>
          <p>Autoplay pulls the next video from your queue when a clip ends. Pausing history stops this app from recording what you watch.</p>
          <div className="settings-row">
            <button type="button" className={`glass-button ${settings.autoplay ? "active" : ""}`} onClick={() => updateSettings({ autoplay: !settings.autoplay })}>Autoplay {settings.autoplay ? "on" : "off"}</button>
            <button type="button" className={`glass-button ${settings.pauseHistory ? "active" : ""}`} onClick={() => updateSettings({ pauseHistory: !settings.pauseHistory })}><Clock3 size={14} /> History {settings.pauseHistory ? "paused" : "recording"}</button>
          </div>
        </div>
        <span className="settings-status">{queue.length} queued</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><Users size={19} /></div>
        <div>
          <h2>Notifications</h2>
          <p>The bell is generated from the channels you subscribe to inside this demo — {notifications.length} item{notifications.length === 1 ? "" : "s"} right now.</p>
          <div className="settings-row">
            <Link href="/subscriptions" className="glass-button">Manage subscriptions ({subscribedChannels.length})</Link>
            {queue.length > 0 && <button type="button" className="glass-button" onClick={() => { clearQueue(); pushNotice("Queue cleared"); }}><Trash2 size={14} /> Clear queue</button>}
          </div>
        </div>
        <span className="settings-status">{subscribedChannels.length ? "Live" : "Empty"}</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><LockKeyhole size={19} /></div>
        <div>
          <h2>Privacy on this device</h2>
          <p>Searches, history, likes, Watch later, playlists, comments and queue live in <code>localStorage</code> under <code>ytglass.*</code>. No accounts, no sync, no analytics.</p>
        </div>
        <span className="settings-status"><Check size={14} /> Local only</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><ShieldCheck size={19} /></div>
        <div>
          <h2>YouTube playback</h2>
          <p>Videos play in YouTube&apos;s official embedded player. YouTube decides the ads and availability; this app never blocks, skips or strips them, and embeds can be refused by the uploader.</p>
        </div>
        <span className="settings-status"><Check size={14} /> Official embed</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon"><HardDrive size={19} /></div>
        <div className="settings-card-copy">
          <h2>Local data</h2>
          <p>{history.length} watched · {searchHistory.length} searches · {Object.keys(comments).length} commented videos · {storedEntries} saved records</p>
          <div className="settings-row">
            <button className="glass-button" onClick={() => { if (window.confirm("Clear watch history stored on this device?")) { clearHistory(); pushNotice("Watch history cleared."); } }}><Trash2 size={14} /> Clear watch history</button>
            <button className="glass-button danger" onClick={wipe}><Trash2 size={14} /> Delete everything</button>
          </div>
        </div>
        <span className="settings-status">{roomSession ? "In a room" : "Ready"}</span>
      </section>

      <section className="settings-card glass-panel">
        <div className="settings-card-icon">©</div>
        <div>
          <h2>About this build</h2>
          <p>Layout, page set and the whole &quot;YouTube feel&quot; are reworked from <a href="https://github.com/omavcher/YouTube-Clone" target="_blank" rel="noreferrer">omavcher/YouTube-Clone</a> (MIT) — home rows with chips, the Shorts rail, history, and the full channel page — rebuilt on Next.js, React, TypeScript and the IFrame API, then re-skinned entirely as frosted glass.</p>
        </div>
      </section>
    </div>
  </div>;
}
