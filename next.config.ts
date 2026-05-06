import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow `next/image` to optimise images served from arbitrary external
  // hosts. Admins paste arbitrary cover-image URLs from the blog editor
  // (e.g. CMS uploads, link-shortened CDNs like kommodo.ai), so listing
  // every host is not practical. We restrict to https/http only — same-
  // origin `/foo.png` paths from `public/` continue to work without any
  // remote pattern.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
