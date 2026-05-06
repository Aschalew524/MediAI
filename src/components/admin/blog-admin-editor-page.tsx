"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

import {
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "@/components/dashboard/primitives";
import type { BlogSectionDto } from "@/lib/blog-api";
import {
  createBlogArticle,
  getBlogArticleAdminById,
  patchBlogArticle,
} from "@/lib/blog-admin-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

const inputClass =
  "h-11 w-full rounded-xl border border-primary/15 bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const textareaClass =
  "min-h-[120px] w-full rounded-xl border border-primary/15 bg-white px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string {
  return new Date(v).toISOString();
}

const defaultSections: BlogSectionDto[] = [
  { title: "Introduction", body: "Write the section body here." },
];

export function AdminBlogEditorPage({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(articleId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [readTime, setReadTime] = useState("5 min Read");
  const [imageSrc, setImageSrc] = useState("");
  const [intro, setIntro] = useState("");
  const [sections, setSections] = useState<BlogSectionDto[]>(defaultSections);
  const [publishedAtLocal, setPublishedAtLocal] = useState(() =>
    toDatetimeLocalValue(new Date().toISOString()),
  );
  const [dateDisplay, setDateDisplay] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getBlogArticleAdminById(articleId);
        if (cancelled) return;
        setTitle(row.title);
        setCategory(row.category);
        setAuthor(row.author);
        setReadTime(row.readTime);
        setImageSrc(row.imageSrc);
        setIntro(row.intro);
        setSections(row.sections.length ? row.sections : defaultSections);
        setPublishedAtLocal(toDatetimeLocalValue(row.publishedAt));
        setDateDisplay(row.dateDisplay ?? "");
        setSortOrder(row.sortOrder != null ? String(row.sortOrder) : "");
        setPublished(row.published);
      } catch (e) {
        if (!cancelled) {
          setError(getFriendlyAxiosMessage(e, "Could not load article."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  function moveSection(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    setSections((s) => {
      const copy = [...s];
      const tmp = copy[index];
      copy[index] = copy[next]!;
      copy[next] = tmp!;
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!publishedAtLocal) {
      setError("Published date/time is required.");
      return;
    }
    const cleanedSections = sections.map((s) => ({
      title: s.title.trim(),
      body: s.body.trim(),
    }));
    if (cleanedSections.some((s) => !s.title || !s.body)) {
      setError("Each section needs a non-empty title and body.");
      return;
    }
    const publishedAt = fromDatetimeLocalValue(publishedAtLocal);
    const sortNum = sortOrder.trim() === "" ? undefined : Number(sortOrder);
    if (sortOrder.trim() !== "" && Number.isNaN(sortNum)) {
      setError("Sort order must be a number.");
      return;
    }

    const body = {
      title: title.trim(),
      category: category.trim(),
      author: author.trim(),
      readTime: readTime.trim(),
      imageSrc: imageSrc.trim(),
      intro: intro.trim(),
      sections: cleanedSections,
      publishedAt,
      ...(dateDisplay.trim() ? { dateDisplay: dateDisplay.trim() } : {}),
      ...(sortNum !== undefined ? { sortOrder: sortNum } : {}),
      published,
    };

    setSaving(true);
    try {
      if (isEdit && articleId) {
        await patchBlogArticle(articleId, body);
        setSuccess("Article saved.");
      } else {
        await createBlogArticle(body);
        router.push("/admin/blog");
        router.refresh();
      }
    } catch (err) {
      setError(getFriendlyAxiosMessage(err, "Could not save article."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Loading article…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (isEdit && error && !title) {
    return (
      <DashboardPage>
        <DashboardContainer className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Link href="/admin/blog" className="text-sm font-semibold text-primary underline">
            Back to list
          </Link>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackTitle
          title={isEdit ? "Edit article" : "New article"}
          description="Fields match the Nest admin API. Turning off Published hides the post from the public blog."
          backHref="/admin/blog"
          backAriaLabel="Back to blog list"
        />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
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

          <DashboardPanel className="space-y-5">
            <h2 className="text-base font-semibold tracking-tight">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Title</span>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Category</span>
                <input
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Author</span>
                <input
                  className={inputClass}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Read time</span>
                <input
                  className={inputClass}
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">
                Image URL{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                className={inputClass}
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                placeholder="/cover.png or https://example.com/cover.png"
              />
              <span className="block text-xs text-muted-foreground">
                Leave blank to publish without a cover image. Supports relative
                paths from <code>public/</code> or absolute https URLs.
              </span>
              {imageSrc.trim() ? (
                <span className="mt-2 block">
                  {/* Use a plain <img> for the preview so admins can paste any
                      URL during editing without first whitelisting hosts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc.trim()}
                    alt="Cover preview"
                    className="h-32 w-full rounded-xl border border-primary/15 bg-white object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </span>
              ) : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Intro</span>
              <textarea
                className={textareaClass}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                required
              />
            </label>
          </DashboardPanel>

          <DashboardPanel className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">Sections</h2>
              <button
                type="button"
                onClick={() =>
                  setSections((s) => [...s, { title: "New section", body: "" }])
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-semibold text-primary"
              >
                <Plus className="size-3.5" />
                Add section
              </button>
            </div>
            <div className="space-y-6">
              {sections.map((sec, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex text-muted-foreground">
                      <GripVertical className="size-4" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Section {i + 1}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-label="Move section up"
                        disabled={i === 0}
                        onClick={() => moveSection(i, -1)}
                        className="rounded-lg border border-primary/10 p-1.5 disabled:opacity-30"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move section down"
                        disabled={i === sections.length - 1}
                        onClick={() => moveSection(i, 1)}
                        className="rounded-lg border border-primary/10 p-1.5 disabled:opacity-30"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove section"
                        disabled={sections.length <= 1}
                        onClick={() => setSections((s) => s.filter((_, j) => j !== i))}
                        className="rounded-lg border border-destructive/20 p-1.5 text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    className={inputClass}
                    value={sec.title}
                    onChange={(e) =>
                      setSections((s) =>
                        s.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                      )
                    }
                    placeholder="Section title"
                  />
                  <textarea
                    className={textareaClass}
                    value={sec.body}
                    onChange={(e) =>
                      setSections((s) =>
                        s.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)),
                      )
                    }
                    placeholder="Section body"
                  />
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel className="space-y-5">
            <h2 className="text-base font-semibold tracking-tight">Publishing</h2>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Published at (local)</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={publishedAtLocal}
                onChange={(e) => setPublishedAtLocal(e.target.value)}
                required
              />
              <span className="text-xs text-muted-foreground">
                Sent to the API as ISO-8601 UTC from this local value.
              </span>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Date display override (optional)</span>
              <input
                className={inputClass}
                value={dateDisplay}
                onChange={(e) => setDateDisplay(e.target.value)}
                placeholder="e.g. Jan 07, 2025"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Sort order (optional)</span>
              <input
                className={inputClass}
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="Integer"
              />
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-primary/20"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">Published</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Off hides the article from the public blog (same as Unpublish on the list).
                </span>
              </span>
            </label>
          </DashboardPanel>

          <div className="flex flex-wrap gap-3">
            <DashboardActionButton type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create article"}
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
        </form>
      </DashboardContainer>
    </DashboardPage>
  );
}
