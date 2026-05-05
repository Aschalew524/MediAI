"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import {
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "@/components/dashboard/primitives";
import { getBlogHome, isValidBlogArticleUuid } from "@/lib/blog-api";
import { getBlogArticleAdminById, putBlogHome } from "@/lib/blog-admin-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

type ListKey =
  | "popularArticleIds"
  | "aiHealthcareArticleIds"
  | "secondOpinionArticleIds"
  | "companyNewsArticleIds";

const LIST_META: { key: ListKey; label: string; description: string }[] = [
  {
    key: "popularArticleIds",
    label: "Popular on MediAI",
    description: "Article UUIDs for the Popular section.",
  },
  {
    key: "aiHealthcareArticleIds",
    label: "AI & Healthcare",
    description: "Article UUIDs for the AI & Healthcare section.",
  },
  {
    key: "secondOpinionArticleIds",
    label: "Second Opinion",
    description: "Article UUIDs for the Second Opinion section.",
  },
  {
    key: "companyNewsArticleIds",
    label: "Company News",
    description: "Article UUIDs for the Company News section.",
  },
];

function moveInList(list: string[], index: number, dir: -1 | 1): string[] {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const t = copy[index];
  copy[index] = copy[next]!;
  copy[next] = t!;
  return copy;
}

export function AdminBlogHomePage() {
  const [featuredArticleId, setFeaturedArticleId] = useState("");
  const [lists, setLists] = useState<Record<ListKey, string[]>>({
    popularArticleIds: [],
    aiHealthcareArticleIds: [],
    secondOpinionArticleIds: [],
    companyNewsArticleIds: [],
  });
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const allIds = useMemo(() => {
    const out: string[] = [];
    const feat = featuredArticleId.trim();
    if (feat) out.push(feat);
    for (const { key } of LIST_META) {
      for (const id of lists[key]) {
        const t = id.trim();
        if (t) out.push(t);
      }
    }
    return [...new Set(out)];
  }, [featuredArticleId, lists]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const home = await getBlogHome();
        if (cancelled) return;
        setFeaturedArticleId(home.featuredArticleId ?? "");
        setLists({
          popularArticleIds: [...home.popularArticleIds],
          aiHealthcareArticleIds: [...home.aiHealthcareArticleIds],
          secondOpinionArticleIds: [...home.secondOpinionArticleIds],
          companyNewsArticleIds: [...home.companyNewsArticleIds],
        });
      } catch (e) {
        if (!cancelled) {
          setError(getFriendlyAxiosMessage(e, "Could not load home configuration."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ids = allIds.filter((id) => isValidBlogArticleUuid(id));
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const a = await getBlogArticleAdminById(id);
            return [id, a.title] as const;
          } catch {
            return [id, "— (not found or error)"] as const;
          }
        }),
      );
      if (cancelled) return;
      setTitles((prev) => {
        const next = { ...prev };
        for (const [id, title] of entries) {
          next[id] = title;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [allIds]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    const feat = featuredArticleId.trim();
    if (feat && !isValidBlogArticleUuid(feat)) {
      setError("Featured article id must be a valid UUID v4.");
      return;
    }
    for (const { key, label } of LIST_META) {
      for (const raw of lists[key]) {
        const id = raw.trim();
        if (id && !isValidBlogArticleUuid(id)) {
          setError(`Invalid UUID in ${label}: ${id}`);
          return;
        }
      }
    }

    const payload = {
      featuredArticleId: feat || null,
      popularArticleIds: lists.popularArticleIds.map((s) => s.trim()).filter(Boolean),
      aiHealthcareArticleIds: lists.aiHealthcareArticleIds.map((s) => s.trim()).filter(Boolean),
      secondOpinionArticleIds: lists.secondOpinionArticleIds.map((s) => s.trim()).filter(Boolean),
      companyNewsArticleIds: lists.companyNewsArticleIds.map((s) => s.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      await putBlogHome(payload);
      setSuccess("Home curation saved.");
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not save home configuration."));
    } finally {
      setSaving(false);
    }
  }

  function updateList(key: ListKey, fn: (prev: string[]) => string[]) {
    setLists((prev) => ({ ...prev, [key]: fn(prev[key]) }));
  }

  if (loading) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Loading home config…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackTitle
          title="Blog home curation"
          description="Replace the featured article and ordered UUID lists shown on /blog. Titles load via the admin article API (includes unpublished rows)."
          backHref="/admin/blog"
          backAriaLabel="Back to blog list"
        />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-700" role="status">
            {success}
          </p>
        ) : null}

        <DashboardPanel className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Featured article</h2>
          <p className="text-sm text-muted-foreground">
            Optional. Leave empty to clear the hero slot on the blog index.
          </p>
          <input
            className="h-11 w-full rounded-xl border border-primary/15 bg-white px-3.5 font-mono text-sm outline-none focus:border-primary"
            value={featuredArticleId}
            onChange={(e) => setFeaturedArticleId(e.target.value)}
            placeholder="UUID v4"
          />
          {featuredArticleId.trim() ? (
            <p className="text-xs text-muted-foreground">
              {titles[featuredArticleId.trim()] ?? "…"}
            </p>
          ) : null}
        </DashboardPanel>

        {LIST_META.map(({ key, label, description }) => (
          <DashboardPanel key={key} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{label}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="space-y-3">
              {lists[key].length === 0 ? (
                <p className="text-sm text-muted-foreground">No articles in this list.</p>
              ) : null}
              {lists[key].map((row, index) => (
                <div
                  key={`${key}-${index}`}
                  className="flex flex-col gap-2 rounded-xl border border-primary/10 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 font-mono text-xs outline-none focus:border-primary"
                      value={row}
                      onChange={(e) =>
                        updateList(key, (prev) =>
                          prev.map((v, i) => (i === index ? e.target.value : v)),
                        )
                      }
                      placeholder="Article UUID"
                    />
                    {row.trim() && titles[row.trim()] ? (
                      <p className="truncate text-xs text-muted-foreground">{titles[row.trim()]}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => updateList(key, (prev) => moveInList(prev, index, -1))}
                      className="rounded-lg border border-primary/10 p-2 disabled:opacity-30"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === lists[key].length - 1}
                      onClick={() => updateList(key, (prev) => moveInList(prev, index, 1))}
                      className="rounded-lg border border-primary/10 p-2 disabled:opacity-30"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() =>
                        updateList(key, (prev) => prev.filter((_, i) => i !== index))
                      }
                      className="rounded-lg border border-destructive/20 p-2 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateList(key, (prev) => [...prev, ""])}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-semibold text-primary"
            >
              <Plus className="size-3.5" />
              Add UUID
            </button>
          </DashboardPanel>
        ))}

        <div className="flex flex-wrap gap-3">
          <DashboardActionButton type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save home curation"}
          </DashboardActionButton>
          <Link href="/admin/blog">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white px-5 text-sm font-semibold"
            >
              Cancel
            </button>
          </Link>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}
