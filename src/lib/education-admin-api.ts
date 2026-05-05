/**
 * Nest admin education API (`/admin/education/resources*`). JWT + `appRole === "admin"`.
 * Ops: same seed + env notes as `education-api.ts` (`RUN_EDUCATION_E2E=1` for `test/education.e2e-spec.ts`).
 */
import api from "@/lib/axios";

import type { EducationSlug } from "@/lib/education-api";

export type EducationResourceAdminDto = {
  id: string;
  slug: EducationSlug;
  title: string;
  description: string;
  bullets: string[];
  iconKey?: string;
  published: boolean;
  sortOrder: number | null;
  updatedAt: string;
};

export type EducationResourcesAdminListResponse = {
  items: EducationResourceAdminDto[];
};

export type CreateEducationResourcePayload = {
  slug: EducationSlug;
  title: string;
  description: string;
  bullets: string[];
  iconKey?: EducationSlug;
  published?: boolean;
  sortOrder?: number;
};

export type PatchEducationResourcePayload = Partial<
  Omit<CreateEducationResourcePayload, "sortOrder">
> & {
  sortOrder?: number | null;
};

export async function listEducationResourcesAdmin(
  options?: { signal?: AbortSignal },
): Promise<EducationResourcesAdminListResponse> {
  const { data } = await api.get<EducationResourcesAdminListResponse>(
    "/admin/education/resources",
    { signal: options?.signal },
  );
  return data;
}

export async function getEducationResourceAdminById(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<EducationResourceAdminDto> {
  const { data } = await api.get<EducationResourceAdminDto>(
    `/admin/education/resources/${encodeURIComponent(id.trim())}`,
    { signal: options?.signal },
  );
  return data;
}

export async function createEducationResource(
  body: CreateEducationResourcePayload,
  options?: { signal?: AbortSignal },
): Promise<EducationResourceAdminDto> {
  const { data } = await api.post<EducationResourceAdminDto>(
    "/admin/education/resources",
    body,
    { signal: options?.signal },
  );
  return data;
}

export async function patchEducationResource(
  id: string,
  body: PatchEducationResourcePayload,
  options?: { signal?: AbortSignal },
): Promise<EducationResourceAdminDto> {
  const { data } = await api.patch<EducationResourceAdminDto>(
    `/admin/education/resources/${encodeURIComponent(id.trim())}`,
    body,
    { signal: options?.signal },
  );
  return data;
}

export async function deleteEducationResource(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<void> {
  await api.delete(`/admin/education/resources/${encodeURIComponent(id.trim())}`, {
    signal: options?.signal,
  });
}
