"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/primitives";
import type { BlogArticleAdminDto } from "@/lib/blog-admin-api";
import { deleteBlogArticle, listBlogArticlesAdmin } from "@/lib/blog-admin-api";
import { getBlogArticleHref } from "@/lib/blog-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

export function AdminBlogListPage() {
  const [items, setItems] = useState<BlogArticleAdminDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [published, setPublished] = useState<"all" | "true" | "false">("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, published]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBlogArticlesAdmin({
        page,
        pageSize,
        published,
        q: debouncedQ || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not load articles."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, published, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteBlogArticle(deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not unpublish article."));
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-8">
          <DashboardSectionHeader
            title="Blog"
            description="Create and manage marketing posts. Unpublishing hides an article from the public blog (same as soft delete)."
            trailing={
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/blog/home">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Home curation
                  </button>
                </Link>
                <Link href="/admin/blog/new">
                  <DashboardActionButton type="button" className="inline-flex gap-2">
                    <Plus className="size-4" />
                    New article
                  </DashboardActionButton>
                </Link>
              </div>
            }
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title or intro…"
                className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="relative">
              <select
                value={published}
                onChange={(e) => {
                  setPublished(e.target.value as "all" | "true" | "false");
                  setPage(1);
                }}
                className="h-11 min-w-[160px] appearance-none rounded-xl border border-primary/15 bg-white px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="all">All statuses</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DashboardPanel className="overflow-hidden p-0">
            <div className="hidden border-b border-primary/10 px-6 py-3.5 lg:grid lg:grid-cols-[1fr_100px_120px_140px_160px] lg:gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Article
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Published at
              </span>
              <span className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </span>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No articles yet. Create one to get started.
              </div>
            ) : (
              items.map((row) => (
                <div
                  key={row.id}
                  className="border-b border-primary/8 px-6 py-4 last:border-b-0 lg:grid lg:grid-cols-[1fr_100px_120px_140px_160px] lg:items-center lg:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.author}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{row.id}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground lg:mt-0">{row.category}</p>
                  <div className="mt-2 lg:mt-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        row.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground lg:mt-0">
                    {new Date(row.publishedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 lg:mt-0">
                    {row.published ? (
                      <Link
                        href={getBlogArticleHref(row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/15 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                      >
                        <ExternalLink className="size-3.5" />
                        View live
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/blog/${row.id}/edit`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/15 px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteId(row.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/25 px-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5"
                    >
                      <Trash2 className="size-3.5" />
                      Unpublish
                    </button>
                  </div>
                </div>
              ))
            )}
          </DashboardPanel>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} articles)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-primary/15 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-primary/15 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </DashboardContainer>
      </DashboardPage>

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <DashboardPanel className="max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold tracking-tight">Unpublish article?</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This calls the admin delete API: the post stays in the database but is marked
              unpublished, so it no longer appears on public <span className="font-medium">/blog</span>{" "}
              routes.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="h-10 rounded-xl border border-primary/15 px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {deleting ? "Working…" : "Unpublish"}
              </button>
            </div>
          </DashboardPanel>
        </div>
      ) : null}
    </>
  );
}
