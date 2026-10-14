"use client";

import { useState } from "react";
import { Compass, Flame, Radio } from "lucide-react";
import { categories, demoVideos } from "@/lib/demo-videos";
import VideoGrid from "@/components/VideoGrid";
import SectionHeading from "@/components/SectionHeading";

export default function ExplorePage() {
  const [category, setCategory] = useState("All");
  const videos = category === "All" ? demoVideos : demoVideos.filter((video) => video.category === category || (category === "Live" && video.isLive));
  return <div className="explore-page">
    <div className="explore-hero glass-panel"><div className="explore-hero-icon"><Compass size={23} /></div><span className="eyebrow">Explore</span><h1>See what&apos;s out there.</h1><p>Jump into something new, from live broadcasts to music and creator picks.</p><div className="explore-stats"><span><Flame size={15} /> Trending picks</span><span><Radio size={15} /> Live now</span></div></div>
    <div className="category-strip">{categories.map((item) => <button key={item} className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <section className="feed-section"><SectionHeading eyebrow="Explore videos" title={category === "All" ? "A little bit of everything" : category} /><VideoGrid videos={videos.length ? videos : demoVideos.slice(0, 8)} /></section>
  </div>;
}
