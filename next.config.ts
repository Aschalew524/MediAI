import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Turbopack otherwise walks up to the nearest `package-lock.json` and may
// pick a lockfile outside this app (e.g. in $HOME), which breaks route
// discovery and yields 404 for valid pages like `/dashboard/top-doctors`.
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Force CSS `@import "tailwindcss"` (and related packages) to resolve inside
 * this app’s `node_modules`. Otherwise Turbopack can walk up to another
 * `package-lock.json` (e.g. under `$HOME` or the repo parent) and repeatedly
 * fail to resolve `tailwindcss`, which spikes CPU/RAM and can trigger the OOM
 * killer — the same symptom as Cursor “closing” when the dev server hammers memory.
 */
const tailwindPkg = path.join(turbopackRoot, "node_modules", "tailwindcss");
const twAnimatePkg = path.join(turbopackRoot, "node_modules", "tw-animate-css");
const shadcnPkg = path.join(turbopackRoot, "node_modules", "shadcn");

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
    resolveAlias: {
      tailwindcss: tailwindPkg,
      "tw-animate-css": twAnimatePkg,
      shadcn: shadcnPkg,
    },
  },
  // Keeps serverless trace output anchored to this app (monorepo / odd cwd).
  outputFileTracingRoot: turbopackRoot,
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
  webpack: (config, { dev }) => {
    const existing = config.resolve?.alias;
    const base =
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
        ? { ...(existing as Record<string, string>) }
        : {};
    config.resolve.alias = {
      ...base,
      tailwindcss: tailwindPkg,
      "tw-animate-css": twAnimatePkg,
      shadcn: shadcnPkg,
    };
    // Default webpack parallelism is high; on 8–16GB RAM laptops it can spike
    // memory with PostCSS/Tailwind. Cap in dev only (slightly slower compiles).
    if (dev) {
      config.parallelism = 6;
    }
    return config;
  },
};

export default nextConfig;
