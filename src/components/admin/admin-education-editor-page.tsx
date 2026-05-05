"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import {
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "@/components/dashboard/primitives";
import type { EducationSlug } from "@/lib/education-api";
import { EDUCATION_SLUGS } from "@/lib/education-api";
import { getEducationResourceAdminById, patchEducationResource } from "@/lib/education-admin-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

const inputClass =
  "h-11 w-full rounded-xl border border-primary/15 bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const textareaClass =
  "min-h-[200px] w-full rounded-xl border border-primary/15 bg-white px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

const MAX_DESC = 20_000;
const MAX_BULLET = 2_000;
const MAX_BULLETS = 50;

export function AdminEducationEditorPage({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [slug, setSlug] = useState<EducationSlug | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [iconKey, setIconKey] = useState<EducationSlug>("knowledge-base");
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("");
  const [useDefaultSortOrder, setUseDefaultSortOrder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getEducationResourceAdminById(resourceId);
        if (cancelled) return;
        setSlug(row.slug as EducationSlug);
        setTitle(row.title);
        setDescription(row.description);
        setBullets(row.bullets.length ? row.bullets : [""]);
        setIconKey((row.iconKey ?? row.slug) as EducationSlug);
        setPublished(row.published);
        const hasSort = row.sortOrder != null;
        setUseDefaultSortOrder(!hasSort);
        setSortOrder(hasSort ? String(row.sortOrder) : "");
      } catch (e) {
        if (!cancelled) {
          setError(getFriendlyAxiosMessage(e, "Could not load page."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  function addBullet() {
    setBullets((b) => (b.length >= MAX_BULLETS ? b : [...b, ""]));
  }

  function removeBullet(index: number) {
    setBullets((b) => (b.length <= 1 ? [""] : b.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedBullets = bullets.map((x) => x.trim()).filter(Boolean);
    if (trimmedBullets.length < 1) {
      setError("Add at least one bullet.");
      return;
    }
    if (trimmedBullets.length > MAX_BULLETS) {
      setError(`At most ${MAX_BULLETS} bullets.`);
      return;
    }
    if (trimmedBullets.some((b) => b.length > MAX_BULLET)) {
      setError(`Each bullet must be at most ${MAX_BULLET} characters.`);
      return;
    }
    const desc = description.trim();
    if (!desc) {
      setError("Description is required.");
      return;
    }
    if (desc.length > MAX_DESC) {
      setError(`Description must be at most ${MAX_DESC} characters.`);
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const sortNum = sortOrder.trim() === "" ? undefined : Number(sortOrder);
    if (!useDefaultSortOrder && sortOrder.trim() !== "" && Number.isNaN(sortNum)) {
      setError("Sort order must be a number.");
      return;
    }

    setSaving(true);
    try {
      const updated = await patchEducationResource(resourceId, {
        title: title.trim(),
        description: desc,
        bullets: trimmedBullets,
        iconKey,
        published,
        ...(useDefaultSortOrder
          ? { sortOrder: null }
          : sortNum !== undefined
            ? { sortOrder: sortNum }
            : {}),
      });
      setSuccess("Saved.");
      setUseDefaultSortOrder(updated.sortOrder === null);
      setSortOrder(updated.sortOrder != null ? String(updated.sortOrder) : "");
      router.refresh();
    } catch (err) {
      setError(getFriendlyAxiosMessage(err, "Could not save page."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (error && !title) {
    return (
      <DashboardPage>
        <DashboardContainer className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Link href="/admin/education" className="text-sm font-semibold text-primary underline">
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
          title="Edit help page"
          description="Changes apply to the public symptom guide, glossary, or knowledge base route for this slug."
          backHref="/admin/education"
          backAriaLabel="Back to help pages list"
        />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm font-medium text-primary" role="status">
              {success}
            </p>
          ) : null}

          <DashboardPanel className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Slug</label>
              <input className={inputClass} value={slug} readOnly disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edu-title">
                Title
              </label>
              <input
                id="edu-title"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edu-desc">
                Description
              </label>
              <textarea
                id="edu-desc"
                className={textareaClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESC}
              />
              <p className="text-xs text-muted-foreground">
                Plain text; line breaks are preserved on the public page ({description.length} /{" "}
                {MAX_DESC}).
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Bullets</span>
                <button
                  type="button"
                  onClick={addBullet}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  <Plus className="size-4" />
                  Add bullet
                </button>
              </div>
              <div className="space-y-3">
                {bullets.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea
                      className={`${textareaClass} min-h-[80px] flex-1`}
                      value={b}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBullets((prev) => prev.map((x, j) => (j === i ? v : x)));
                      }}
                      maxLength={MAX_BULLET}
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(i)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 text-destructive hover:bg-destructive/5"
                      aria-label="Remove bullet"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="edu-icon">
                  Icon key
                </label>
                <select
                  id="edu-icon"
                  className={inputClass}
                  value={iconKey}
                  onChange={(e) => setIconKey(e.target.value as EducationSlug)}
                >
                  {EDUCATION_SLUGS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="edu-sort">
                  Sort order
                </label>
                <input
                  id="edu-sort"
                  className={inputClass}
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setUseDefaultSortOrder(false);
                  }}
                  disabled={useDefaultSortOrder}
                  inputMode="numeric"
                  placeholder="Optional"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={useDefaultSortOrder}
                onChange={(e) => {
                  const on = e.target.checked;
                  setUseDefaultSortOrder(on);
                  if (on) setSortOrder("");
                }}
                className="size-4 rounded border-primary/30"
              />
              Use default ordering (clear saved sort number)
            </label>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="size-4 rounded border-primary/30"
              />
              Published
            </label>
          </DashboardPanel>

          <div className="flex flex-wrap gap-3">
            <DashboardActionButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </DashboardActionButton>
            <Link
              href="/admin/education"
              className="inline-flex h-11 items-center rounded-xl border border-primary/20 px-5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      </DashboardContainer>
    </DashboardPage>
  );
}
