/**
 * Nest admin blog API (`/admin/blog/*`). Requires JWT with `appRole === "admin"`.
 * Public read remains in `blog-api.ts` (`GET /blog/*`).
 */
import api from "@/lib/axios";

import type { BlogHomeDto, BlogSectionDto } from "@/lib/blog-api";

export type BlogArticleAdminDto = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageSrc: string;
  intro: string;
  sections: BlogSectionDto[];
  published: boolean;
  publishedAt: string;
  dateDisplay: string | null;
  sortOrder: number | null;
};

export type BlogArticlesAdminListResponse = {
  items: BlogArticleAdminDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateBlogArticlePayload = {
  title: string;
  category: string;
  author: string;
  readTime: string;
  imageSrc: string;
  intro: string;
  sections: BlogSectionDto[];
  publishedAt: string;
  dateDisplay?: string;
  sortOrder?: number;
  published?: boolean;
};

export type PatchBlogArticlePayload = Partial<CreateBlogArticlePayload>;

export type BlogHomeConfigPayload = {
  featuredArticleId?: string | null;
  popularArticleIds: string[];
  aiHealthcareArticleIds: string[];
  secondOpinionArticleIds: string[];
  companyNewsArticleIds: string[];
};

export async function listBlogArticlesAdmin(
  params: {
    page?: number;
    pageSize?: number;
    category?: string;
    q?: string;
    published?: "all" | "true" | "false";
  },
  options?: { signal?: AbortSignal },
): Promise<BlogArticlesAdminListResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    published: params.published ?? "all",
  };
  if (params.category?.trim()) query.category = params.category.trim();
  if (params.q?.trim()) query.q = params.q.trim().slice(0, 120);
  const { data } = await api.get<BlogArticlesAdminListResponse>("/admin/blog/articles", {
    params: query,
    signal: options?.signal,
  });
  return data;
}

export async function getBlogArticleAdminById(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<BlogArticleAdminDto> {
  const { data } = await api.get<BlogArticleAdminDto>(
    `/admin/blog/articles/${encodeURIComponent(id.trim())}`,
    { signal: options?.signal },
  );
  return data;
}

export async function createBlogArticle(
  body: CreateBlogArticlePayload,
  options?: { signal?: AbortSignal },
): Promise<BlogArticleAdminDto> {
  const { data } = await api.post<BlogArticleAdminDto>("/admin/blog/articles", body, {
    signal: options?.signal,
  });
  return data;
}

export async function patchBlogArticle(
  id: string,
  body: PatchBlogArticlePayload,
  options?: { signal?: AbortSignal },
): Promise<BlogArticleAdminDto> {
  const { data } = await api.patch<BlogArticleAdminDto>(
    `/admin/blog/articles/${encodeURIComponent(id.trim())}`,
    body,
    { signal: options?.signal },
  );
  return data;
}

export async function deleteBlogArticle(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<void> {
  await api.delete(`/admin/blog/articles/${encodeURIComponent(id.trim())}`, {
    signal: options?.signal,
  });
}

export async function putBlogHome(
  body: BlogHomeConfigPayload,
  options?: { signal?: AbortSignal },
): Promise<BlogHomeDto> {
  const { data } = await api.put<BlogHomeDto>("/admin/blog/home", body, {
    signal: options?.signal,
  });
  return data;
}
