"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, History, PlaySquare, Radio, Sparkles, TrendingUp } from "lucide-react";
import { categories, demoVideos, localSearch, starterShorts } from "@/lib/demo-videos";
import { countValue, filterByCategory, rankByAffinity, takeEvery } from "@/lib/feed";
import type { Video } from "@/lib/types";
import { useApp } from "@/components/Providers";
import VideoGrid from "@/components/VideoGrid";
import VideoCard from "@/components/VideoCard";
import VideoRail from "@/components/VideoRail";
import CategoryRail from "@/components/CategoryRail";
import ShortsShelf from "@/components/ShortsShelf";
import SectionHeading from "@/components/SectionHeading";

export default function HomePage() {
  const router = useRouter();
  const { searchHistory, history, likedIds, subscribedChannels, cacheVideos, hydrated } = useApp();
  const [category, setCategory] = useState("All");
  const [personalized, setPersonalized] = useState<Video[]>([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [hideShorts, setHideShorts] = useState(false);
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

  const feedVideos = useMemo(() => {
    const pool = category === "All"
      ? demoVideos
      : category === "Recently uploaded"
        ? demoVideos.filter((video) => /hour|day|week|ago/i.test(video.published))
        : filterByCategory(demoVideos, category);
    const ranked = rankByAffinity(pool.length ? pool : demoVideos.slice(0, 8), {
      channels: subscribedChannels,
      likedIds,
      searches: searchHistory,
      watchedIds: history.map((record) => record.video.id),
    });
    return ranked;
  }, [category, subscribedChannels, likedIds, searchHistory, history]);

  const trending = useMemo(() => [...demoVideos].sort((a, b) => countValue(b.views) - countValue(a.views)).slice(0, 8), []);
  const shorts = useMemo(() => takeEvery(starterShorts, hideShorts ? 0 : 10), [hideShorts]);
  const continueWatching = history.filter((item) => item.positionSeconds > 20).slice(0, 4);

  const openShort = useCallback((video: Video, index: number) => {
    cacheVideos([video]);
    router.push(`/shorts?v=${encodeURIComponent(video.id)}&i=${index}`);
  }, [cacheVideos, router]);

  return <div className="home-page">
    <section className="welcome-hero glass-panel">
      <div className="hero-copy">
        <span className="hero-kicker"><Sparkles size={14} /> FROSTED GLASS BUILD</span>
        <h1>Find your next <span>favorite.</span></h1>
        <p>The whole YouTube shell rebuilt in glass: every button, chip, drawer and player control is frosted. Your library, queue and watch parties stay on this device.</p>
        <div className="hero-actions">
          <Link href="/explore" className="glass-button primary">Explore videos <ArrowRight size={16} /></Link>
          <Link href="/rooms" className="glass-button">Watch together <Radio size={15} /></Link>
          <Link href="/shorts" className="glass-button">Shorts <PlaySquare size={15} /></Link>
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

    <CategoryRail items={categories} active={category} onSelect={setCategory} />

    {continueWatching.length > 0 && <section className="feed-section continue-section">
      <SectionHeading eyebrow="Pick up where you left off" title="Continue watching" action="View history" href="/history" />
      <div className="video-grid">{continueWatching.map(({ video, positionSeconds }) => (
        <VideoCard key={video.id} video={video} progress={(positionSeconds / Math.max(video.durationSeconds, 1)) * 100} />
      ))}</div>
    </section>}

    {lastSearch && <section className="feed-section personalized-section">
      <SectionHeading eyebrow="Picked for you" title={`Because you searched for “${lastSearch}”`} action="Search again" href={`/search?q=${encodeURIComponent(lastSearch)}`} />
      {personalizedLoading && !personalized.length
        ? <div className="video-grid">{Array.from({ length: 4 }, (_, index) => <div className="video-skeleton" key={index} />)}</div>
        : <VideoGrid videos={personalized.length ? personalized : localSearch(lastSearch).slice(0, 8)} emptyMessage="Search a few topics and your home feed will learn what to show." />}
    </section>}

    <section className="feed-section">
      <SectionHeading eyebrow={category === "All" ? "Fresh picks" : category} title={category === "All" ? "Popular right now" : `${category} videos`} action="Explore all" href="/explore" />
      <VideoGrid videos={feedVideos} />
    </section>

    {!hideShorts && shorts.length > 0 && (
      <ShortsShelf videos={shorts} onOpen={openShort} onDismiss={() => setHideShorts(true)} eyebrow="Because you like quick watches" />
    )}

    <section className="feed-section">
      <SectionHeading eyebrow="What the internet is watching" title="Trending rail" action="See everything" href="/explore" />
      <VideoRail videos={trending} />
    </section>

    {hideShorts && (
      <p className="shelf-restore"><button onClick={() => setHideShorts(false)}><PlaySquare size={14} /> Bring the Shorts shelf back</button></p>
    )}

    <section className="home-footer-note"><TrendingUp size={17} /><span>Recommendations here are shaped by the searches, likes and subscriptions saved in this browser.</span><Link href="/history" className="section-action"><History size={14} /> Your activity</Link></section>
  </div>;
}
