"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Flame, Radio, Sparkles, TrendingUp } from "lucide-react";
import { categories, demoVideos, starterShorts } from "@/lib/demo-videos";
import { filterByCategory, isFresh } from "@/lib/feed";
import VideoGrid from "@/components/VideoGrid";
import VideoRail from "@/components/VideoRail";
import CategoryRail from "@/components/CategoryRail";
import SectionHeading from "@/components/SectionHeading";

export default function ExplorePage() {
  const [category, setCategory] = useState("All");
  const videos = useMemo(() => {
    const pool = filterByCategory(demoVideos, category);
    return pool.length ? pool : demoVideos.slice(0, 8);
  }, [category]);
  const fresh = useMemo(() => demoVideos.filter((video) => isFresh(video.published, 30)), []);
  const live = useMemo(() => demoVideos.filter((video) => video.isLive), []);

  return <div className="explore-page">
    <div className="explore-hero glass-panel">
      <div className="explore-hero-icon"><Compass size={23} /></div>
      <span className="eyebrow">Explore</span>
      <h1>See what&apos;s out there.</h1>
      <p>Jump into something new — live radios, fresh uploads, vertical clips and creator picks, all in the same frosted shell.</p>
      <div className="explore-stats">
        <span><Flame size={15} /> {videos.length} in {category}</span>
        <span><Radio size={15} /> {live.length} live now</span>
        <span><Sparkles size={15} /> {fresh.length} fresh this month</span>
      </div>
      <div className="explore-hero-actions">
        <Link href="/shorts" className="glass-button primary">Open the Shorts feed</Link>
        <Link href="/search" className="glass-button">Search YouTube metadata</Link>
      </div>
    </div>

    <CategoryRail items={categories} active={category} onSelect={setCategory} label="Explore categories" />

    <section className="feed-section">
      <SectionHeading eyebrow="Explore videos" title={category === "All" ? "A little bit of everything" : category} />
      <VideoGrid videos={videos} />
    </section>

    <section className="feed-section">
      <SectionHeading eyebrow="Last 30 days" title="Recently uploaded" action="Home feed" href="/" />
      <VideoRail videos={fresh.length ? fresh : demoVideos.slice(0, 6)} />
    </section>

    <section className="feed-section">
      <SectionHeading eyebrow="Vertical" title="Shorts to burn" action="Full feed" href="/shorts" />
      <div className="shorts-grid">{starterShorts.slice(0, 8).map((video) => (
        <Link key={video.id} className="short-tile glass-panel" href={`/shorts?v=${video.id}`}>
          <span className="short-tile-media"><img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" /><span className="short-tile-shade" /></span>
          <strong>{video.title}</strong>
          <small>{video.views}</small>
        </Link>
      ))}</div>
    </section>

    <section className="home-footer-note"><TrendingUp size={17} /><span>Explore is powered by the same metadata search as the search page — results refresh as YouTube changes.</span></section>
  </div>;
}
