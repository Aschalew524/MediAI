"use client";

import { useCallback, useEffect, useState } from "react";

import type { EducationResourceDto, EducationSlug } from "@/lib/education-api";
import { getEducationResourceBySlug } from "@/lib/education-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

/**
 * Client-side education resource by slug (public API). Optional `initialData` from RSC;
 * call `refetch()` after transient errors (e.g. Try again on help pages).
 */
export function useEducationResource(
  slug: EducationSlug,
  initialData?: EducationResourceDto,
) {
  const [data, setData] = useState<EducationResourceDto | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialKey = initialData === undefined ? "∅" : JSON.stringify(initialData);

  useEffect(() => {
    setData(initialData);
    setError(null);
  }, [slug, initialKey]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getEducationResourceBySlug(slug);
      setData(r);
      return r;
    } catch (e) {
      const msg = getFriendlyAxiosMessage(e, "Could not load this page.");
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  return { data, loading, error, refetch };
}
