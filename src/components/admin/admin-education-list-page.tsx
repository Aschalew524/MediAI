"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/primitives";
import type { EducationResourceAdminDto } from "@/lib/education-admin-api";
import { deleteEducationResource, listEducationResourcesAdmin } from "@/lib/education-admin-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

const publicPath: Record<string, string> = {
  "symptom-guide": "/symptom-guide",
  glossary: "/glossary",
  "knowledge-base": "/knowledge-base",
};

export function AdminEducationListPage() {
  const [items, setItems] = useState<EducationResourceAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listEducationResourcesAdmin();
      setItems(res.items);
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not load help pages."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEducationResource(deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not unpublish page."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-8">
          <DashboardSectionHeader
            title="Help pages"
            description="Edit symptom guide, glossary, and knowledge base content. Unpublishing hides a page from public URLs (soft delete)."
            trailing={
              <Link href="/admin/education/new">
                <DashboardActionButton type="button" className="inline-flex gap-2">
                  <Plus className="size-4" />
                  New help page
                </DashboardActionButton>
              </Link>
            }
          />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DashboardPanel className="overflow-hidden p-0">
              <div className="hidden border-b border-primary/10 px-6 py-3.5 sm:grid sm:grid-cols-[120px_1fr_100px_90px_160px_140px] sm:gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Slug
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Title
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Published
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sort
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Updated
                </span>
                <span className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </span>
              </div>

              {items.map((row) => (
                <div
                  key={row.id}
                  className="border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[120px_1fr_100px_90px_160px_140px] sm:items-center sm:gap-3"
                >
                  <p className="font-mono text-xs text-foreground/80">{row.slug}</p>
                  <p className="mt-1 min-w-0 truncate text-sm font-semibold text-foreground sm:mt-0">
                    {row.title}
                  </p>
                  <div className="mt-2 sm:mt-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        row.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.published ? "yes" : "no"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
                    {row.sortOrder ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
                    {new Date(row.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 sm:mt-0">
                    <Link
                      href={publicPath[row.slug] ?? "/"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-primary/15 text-foreground/80 transition-colors hover:bg-muted"
                      aria-label="View public page"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <Link
                      href={`/admin/education/${row.id}/edit`}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-primary/15 text-foreground/80 transition-colors hover:bg-muted"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteId(row.id)}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-destructive/25 text-destructive transition-colors hover:bg-destructive/5"
                      aria-label="Unpublish"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </DashboardPanel>
          )}
        </DashboardContainer>
      </DashboardPage>

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Unpublish page?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This soft-deletes the resource (sets published to false). Public URLs will return
              404 until you publish again from the editor.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="inline-flex h-11 items-center rounded-xl border border-primary/20 px-5 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <DashboardActionButton
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? "Working…" : "Unpublish"}
              </DashboardActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
