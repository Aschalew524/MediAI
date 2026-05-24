import type { NextConfig } from "next";
import path from "path";

import { PRODUCTION_API_BASE } from "./src/lib/api-origin";

const LOCAL_API = "http://localhost:4000/api";

function readDirectApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_API_BASE : LOCAL_API;
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
