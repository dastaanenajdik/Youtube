"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { localSearch } from "@/lib/demo-videos";
import type { Video } from "@/lib/types";
import { sortVideos, type SortMode } from "@/lib/feed";
import { useApp } from "./Providers";
import VideoCard from "./VideoCard";
import CategoryRail from "./CategoryRail";

const filters = ["All", "Videos", "Shorts", "Live", "Recently uploaded"];

function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const { cacheVideos, rememberSearch, searchHistory } = useApp();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<SortMode>("relevance");

  useEffect(() => {
    if (!query) {
      setVideos([]);
      setError("");
      return;
    }
    rememberSearch(query);
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=24`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as { videos?: Video[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Search is temporarily unavailable.");
        const found = result.videos ?? [];
        setVideos(found);
        cacheVideos(found);
      })
      .catch((problem: unknown) => {
        if (controller.signal.aborted) return;
        setVideos(localSearch(query));
        setError(problem instanceof Error ? `${problem.message} Showing local picks where available.` : "Live search is unavailable. Showing local picks where available.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, cacheVideos, rememberSearch]);

  const filtered = useMemo(() => {
    let pool = videos;
    if (filter === "Shorts") pool = pool.filter((video) => video.isShort || (video.durationSeconds > 0 && video.durationSeconds <= 60));
    if (filter === "Live") pool = pool.filter((video) => video.isLive);
    if (filter === "Videos") pool = pool.filter((video) => !video.isLive && !video.isShort);
    if (filter === "Recently uploaded") pool = pool.filter((video) => /hour|day|week|month/i.test(video.published));
    return sortVideos(pool, sort);
  }, [videos, filter, sort]);

  const recentSuggestions = searchHistory.slice(0, 6);

  return <div className="search-page">
    <div className="page-title-row search-page-title">
      <div><span className="eyebrow">Discover</span><h1>{query ? <>Results for <span className="title-accent">“{query}”</span></> : "Search videos"}</h1><p>{query ? "Videos from across YouTube, ready to watch." : "Search for creators, music, learning, live streams and more."}</p></div>
      <div className="title-row-actions">
        <button className="glass-button" title="Toggle filters" onClick={() => setFilter(filter === "All" ? "Videos" : "All")}><SlidersHorizontal size={16} /> Filters</button>
        {query && <a className="glass-button" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15} /> Search on YouTube</a>}
      </div>
    </div>
    {!query && <div className="search-empty glass-panel">
      <div className="search-empty-icon"><Search size={23} /></div><h2>What would you like to watch?</h2><p>Your recent searches are kept only in this browser.</p>
      <div className="recent-search-chips">{recentSuggestions.length ? recentSuggestions.map((item) => <a key={item} href={`/search?q=${encodeURIComponent(item)}`}><Search size={14} />{item}</a>) : <span>Try “lofi study music” or “technology”.</span>}</div>
    </div>}
    {query && <>
      <div className="search-filter-row">
        <CategoryRail items={filters} active={filter} onSelect={setFilter} label="Result type" />
        <CategoryRail items={["relevance", "views", "newest", "duration"]} active={sort} onSelect={(value) => setSort(value as SortMode)} label="Sort results" />
      </div>
      {error && <div className="inline-warning">{error}</div>}
      {loading && videos.length === 0 ? <div className="search-skeletons">{Array.from({ length: 6 }, (_, index) => <div className="row-skeleton" key={index} />)}</div> : filtered.length ? <div className="search-results">{filtered.map((video) => <VideoCard key={video.id} video={video} variant="row" />)}</div> : <div className="empty-state"><div className="empty-state-icon">⌕</div><strong>{filter === "Shorts" ? "No Shorts were found in this result set." : "No matching videos found."}</strong><span>Try a different phrase, change the sort, or open the same query on YouTube.</span><a className="glass-button primary" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15} /> Search on YouTube</a></div>}
      {loading && videos.length > 0 && <span className="loading-indicator">Refreshing results…</span>}
    </>}
  </div>;
}

export default function SearchPageClient() {
  return <Suspense fallback={<div className="page-loading">Loading search…</div>}><SearchResults /></Suspense>;
}
