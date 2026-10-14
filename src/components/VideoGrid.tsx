import type { Video } from "@/lib/types";
import VideoCard from "./VideoCard";

export default function VideoGrid({ videos, emptyMessage = "No videos to show right now.", className = "" }: { videos: Video[]; emptyMessage?: string; className?: string }) {
  if (!videos.length) return <div className="empty-state compact"><div className="empty-state-icon">⌕</div><strong>{emptyMessage}</strong></div>;
  return <div className={`video-grid ${className}`}>{videos.map((video) => <VideoCard key={video.id} video={video} />)}</div>;
}
