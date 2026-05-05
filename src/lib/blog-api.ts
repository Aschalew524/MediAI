import api from "@/lib/axios";

export type BlogSectionDto = {
  title: string;
  body: string;
};

/** Mirrors Nest `BlogArticleResponseDto`. */
export type BlogArticleDto = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageSrc: string;
  intro: string;
  sections: BlogSectionDto[];
};

export type BlogHomeDto = {
  featuredArticleId: string | null;
  popularArticleIds: string[];
  aiHealthcareArticleIds: string[];
  secondOpinionArticleIds: string[];
  companyNewsArticleIds: string[];
};

export type BlogArticlesListResponse = {
  items: BlogArticleDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type BlogCategoriesResponse = {
  categories: string[];
};

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidBlogArticleUuid(id: string): boolean {
  return UUID_V4_RE.test(id.trim());
}

export function getBlogArticleHref(id: string): string {
  return `/blog/${id}`;
}

export function collectArticleIdsFromHome(home: BlogHomeDto): string[] {
  const out: string[] = [];
  if (home.featuredArticleId) {
    out.push(home.featuredArticleId);
  }
  for (const list of [
    home.popularArticleIds,
    home.aiHealthcareArticleIds,
    home.secondOpinionArticleIds,
    home.companyNewsArticleIds,
  ]) {
    for (const id of list) {
      if (id) out.push(id);
    }
  }
  return [...new Set(out)];
}

export async function getBlogHome(options?: { signal?: AbortSignal }): Promise<BlogHomeDto> {
  const { data } = await api.get<BlogHomeDto>("/blog/home", { signal: options?.signal });
  return data;
}

export async function getBlogCategories(options?: {
  signal?: AbortSignal;
}): Promise<BlogCategoriesResponse> {
  const { data } = await api.get<BlogCategoriesResponse>("/blog/categories", {
    signal: options?.signal,
  });
  return data;
}

export async function listBlogArticles(
  params: {
    page?: number;
    pageSize?: number;
    category?: string;
    q?: string;
  },
  options?: { signal?: AbortSignal },
): Promise<BlogArticlesListResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };
  if (params.category?.trim()) {
    query.category = params.category.trim();
  }
  if (params.q?.trim()) {
    query.q = params.q.trim().slice(0, 120);
  }
  const { data } = await api.get<BlogArticlesListResponse>("/blog/articles", {
    params: query,
    signal: options?.signal,
  });
  return data;
}

export async function getBlogArticleById(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<BlogArticleDto> {
  const { data } = await api.get<BlogArticleDto>(`/blog/articles/${encodeURIComponent(id.trim())}`, {
    signal: options?.signal,
  });
  return data;
}

/**
 * Parallel fetches for home hydration. Failed ids are omitted from the map.
 */
export async function fetchArticlesByIds(
  ids: string[],
  options?: { signal?: AbortSignal },
): Promise<Record<string, BlogArticleDto>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const article = await getBlogArticleById(id, options);
        return [id, article] as const;
      } catch {
        return null;
      }
    }),
  );
  const out: Record<string, BlogArticleDto> = {};
  for (const e of entries) {
    if (e) out[e[0]] = e[1];
  }
  return out;
}
