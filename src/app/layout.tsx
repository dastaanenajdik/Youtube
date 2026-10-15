import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "YouTube Glass — Discover videos", template: "%s · YouTube Glass" },
  description: "A glassmorphism-first YouTube experience: home feed, Shorts, history, a full channel page, watch parties and a queue — every control is frosted glass.",
  applicationName: "YouTube Glass",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "YouTube Glass",
    description: "Home, Shorts, history and your own channel — rebuilt as frosted glass on Next.js with the official YouTube embed.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Applied before paint so the light-glass theme never flashes dark first. */
const THEME_BOOTSTRAP = `try{var raw=localStorage.getItem("ytglass.settings.v1");var s=raw?JSON.parse(raw):{};var r=document.documentElement;r.dataset.theme=s.theme==="light"?"light":"dark";r.dataset.motion=s.reduceMotion?"reduced":"full";}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-theme="dark" data-motion="full"><head>
    <link rel="preconnect" href="https://www.youtube.com" />
    <link rel="preconnect" href="https://i.ytimg.com" />
    <link rel="preconnect" href="https://www.google.com" />
    <link rel="dns-prefetch" href="https://www.gstatic.com" />
    <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
  </head><body><AppShell>{children}</AppShell></body></html>;
}
