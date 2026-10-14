import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "YouTube Glass — Discover videos", template: "%s · YouTube Glass" },
  description: "A glassmorphism-first video discovery and watch-together demo powered by YouTube's official embedded player.",
  applicationName: "YouTube Glass",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0b12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-theme="dark"><head>
    <link rel="preconnect" href="https://www.youtube.com" />
    <link rel="preconnect" href="https://i.ytimg.com" />
    <link rel="preconnect" href="https://www.google.com" />
    <link rel="dns-prefetch" href="https://www.gstatic.com" />
  </head><body><AppShell>{children}</AppShell></body></html>;
}
