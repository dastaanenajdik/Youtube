"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { categories, demoVideos, localSearch } from "@/lib/demo-videos";
import type { Video } from "@/lib/types";
import { useApp } from "@/components/Providers";
import VideoGrid from "@/components/VideoGrid";
import VideoCard from "@/components/VideoCard";
import SectionHeading from "@/components/SectionHeading";

export default function HomePage() {
  const { searchHistory, history, cacheVideos, hydrated } = useApp();
  const [category, setCategory] = useState("All");
  const [personalized, setPersonalized] = useState<Video[]>([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const lastSearch = searchHistory[0];

  useEffect(() => {
    if (!hydrated || !lastSearch) {
      setPersonalized([]);
      return;
    }
    const controller = new AbortController();
    setPersonalizedLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(lastSearch)}&limit=8`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as { videos?: Video[] };
        if (response.ok && result.videos?.length) {
          setPersonalized(result.videos);
          cacheVideos(result.videos);
        } else setPersonalized(localSearch(lastSearch).slice(0, 8));
      })
      .catch(() => { if (!controller.signal.aborted) setPersonalized(localSearch(lastSearch).slice(0, 8)); })
      .finally(() => setPersonalizedLoading(false));
    return () => controller.abort();
  }, [hydrated, lastSearch, cacheVideos]);

  const filteredVideos = useMemo(() => {
    const items = category === "All" ? demoVideos : demoVideos.filter((video) => video.category === category || (category === "Live" && video.isLive));
    return items.length ? items : demoVideos.slice(0, 8);
  }, [category]);
  const continueWatching = history.filter((item) => item.positionSeconds > 20).slice(0, 4);

  return <div className="home-page">
    <section className="welcome-hero glass-panel">
      <div className="hero-copy">
        <span className="hero-kicker"><Sparkles size={14} /> YOUR VIDEO UNIVERSE</span>
        <h1>Find your next <span>favorite.</span></h1>
        <p>A familiar video home, with your saved library and watch parties close at hand.</p>
        <div className="hero-actions">
          <Link href="/explore" className="button-primary">Explore videos <ArrowRight size={16} /></Link>
          <Link href="/rooms" className="button-soft">Watch together</Link>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="hero-play"><span /></div>
        <span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✧</span>
        <span className="hero-caption">press play<br />and wander</span>
      </div>
      <div className="hero-glow" />
    </section>

    <div className="category-strip" aria-label="Video categories">
      {categories.map((item) => <button key={item} className={category === item ? "category-chip active" : "category-chip"} onClick={() => setCategory(item)}>{item}</button>)}
    </div>

    {lastSearch && <section className="feed-section personalized-section">
      <SectionHeading eyebrow="Picked for you" title={`Because you searched for “${lastSearch}”`} action="Search again" href={`/search?q=${encodeURIComponent(lastSearch)}`} />
      {personalizedLoading && !personalized.length ? <div className="video-grid">{Array.from({ length: 4 }, (_, index) => <div className="video-skeleton" key={index} />)}</div> : <VideoGrid videos={personalized.length ? personalized : localSearch(lastSearch).slice(0, 8)} emptyMessage="Search a few topics and your home feed will learn what to show." />}
    </section>}

    {continueWatching.length > 0 && <section className="feed-section continue-section">
      <SectionHeading eyebrow="Pick up where you left off" title="Continue watching" action="View history" href="/history" />
      <div className="video-grid">{continueWatching.map(({ video, positionSeconds }) => <div className="continue-card" key={video.id}><VideoCard video={video} /><div className="continue-progress"><span style={{ width: `${Math.min(100, (positionSeconds / Math.max(video.durationSeconds, 1)) * 100)}%` }} /></div></div>)}</div>
    </section>}

    <section className="feed-section">
      <SectionHeading eyebrow={category === "All" ? "Fresh picks" : category} title={category === "All" ? "Popular right now" : `${category} videos`} action="Explore all" href="/explore" />
      <VideoGrid videos={filteredVideos} />
    </section>

    <section className="home-footer-note"><TrendingUp size={17} /><span>Recommendations on this demo are shaped by searches saved in this browser.</span></section>
  </div>;
}
