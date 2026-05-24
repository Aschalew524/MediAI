import type { NextConfig } from "next";
import path from "path";

import {
  LOCAL_API_BASE,
  PRODUCTION_API_BASE,
} from "./src/lib/api-origin";

function isLocalApiDevEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_LOCAL_API?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function readDirectApiUrl(): string {
  if (isLocalApiDevEnabled()) {
    return LOCAL_API_BASE;
  }
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_API_BASE : LOCAL_API_BASE;
}

/** `https://medi-ai-backend.vercel.app` from `.../api` */
function nestOriginFromApiBase(apiBase: string): string {
  return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_API_URL: readDirectApiUrl(),
    NEXT_PUBLIC_USE_LOCAL_API: process.env.NEXT_PUBLIC_USE_LOCAL_API ?? "",
  },
  async rewrites() {
    const nestOrigin = nestOriginFromApiBase(readDirectApiUrl());
    return [
      {
        source: "/nest/:path*",
        destination: `${nestOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
