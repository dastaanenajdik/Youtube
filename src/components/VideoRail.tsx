"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Video } from "@/lib/types";
import VideoCard from "./VideoCard";

/**
 * A horizontally scrolling rail — the clone's four-per-row grid, but frosted and
 * draggable, with glass arrow buttons for the overflow.
 */
export default function VideoRail({ videos, prefetchNext, emptyMessage = "Nothing to show in this rail yet." }: { videos: Video[]; prefetchNext?: () => void; emptyMessage?: string }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({ start: rail.scrollLeft <= 4, end: max <= 4 || rail.scrollLeft >= max - 4 });
    if (prefetchNext && max - rail.scrollLeft < 320) prefetchNext();
  }, [prefetchNext]);

  useEffect(() => {
    measure();
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [measure, videos.length]);

  const nudge = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(320, rail.clientWidth * 0.8), behavior: "smooth" });
    window.setTimeout(measure, 340);
  };

  if (!videos.length) return <div className="empty-state compact"><div className="empty-state-icon">▶</div><strong>{emptyMessage}</strong></div>;

  return (
    <div className={`video-rail ${edges.start ? "at-start" : ""} ${edges.end ? "at-end" : ""}`}>
      {!edges.start && <button className="glass-icon-button round rail-arrow left" aria-label="Scroll left" onClick={() => nudge(-1)}><ChevronLeft size={18} /></button>}
      <div className="rail-track" ref={railRef} onScroll={measure}>
        {videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
      {!edges.end && <button className="glass-icon-button round rail-arrow right" aria-label="Scroll right" onClick={() => nudge(1)}><ChevronRight size={18} /></button>}
    </div>
  );
}
