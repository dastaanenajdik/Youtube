"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Command as CommandIcon, CornerDownLeft, Moon, Play, Search, Settings2, Sparkles, Sun } from "lucide-react";
import { useApp } from "./Providers";
import { allDemoVideos } from "@/lib/demo-videos";
import { dedupeVideos } from "@/lib/feed";

interface PaletteItem {
  id: string;
  group: "Pages" | "Actions" | "Watch next" | "Search";
  label: string;
  hint?: string;
  icon: "page" | "action" | "video" | "search";
  run: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen, videos, history, openVideo, updateSettings, settings, pushNotice } = useApp();
  const [term, setTerm] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setTerm("");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [paletteOpen]);

  const pool = useMemo(() => {
    const recent = history.slice(0, 6).map((record) => record.video);
    return dedupeVideos([...recent, ...Object.values(videos), ...allDemoVideos()]).slice(0, 60);
  }, [history, videos]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => { router.push(href); setPaletteOpen(false); };
    const needle = term.trim().toLowerCase();
    const pages: PaletteItem[] = [
      { id: "p-home", group: "Pages", label: "Home feed", icon: "page", run: go("/") },
      { id: "p-shorts", group: "Pages", label: "Shorts feed", icon: "page", run: go("/shorts") },
      { id: "p-channel", group: "Pages", label: "Your channel", icon: "page", run: go("/channel") },
      { id: "p-library", group: "Pages", label: "Your library", icon: "page", run: go("/library") },
      { id: "p-history", group: "Pages", label: "Watch history", icon: "page", run: go("/history") },
      { id: "p-subs", group: "Pages", label: "Subscriptions", icon: "page", run: go("/subscriptions") },
      { id: "p-rooms", group: "Pages", label: "Watch together rooms", icon: "page", run: go("/rooms") },
      { id: "p-explore", group: "Pages", label: "Explore", icon: "page", run: go("/explore") },
      { id: "p-settings", group: "Pages", label: "Settings", icon: "page", run: go("/settings") },
    ];
    const actions: PaletteItem[] = [
      {
        id: "a-theme",
        group: "Actions",
        label: settings.theme === "dark" ? "Switch to light glass" : "Switch to dark glass",
        icon: "action",
        run: () => { updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" }); setPaletteOpen(false); },
      },
      {
        id: "a-motion",
        group: "Actions",
        label: settings.reduceMotion ? "Turn animations back on" : "Calm the animations",
        icon: "action",
        run: () => { updateSettings({ reduceMotion: !settings.reduceMotion }); setPaletteOpen(false); },
      },
      {
        id: "a-autoplay",
        group: "Actions",
        label: settings.autoplay ? "Turn autoplay off" : "Turn autoplay on",
        icon: "action",
        run: () => { updateSettings({ autoplay: !settings.autoplay }); setPaletteOpen(false); pushNotice("Playback preference saved on this device"); },
      },
    ];
    const videoItems: PaletteItem[] = pool.map((video) => ({
      id: `v-${video.id}`,
      group: "Watch next" as const,
      label: video.title,
      hint: video.channel,
      icon: "video" as const,
      run: () => { openVideo(video, true); router.push(`/watch?v=${video.id}`); setPaletteOpen(false); },
    }));
    const search: PaletteItem[] = needle
      ? [
        { id: "s-app", group: "Search", label: `Search “${term.trim()}” in this app`, icon: "search", run: go(`/search?q=${encodeURIComponent(term.trim())}`) },
        {
          id: "s-yt",
          group: "Search",
          label: `Search “${term.trim()}” on YouTube`,
          icon: "search",
          run: () => { window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term.trim())}`, "_blank", "noopener"); setPaletteOpen(false); },
        },
      ]
      : [];
    return [...pages, ...actions, ...videoItems, ...search].filter((item) => !needle || item.label.toLowerCase().includes(needle) || item.hint?.toLowerCase().includes(needle));
  }, [term, pool, router, setPaletteOpen, settings.theme, settings.reduceMotion, settings.autoplay, updateSettings, openVideo, pushNotice]);

  const visible = items.slice(0, 14);

  useEffect(() => {
    if (cursor > visible.length - 1) setCursor(0);
  }, [cursor, visible.length]);

  if (!paletteOpen) return null;

  const groups = ["Pages", "Actions", "Watch next", "Search"] as const;

  return (
    <div className="palette-scrim" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={() => setPaletteOpen(false)}>
      <div className="palette glass-pop" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input">
          <CommandIcon size={17} />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => { setTerm(event.target.value); setCursor(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setCursor((value) => Math.min(value + 1, visible.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setCursor((value) => Math.max(value - 1, 0)); }
              if (event.key === "Enter") { event.preventDefault(); visible[cursor]?.run(); }
              if (event.key === "Escape") setPaletteOpen(false);
            }}
            placeholder="Jump to a page, run an action, or find a video…"
            aria-label="Command palette search"
          />
          <button className="glass-icon-button tiny" aria-label="Close command palette" onClick={() => setPaletteOpen(false)}><Search size={15} /></button>
        </div>
        <div className="palette-list">
          {groups.map((group) => {
            const inGroup = visible.filter((item) => item.group === group);
            if (!inGroup.length) return null;
            return (
              <section key={group}>
                <span className="glass-menu-label">{group}</span>
                {inGroup.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`palette-row ${visible[cursor]?.id === item.id ? "cursor" : ""}`}
                    onMouseEnter={() => setCursor(visible.findIndex((entry) => entry.id === item.id))}
                    onClick={item.run}
                  >
                    <span className="palette-icon">
                      {item.icon === "video" ? <Play size={13} /> : item.icon === "search" ? <Search size={14} /> : item.icon === "action" ? (item.id === "a-motion" ? <Sparkles size={14} /> : item.id === "a-autoplay" ? <Clock3 size={14} /> : settings.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />) : <Settings2 size={14} />}
                    </span>
                    <span className="palette-label">{item.label}</span>
                    {item.hint && <small>{item.hint}</small>}
                    {visible[cursor]?.id === item.id && <CornerDownLeft size={14} className="palette-enter" />}
                  </button>
                ))}
              </section>
            );
          })}
          {!visible.length && <p className="palette-empty">Nothing matches that. Try “shorts”, “history” or a video title.</p>}
        </div>
        <footer className="palette-foot"><span>↑ ↓ to move</span><span>Enter to run</span><span>Esc to close</span></footer>
      </div>
    </div>
  );
}
