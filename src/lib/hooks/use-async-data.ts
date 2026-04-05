"use client";

import { useEffect, useState } from "react";

export function useAsyncData<T>(
  loader: () => Promise<T>,
  fallback: T,
) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setData(fallback);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fallback, loader]);

  return { data, loading };
}
