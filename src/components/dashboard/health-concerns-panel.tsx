"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  getTopDoctorMatchOptions,
  type ConditionCategory,
  type EnumOption,
} from "@/lib/top-doctors-api";
import { patchMeProfile, userFacingMeError } from "@/lib/me-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

import { useDashboardMe } from "./dashboard-me-provider";
import { DashboardPanel } from "./primitives";

/**
 * Phase 5 — patient-facing "health concerns" multi-select. Powers
 * `UserProfile.primaryConditions`, which the /top-doctors endpoint uses to
 * pre-filter doctors by canonical specialty and add a "matches your
 * concerns" badge.
 *
 * Rendered inside `MedicalHistoryPage` because that's where patients are
 * already curating health info. Stateful on its own (not part of the
 * MedicalHistoryData draft) because it persists through a different
 * endpoint (`PATCH /me/profile`) and we don't want a half-saved chronic-
 * diseases list to block the concerns save (or vice versa).
 */
export function HealthConcernsPanel() {
  const { profile, refreshMe } = useDashboardMe();
  const isProfessional = Boolean(profile?.professionalProfile);
  const initial = useMemo<string[]>(
    () => profile?.primaryConditions ?? [],
    [profile?.primaryConditions],
  );

  const [options, setOptions] = useState<EnumOption<ConditionCategory>[] | null>(
    null,
  );
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Keep draft in sync when the parent context refetches (e.g. after a
  // successful save the provider's profile may roll forward).
  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  // Load condition options on mount — the list is static so we cache it for
  // the rest of the session via a module-level promise.
  useEffect(() => {
    if (isProfessional) return;
    let cancelled = false;
    setOptionsError(null);
    getTopDoctorMatchOptions()
      .then((res) => {
        if (cancelled) return;
        setOptions(res.conditionCategories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setOptionsError(
          getFriendlyAxiosMessage(err, "Could not load health concerns."),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [isProfessional]);

  const isDirty = useMemo(() => {
    if (initial.length !== draft.length) return true;
    const a = [...initial].sort();
    const b = [...draft].sort();
    return a.some((v, i) => v !== b[i]);
  }, [initial, draft]);

  const toggle = useCallback((value: string) => {
    setDraft((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
    setSavedAt(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await patchMeProfile({ primaryConditions: draft });
      await refreshMe();
      setSavedAt(Date.now());
    } catch (e: unknown) {
      setSaveError(
        userFacingMeError(e, "Could not save your health concerns."),
      );
    } finally {
      setSaving(false);
    }
  }, [draft, refreshMe]);

  // Hide entirely for doctors — they don't pick "concerns".
  if (isProfessional) return null;

  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            Your health concerns
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick the areas you most want help with. We use these to surface
            the right specialists on Top Doctors — you can always change them
            later.
          </p>
        </div>
      </div>

      {options === null ? (
        <div className="flex h-20 items-center justify-center">
          {optionsError ? (
            <p className="text-sm text-destructive" role="alert">
              {optionsError}
            </p>
          ) : (
            <Loader2 className="size-5 animate-spin text-primary/60" />
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const selected = draft.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/15 bg-background text-foreground/80 hover:border-primary",
                )}
                aria-pressed={selected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {savedAt && !isDirty ? (
          <p className="text-xs font-medium text-emerald-700">
            Saved — your Top Doctors list will refresh next time you open it.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void save()}
          disabled={!isDirty || saving || options === null}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Save concerns"}
        </button>
      </div>
    </DashboardPanel>
  );
}
