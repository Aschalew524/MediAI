"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
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
import {
  createEducationResource,
  listEducationResourcesAdmin,
} from "@/lib/education-admin-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

const inputClass =
  "h-11 w-full rounded-xl border border-primary/15 bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const textareaClass =
  "min-h-[200px] w-full rounded-xl border border-primary/15 bg-white px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

const MAX_DESC = 20_000;
const MAX_BULLET = 2_000;
const MAX_BULLETS = 50;

export function AdminEducationCreatePage() {
  const router = useRouter();
  const [loadingList, setLoadingList] = useState(true);
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictSlug, setConflictSlug] = useState<EducationSlug | null>(null);
  const [conflictEditId, setConflictEditId] = useState<string | null>(null);

  const [slug, setSlug] = useState<EducationSlug>("symptom-guide");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [iconKey, setIconKey] = useState<EducationSlug>("symptom-guide");
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("");

  const load = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await listEducationResourcesAdmin();
      setExistingSlugs(new Set(res.items.map((i) => i.slug)));
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not load existing pages."));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const availableSlugs = useMemo(
    () => EDUCATION_SLUGS.filter((s) => !existingSlugs.has(s)),
    [existingSlugs],
  );

  useEffect(() => {
    if (availableSlugs.length && !availableSlugs.includes(slug)) {
      const first = availableSlugs[0]!;
      setSlug(first);
      setIconKey(first);
    }
  }, [availableSlugs, slug]);

  function addBullet() {
    setBullets((b) => (b.length >= MAX_BULLETS ? b : [...b, ""]));
  }

  function removeBullet(index: number) {
    setBullets((b) => (b.length <= 1 ? [""] : b.filter((_, i) => i !== index)));
  }

  async function resolveConflictEditId(s: EducationSlug) {
    const res = await listEducationResourcesAdmin();
    const row = res.items.find((i) => i.slug === s);
    setConflictEditId(row?.id ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConflictSlug(null);
    setConflictEditId(null);

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
    if (!desc || !title.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (desc.length > MAX_DESC) {
      setError(`Description must be at most ${MAX_DESC} characters.`);
      return;
    }

    const sortNum = sortOrder.trim() === "" ? undefined : Number(sortOrder);
    if (sortOrder.trim() !== "" && Number.isNaN(sortNum)) {
      setError("Sort order must be a number.");
      return;
    }

    setSaving(true);
    try {
      const created = await createEducationResource({
        slug,
        title: title.trim(),
        description: desc,
        bullets: trimmedBullets,
        iconKey,
        published,
        ...(sortNum !== undefined ? { sortOrder: sortNum } : {}),
      });
      router.push(`/admin/education/${created.id}/edit`);
      router.refresh();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflictSlug(slug);
        setError("A help page with this slug already exists.");
        await resolveConflictEditId(slug);
        return;
      }
      setError(getFriendlyAxiosMessage(err, "Could not create page."));
    } finally {
      setSaving(false);
    }
  }

  if (loadingList) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (availableSlugs.length === 0) {
    return (
      <DashboardPage>
        <DashboardContainer className="max-w-2xl space-y-6">
          <DashboardBackTitle
            title="New help page"
            description="All three slugs already exist. Unpublish one from the list if you need to recreate it, or edit the existing page."
            backHref="/admin/education"
            backAriaLabel="Back to help pages list"
          />
          <DashboardPanel className="p-6">
            <p className="text-sm text-muted-foreground">
              There are no free slugs left (symptom guide, glossary, knowledge base). Use the list
              to edit or unpublish a page first.
            </p>
            <Link
              href="/admin/education"
              className="mt-4 inline-flex text-sm font-semibold text-primary underline"
            >
              Back to list
            </Link>
          </DashboardPanel>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackTitle
          title="New help page"
          description="Create a published help resource. Slug must be one of the three fixed routes."
          backHref="/admin/education"
          backAriaLabel="Back to help pages list"
        />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
          {error ? (
            <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p role="alert">{error}</p>
              {conflictSlug && conflictEditId ? (
                <Link
                  href={`/admin/education/${conflictEditId}/edit`}
                  className="inline-flex font-semibold text-primary underline"
                >
                  Edit existing “{conflictSlug}”
                </Link>
              ) : null}
            </div>
          ) : null}

          <DashboardPanel className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edu-new-slug">
                Slug
              </label>
              <select
                id="edu-new-slug"
                className={inputClass}
                value={slug}
                onChange={(e) => {
                  const s = e.target.value as EducationSlug;
                  setSlug(s);
                  setIconKey(s);
                }}
              >
                {availableSlugs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edu-new-title">
                Title
              </label>
              <input
                id="edu-new-title"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edu-new-desc">
                Description
              </label>
              <textarea
                id="edu-new-desc"
                className={textareaClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESC}
              />
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
                <label className="text-sm font-medium text-foreground" htmlFor="edu-new-icon">
                  Icon key
                </label>
                <select
                  id="edu-new-icon"
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
                <label className="text-sm font-medium text-foreground" htmlFor="edu-new-sort">
                  Sort order
                </label>
                <input
                  id="edu-new-sort"
                  className={inputClass}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  inputMode="numeric"
                  placeholder="Optional"
                />
              </div>
            </div>

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
              {saving ? "Creating…" : "Create"}
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
