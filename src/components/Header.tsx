"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Menu, Mic, Search, Video, X } from "lucide-react";
import { useApp } from "./Providers";

const suggestions = ["music videos", "lofi study music", "travel inspiration", "technology reviews"];

export default function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { searchHistory, rememberSearch, pushNotice } = useApp();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === "/search") setQuery(searchParams.get("q") ?? "");
    else setQuery("");
  }, [pathname, searchParams]);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (!searchAreaRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const runSearch = (value = query) => {
    const clean = value.trim();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    rememberSearch(clean);
    setQuery(clean);
    setFocused(false);
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const matching = searchHistory.filter((item) => !query || item.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const showSuggestions = focused && (matching.length > 0 || query.length === 0);

  return (
    <header className="topbar glass-bar">
      <div className="topbar-leading">
        <button className="icon-button menu-toggle" aria-label="Open navigation" onClick={onMenu}><Menu size={21} /></button>
        <div className="mobile-brand"><span className="brand-mark"><span /></span><b>YouTube<span>Glass</span></b></div>
      </div>
      <div className="search-area" ref={searchAreaRef}>
        <form className={`search-form ${focused ? "search-active" : ""}`} onSubmit={submit} role="search">
          <Search className="search-leading" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            aria-label="Search videos"
            placeholder="Search videos, creators, and more"
            autoComplete="off"
          />
          {query && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><X size={16} /></button>}
          <button type="submit" className="search-submit" aria-label="Search"><Search size={19} /></button>
        </form>
        {showSuggestions && (
          <div className="search-suggestions glass-panel">
            {matching.length > 0 && <div className="suggestion-label">Recent searches</div>}
            {matching.map((item) => <button key={item} onClick={() => runSearch(item)}><Search size={15} /><span>{item}</span></button>)}
            {!query && matching.length === 0 && <div className="suggestion-label">Try something new</div>}
            {!query && matching.length === 0 && suggestions.map((item) => <button key={item} onClick={() => runSearch(item)}><Search size={15} /><span>{item}</span></button>)}
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <button className="icon-button create-action" aria-label="Create" title="Create" onClick={() => pushNotice("Creator uploads are not part of this demo yet.")}><Video size={19} /></button>
        <button className="icon-button voice-search" aria-label="Voice search" title="Voice search" onClick={() => pushNotice("Voice search is not enabled in this demo.")}><Mic size={19} /></button>
        <button className="icon-button notification-action" aria-label="Notifications" title="Notifications" onClick={() => pushNotice("You're all caught up.")}><Bell size={19} /><i /></button>
        <button className="profile-button" aria-label="Your profile" title="Your profile">A</button>
      </div>
    </header>
  );
}
