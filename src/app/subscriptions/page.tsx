"use client";

import Link from "next/link";
import { Tv2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { demoVideos } from "@/lib/demo-videos";
import VideoGrid from "@/components/VideoGrid";
import { ChannelAvatar } from "@/components/VideoCard";

export default function SubscriptionsPage() {
  const { subscribedChannels, toggleSubscription } = useApp();
  const subscribedVideos = demoVideos.filter((video) => subscribedChannels.includes(video.channel));
  return <div className="subscriptions-page">
    <div className="page-title-row"><div><span className="eyebrow">Your channels</span><h1>Subscriptions</h1><p>Latest uploads from creators you follow.</p></div><span className="count-pill">{subscribedChannels.length} channels</span></div>
    {subscribedChannels.length > 0 && <div className="subscription-channels">{subscribedChannels.map((channel) => <div className="subscription-channel glass-panel" key={channel}><ChannelAvatar name={channel} size={44} /><strong>{channel}</strong><button onClick={() => toggleSubscription(channel)}>Subscribed</button></div>)}</div>}
    {subscribedVideos.length ? <VideoGrid videos={subscribedVideos} /> : <div className="empty-state subscriptions-empty"><div className="empty-state-icon"><Tv2 size={24} /></div><strong>Your subscriptions are just getting started</strong><span>Open a video and tap Subscribe to follow its channel.</span><Link className="button-primary" href="/">Explore home</Link></div>}
  </div>;
}
