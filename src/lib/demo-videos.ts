import type { Video } from "./types";

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** A small local starter feed keeps the UI useful while live search warms up. */
export const demoVideos: Video[] = [
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 beats to relax / study to",
    channel: "Lofi Girl",
    thumbnail: thumb("jfKfPfyJRdk"),
    duration: "LIVE",
    durationSeconds: 0,
    views: "24K watching",
    published: "Live",
    description: "A live lofi stream for studying, reading and winding down.",
    category: "Music",
    isLive: true,
  },
  {
    id: "4NRXx6U8ABQ",
    title: "The Weeknd - Blinding Lights (Official Video)",
    channel: "The Weeknd",
    thumbnail: thumb("4NRXx6U8ABQ"),
    duration: "4:22",
    durationSeconds: 262,
    views: "892M views",
    published: "6 years ago",
    description: "The official music video for Blinding Lights by The Weeknd.",
    category: "Music",
  },
  {
    id: "5NV6Rdv1a3I",
    title: "Daft Punk - Get Lucky (Official Audio) ft. Pharrell Williams, Nile Rodgers",
    channel: "Daft Punk",
    thumbnail: thumb("5NV6Rdv1a3I"),
    duration: "6:09",
    durationSeconds: 369,
    views: "1.1B views",
    published: "13 years ago",
    description: "Get Lucky from Random Access Memories.",
    category: "Music",
  },
  {
    id: "60ItHLz5WEA",
    title: "Alan Walker - Faded",
    channel: "Alan Walker",
    thumbnail: thumb("60ItHLz5WEA"),
    duration: "3:33",
    durationSeconds: 213,
    views: "3.7B views",
    published: "10 years ago",
    description: "The official video for Faded by Alan Walker.",
    category: "Music",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny - Blender Foundation short film",
    channel: "Blender",
    thumbnail: thumb("aqz-KE-bpKQ"),
    duration: "9:56",
    durationSeconds: 596,
    views: "41M views",
    published: "16 years ago",
    description: "A classic open movie created with Blender.",
    category: "Animation",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You (Official Music Video)",
    channel: "Ed Sheeran",
    thumbnail: thumb("JGwWNGJdvx8"),
    duration: "4:24",
    durationSeconds: 264,
    views: "6.4B views",
    published: "9 years ago",
    description: "The official music video for Shape of You.",
    category: "Music",
  },
  {
    id: "YQHsXMglC9A",
    title: "Adele - Hello",
    channel: "Adele",
    thumbnail: thumb("YQHsXMglC9A"),
    duration: "6:07",
    durationSeconds: 367,
    views: "3.2B views",
    published: "10 years ago",
    description: "The official video for Hello by Adele.",
    category: "Music",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    channel: "Rick Astley",
    thumbnail: thumb("dQw4w9WgXcQ"),
    duration: "3:33",
    durationSeconds: 213,
    views: "1.6B views",
    published: "17 years ago",
    description: "The official music video for Never Gonna Give You Up.",
    category: "Music",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    channel: "Luis Fonsi",
    thumbnail: thumb("kJQP7kiw5Fk"),
    duration: "4:42",
    durationSeconds: 282,
    views: "8.5B views",
    published: "9 years ago",
    description: "The official music video for Despacito.",
    category: "Music",
  },
  {
    id: "M7lc1UVf-VE",
    title: "YouTube IFrame Player API demo",
    channel: "YouTube Developers",
    thumbnail: thumb("M7lc1UVf-VE"),
    duration: "2:24",
    durationSeconds: 144,
    views: "3.1M views",
    published: "8 years ago",
    description: "A short demo video used to test embedded video playback.",
    category: "Technology",
  },
  {
    id: "2vjPBrBU-TM",
    title: "Sia - Chandelier (Official Music Video)",
    channel: "Sia",
    thumbnail: thumb("2vjPBrBU-TM"),
    duration: "3:52",
    durationSeconds: 232,
    views: "2.8B views",
    published: "11 years ago",
    description: "The official music video for Chandelier by Sia.",
    category: "Music",
  },
  {
    id: "tgbNymZ7vqY",
    title: "The Muppets: Bohemian Rhapsody",
    channel: "The Muppets",
    thumbnail: thumb("tgbNymZ7vqY"),
    duration: "5:34",
    durationSeconds: 334,
    views: "100M views",
    published: "16 years ago",
    description: "The Muppets perform Queen's Bohemian Rhapsody.",
    category: "Comedy",
  },
];

export const starterShorts: Video[] = [
  { ...demoVideos[11], isShort: true, duration: "0:30" },
  { ...demoVideos[9], isShort: true, duration: "0:30" },
  { ...demoVideos[7], isShort: true, duration: "0:30" },
];

export const categories = ["All", "Music", "Live", "Gaming", "Podcasts", "Technology", "Animation", "Comedy", "Travel", "Recently uploaded"];

export function localSearch(query: string): Video[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return demoVideos;
  const scored = demoVideos
    .map((video) => {
      const text = `${video.title} ${video.channel} ${video.category ?? ""} ${video.description ?? ""}`.toLowerCase();
      return { video, score: words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map(({ video }) => video);
}
