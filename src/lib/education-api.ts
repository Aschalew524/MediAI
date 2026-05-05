/**
 * Public Nest education API (`GET /education/resources*`). No auth.
 *
 * Ops (local dev):
 * - Seed the three help rows: `npx prisma db seed` (from `MediAI_backend`; see root README / backend README).
 * - Public base: `{NEXT_PUBLIC_API_URL}/education/resources` (list + by slug).
 * - Admin CMS: `{NEXT_PUBLIC_API_URL}/admin/education/resources` (JWT, `appRole=admin`).
 * - Full DB e2e for education: `RUN_EDUCATION_E2E=1` — see `MediAI_backend/test/education.e2e-spec.ts`.
 */
import { isAxiosError } from "axios";

import api from "@/lib/axios";

export const EDUCATION_SLUGS = ["symptom-guide", "glossary", "knowledge-base"] as const;

export type EducationSlug = (typeof EDUCATION_SLUGS)[number];

export type EducationResourceDto = {
  slug: string;
  title: string;
  description: string;
  bullets: string[];
  iconKey?: string;
};

export type EducationResourcesListResponse = {
  items: EducationResourceDto[];
};

export function isEducationSlug(s: string): s is EducationSlug {
  return (EDUCATION_SLUGS as readonly string[]).includes(s);
}

export async function getEducationResources(
  options?: { signal?: AbortSignal },
): Promise<EducationResourcesListResponse> {
  const { data } = await api.get<EducationResourcesListResponse>("/education/resources", {
    signal: options?.signal,
  });
  return data;
}

export async function getEducationResourceBySlug(
  slug: EducationSlug,
  options?: { signal?: AbortSignal },
): Promise<EducationResourceDto> {
  const { data } = await api.get<EducationResourceDto>(
    `/education/resources/${encodeURIComponent(slug)}`,
    { signal: options?.signal },
  );
  return data;
}

export function isEducationNotFound(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}
