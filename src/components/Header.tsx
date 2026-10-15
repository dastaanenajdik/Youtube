"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell, Check, Command, LayoutGrid, Menu, Moon, Radio, RadioTower, Sparkles, Sun, UploadCloud, UserRound,
  History as HistoryIcon, Settings2, Video, Mic, Search, X,
} from "lucide-react";
import { useApp } from "./Providers";
import { timeAgo } from "@/lib/format";

const SUGGESTIONS = ["glassmorphism ui", "lofi study music", "standup comedy", "oneplus review", "bollywood full movie", "survival camping"];

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const registry = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return registry.SpeechRecognition ?? registry.webkitSpeechRecognition ?? null;
}

export default function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { searchHistory, rememberSearch, pushNotice, notifications, unreadCount, markNotificationsRead, settings, updateSettings, openPalette } = useApp();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [menu, setMenu] = useState<"" | "create" | "bell" | "profile">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (pathname === "/search") setQuery(searchParams.get("q") ?? "");
    else if (pathname !== "/watch") setQuery("");
  }, [pathname, searchParams]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!areaRef.current?.contains(event.target as Node)) setFocused(false);
      if (!rootRef.current?.contains(event.target as Node)) setMenu("");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenu(""); setFocused(false); return; }
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!typing && event.key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => () => { speechRef.current?.stop(); }, []);

  const runSearch = (value = query) => {
    const clean = value.trim();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    rememberSearch(clean);
    setQuery(clean);
    setFocused(false);
    setMenu("");
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const toggleListening = () => {
    const Factory = getSpeechRecognition();
    if (!Factory) {
      pushNotice("Voice search needs a Chromium browser — the mic is wired to the Web Speech API.");
      return;
    }
    if (listening) {
      speechRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new Factory();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index]?.[0]?.transcript ?? "").join(" ").trim();
      if (transcript) setQuery(transcript);
    };
    recognition.onend = () => {
      setListening(false);
      if (query.trim()) runSearch(query.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      pushNotice("I could not hear that — check the microphone permission.");
    };
    speechRef.current = recognition;
    setListening(true);
    setFocused(false);
    try {
      recognition.start();
      pushNotice("Listening… say what you want to watch");
    } catch {
      setListening(false);
    }
  };

  const matching = searchHistory.filter((item) => !query || item.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const showSuggestions = focused && !menu && (matching.length > 0 || query.length === 0);
  const openBell = () => {
    setMenu((value) => (value === "bell" ? "" : "bell"));
    if (unreadCount > 0) markNotificationsRead();
  };

  return (
    <header className="topbar glass-bar" ref={rootRef}>
      <div className="topbar-leading">
        <button className="glass-icon-button round menu-toggle" aria-label="Open navigation" onClick={onMenu}><Menu size={21} /></button>
        <Link href="/" className="mobile-brand" aria-label="YouTube Glass home"><span className="brand-mark"><span /></span><b>YouTube<span>Glass</span></b></Link>
      </div>

      <div className="search-area" ref={areaRef}>
        <form className={`search-form ${focused || listening ? "search-active" : ""}`} onSubmit={submit} role="search">
          <Search className="search-leading" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            aria-label="Search videos"
            placeholder={listening ? "Listening…" : "Search videos, creators and more"}
            autoComplete="off"
          />
          {query && !listening && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><X size={16} /></button>}
          <button
            type="button"
            className={`mic-button ${listening ? "listening" : ""}`}
            aria-label={listening ? "Stop listening" : "Search with your voice"}
            title={listening ? "Stop listening" : "Voice search"}
            onClick={toggleListening}
          >
            {listening ? <span className="mic-pulse" /> : <Mic size={17} />}
          </button>
          <button type="submit" className="search-submit" aria-label="Search"><Search size={19} /></button>
        </form>
        {showSuggestions && (
          <div className="search-suggestions glass-pop">
            {matching.length > 0 && <div className="suggestion-label">Recent searches</div>}
            {matching.map((item) => <button key={item} onClick={() => runSearch(item)}><Search size={15} /><span>{item}</span></button>)}
            {!query && matching.length === 0 && <div className="suggestion-label">Try something new</div>}
            {!query && matching.length === 0 && SUGGESTIONS.map((item) => <button key={item} onClick={() => runSearch(item)}><Search size={15} /><span>{item}</span></button>)}
            <button className="palette-hint" onClick={() => { setFocused(false); openPalette?.(); }}><Command size={14} /> Command palette <kbd>⌘K</kbd></button>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="glass-icon-button round create-action" aria-label="Create" title="Create" onClick={() => setMenu((value) => (value === "create" ? "" : "create"))}><Video size={19} /></button>
        {menu === "create" && (
          <div className="glass-pop popover create-pop">
            <span className="glass-menu-label">Create</span>
            <button onClick={() => { setMenu(""); router.push("/channel?tab=manage"); }}><UploadCloud size={16} /> Upload a video</button>
            <button onClick={() => { setMenu(""); router.push("/rooms"); }}><RadioTower size={16} /> Go live with a watch party</button>
            <button onClick={() => { setMenu(""); router.push("/channel?tab=community"); }}><LayoutGrid size={16} /> Post to the community</button>
            <p>Creator tools are a local mock — this demo never uploads to YouTube.</p>
          </div>
        )}
        <button className="glass-icon-button round voice-search" aria-label="Command palette" title="Command palette (⌘K)" onClick={() => openPalette?.()}><Command size={18} /></button>
        <button className="glass-icon-button round notification-action" aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"} title="Notifications" onClick={openBell}>
          <Bell size={19} />
          {unreadCount > 0 && <i className="badge-count">{unreadCount > 9 ? "9+" : unreadCount}</i>}
        </button>
        {menu === "bell" && (
          <div className="glass-pop popover bell-pop">
            <span className="glass-menu-label">Notifications</span>
            {notifications.length ? notifications.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => { setMenu(""); if (item.videoId) router.push(`/watch?v=${item.videoId}`); else router.push("/subscriptions"); }}>
                <span className={`notif-dot kind-${item.kind}`} />
                <span className="notif-copy"><strong>{item.channel}</strong><small>{item.title}</small></span>
                <em>{timeAgo(item.at)}</em>
              </button>
            )) : (
              <div className="popover-empty">
                <Radio size={18} />
                <p>Subscribe to a channel and its uploads land here.</p>
              </div>
            )}
            <Link href="/subscriptions" className="popover-foot" onClick={() => setMenu("")}>Manage subscriptions <Check size={13} /></Link>
          </div>
        )}
        <button className="glass-icon-button round theme-quick" aria-label={settings.theme === "dark" ? "Switch to light glass" : "Switch to dark glass"} title="Toggle theme" onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}>
          {settings.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="profile-button" aria-label="Your profile" title="Your profile" onClick={() => setMenu((value) => (value === "profile" ? "" : "profile"))}>A</button>
        {menu === "profile" && (
          <div className="glass-pop popover profile-pop">
            <div className="profile-head"><span className="user-avatar">A</span><div><strong>Glass viewer</strong><small>Signed in on this device</small></div></div>
            <Link href="/channel" onClick={() => setMenu("")}><UserRound size={16} /> Your channel</Link>
            <Link href="/library" onClick={() => setMenu("")}><HistoryIcon size={16} /> Your history</Link>
            <Link href="/settings" onClick={() => setMenu("")}><Settings2 size={16} /> Settings</Link>
            <button onClick={() => { setMenu(""); updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" }); }}>
              {settings.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {settings.theme === "dark" ? "Light glass" : "Dark glass"}
            </button>
            <button onClick={() => { setMenu(""); updateSettings({ reduceMotion: !settings.reduceMotion }); }}>
              <Sparkles size={16} /> {settings.reduceMotion ? "Turn motion back on" : "Calm the animations"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
