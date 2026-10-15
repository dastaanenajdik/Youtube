"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The category chip rail from the classic clone, rebuilt as a frosted strip with
 * scroll arrows for the overflow (the original only had a single forward button).
 */
export default function CategoryRail({
  items,
  active,
  onSelect,
  label = "Video categories",
}: {
  items: string[];
  active: string;
  onSelect: (value: string) => void;
  label?: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({ start: rail.scrollLeft <= 4, end: max <= 4 || rail.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [measure, items.length]);

  const nudge = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(240, rail.clientWidth * 0.7), behavior: "smooth" });
    window.setTimeout(measure, 320);
  };

  return (
    <div className={`chip-rail ${edges.start ? "at-start" : ""} ${edges.end ? "at-end" : ""}`} aria-label={label}>
      <div className="chips glass-panel" ref={railRef} onScroll={measure}>
        {items.map((item) => (
          <button key={item} type="button" className={`glass-chip ${active === item ? "active" : ""}`} onClick={() => onSelect(item)}>
            {item}
          </button>
        ))}
      </div>
      {!edges.start && (
        <button className="glass-icon-button round chip-arrow left" aria-label="Scroll categories left" onClick={() => nudge(-1)}>
          <ChevronLeft size={17} />
        </button>
      )}
      {!edges.end && (
        <button className="glass-icon-button round chip-arrow right" aria-label="Scroll categories right" onClick={() => nudge(1)}>
          <ChevronRight size={17} />
        </button>
      )}
    </div>
  );
}
