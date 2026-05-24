"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import {
  formatMinutesLabel,
  getProfessionalAvailability,
  saveProfessionalAvailability,
  type WeeklyAvailabilityItem,
} from "@/lib/consultations-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

import { DashboardBackTitle, DashboardPanel } from "./primitives";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";
import { useRequireProfessional } from "./professional-practice-pages";

/** Monday → Sunday (Calendly-style week order). */
const WEEK_DAYS: { dow: number; label: string; short: string }[] = [
  { dow: 1, label: "Monday", short: "Mon" },
  { dow: 2, label: "Tuesday", short: "Tue" },
  { dow: 3, label: "Wednesday", short: "Wed" },
  { dow: 4, label: "Thursday", short: "Thu" },
  { dow: 5, label: "Friday", short: "Fri" },
  { dow: 6, label: "Saturday", short: "Sat" },
  { dow: 0, label: "Sunday", short: "Sun" },
];

const DEFAULT_SLOT_MINUTES = 45;

/**
 * Resolve the IANA tz the doctor is in right now (e.g. "Africa/Addis_Ababa").
 * Falls back to "UTC" only in environments where `Intl.DateTimeFormat` isn't
 * available, which is essentially never in a modern browser.
 *
 * Why we care: the time-input on this page is a `<input type="time">` that
 * captures *wall-clock minutes since midnight* — purely local to whoever
 * types them in. The backend stores `(startTimeMinutes, endTimeMinutes,
 * timezone)` and reinterprets the minutes inside `timezone` to compute UTC
 * slot timestamps for patients. So if a doctor types "09:00 – 17:00" while
 * sitting in Addis Ababa but we save `timezone: "UTC"`, the backend treats
 * 09:00 as 09:00 UTC = 12:00 PM Addis, and patients (also in Addis) see
 * 12:00 PM – 8:00 PM. Defaulting to the doctor's actual tz makes the
 * "9 to 5" they typed actually be 9-to-5 for nearby patients.
 */
function defaultTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.length > 0 ? tz : "UTC";
  } catch {
    return "UTC";
  }
}

type DraftWindow = Omit<WeeklyAvailabilityItem, "id"> & { key: string };

type DaySchedule = Record<number, DraftWindow[]>;

function emptySchedule(): DaySchedule {
  return Object.fromEntries(WEEK_DAYS.map(({ dow }) => [dow, []])) as DaySchedule;
}

function newWindow(dayOfWeek: number): DraftWindow {
  return {
    key: crypto.randomUUID(),
    dayOfWeek,
    startTimeMinutes: 9 * 60,
    endTimeMinutes: 17 * 60,
    slotDurationMinutes: DEFAULT_SLOT_MINUTES,
    timezone: defaultTimezone(),
  };
}

function groupByDay(items: WeeklyAvailabilityItem[]): DaySchedule {
  const localTz = defaultTimezone();
  const schedule = emptySchedule();
  for (const item of items) {
    schedule[item.dayOfWeek] = schedule[item.dayOfWeek] ?? [];
    // Self-healing migration: if a previously-saved rule has the legacy
    // `"UTC"` default but the current browser tz is something else, silently
    // promote it to the doctor's local tz in the draft. The change isn't
    // persisted until the doctor hits "Save changes" — at which point the
    // backend rewrites the rule to the corrected timezone and the patient-
    // facing slot feed snaps to the wall-clock hours the doctor intended.
    const savedTz = item.timezone || "UTC";
    const effectiveTz =
      savedTz === "UTC" && localTz !== "UTC" ? localTz : savedTz;
    schedule[item.dayOfWeek].push({
      key: item.id ?? crypto.randomUUID(),
      dayOfWeek: item.dayOfWeek,
      startTimeMinutes: item.startTimeMinutes,
      endTimeMinutes: item.endTimeMinutes,
      slotDurationMinutes: item.slotDurationMinutes || DEFAULT_SLOT_MINUTES,
      timezone: effectiveTz,
    });
  }
  for (const { dow } of WEEK_DAYS) {
    schedule[dow].sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
  }
  return schedule;
}

function flattenSchedule(schedule: DaySchedule): Omit<WeeklyAvailabilityItem, "id">[] {
  return WEEK_DAYS.flatMap(({ dow }) =>
    schedule[dow].map(({ key: _key, ...row }) => row),
  );
}

function slotCount(start: number, end: number, duration: number): number {
  if (end <= start || duration <= 0) return 0;
  return Math.floor((end - start) / duration);
}

export function ProfessionalAvailabilityPage() {
  const profile = useRequireProfessional();
  const dashboardProfile = useDashboardProfile();
  const [schedule, setSchedule] = useState<DaySchedule>(emptySchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const totalWindows = useMemo(
    () => WEEK_DAYS.reduce((n, { dow }) => n + schedule[dow].length, 0),
    [schedule],
  );

  const localTz = useMemo(() => defaultTimezone(), []);
  const [needsTimezoneMigration, setNeedsTimezoneMigration] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getProfessionalAvailability();
      const tz = defaultTimezone();
      // Detect legacy UTC-saved rules so we can surface a "click Save to fix"
      // banner instead of silently changing the doctor's intended hours.
      const hasLegacyUtc = items.some(
        (it) => (it.timezone || "UTC") === "UTC" && tz !== "UTC",
      );
      setSchedule(groupByDay(items));
      setNeedsTimezoneMigration(hasLegacyUtc);
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not load availability."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateWindow(
    dayOfWeek: number,
    key: string,
    patch: Partial<DraftWindow>,
  ) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((w) =>
        w.key === key ? { ...w, ...patch } : w,
      ),
    }));
    setSaved(false);
  }

  function addWindow(dayOfWeek: number) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: [...prev[dayOfWeek], newWindow(dayOfWeek)],
    }));
    setSaved(false);
  }

  function removeWindow(dayOfWeek: number, key: string) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((w) => w.key !== key),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const items = flattenSchedule(schedule);
      for (const row of items) {
        if (row.startTimeMinutes >= row.endTimeMinutes) {
          setError("Each time range needs an end time after the start time.");
          setSaving(false);
          return;
        }
      }
      await saveProfessionalAvailability(items);
      setSaved(true);
      setNeedsTimezoneMigration(false);
      await load();
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not save availability."));
    } finally {
      setSaving(false);
    }
  }

  if (!profile.professionalProfile) {
    return null;
  }

  return (
    <ProfessionalDashboardShell profile={dashboardProfile}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DashboardBackTitle
            title="Weekly availability"
            description="Set when patients can book. Each block is split into bookable slots (default 45 minutes). Taken slots are hidden on the patient side."
          />
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void handleSave()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-primary" role="status">
            Availability saved. Patients will see open slots on your Top Doctors profile.
          </p>
        ) : null}

        {loading ? (
          <DashboardPanel className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </DashboardPanel>
        ) : (
          <DashboardPanel className="overflow-hidden p-0">
            <div className="border-b border-primary/10 bg-muted/30 px-4 py-3 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Weekly hours
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {totalWindows === 0
                  ? "No hours set yet — use + on a day to add your first block."
                  : `${totalWindows} time block${totalWindows === 1 ? "" : "s"} across the week`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Times are interpreted in your timezone:{" "}
                <span className="font-medium text-foreground">{localTz}</span>
                {needsTimezoneMigration ? (
                  <span className="ml-1 text-amber-700">
                    — Existing blocks were saved as UTC. Click Save changes to
                    move them to your local timezone so patients see your real
                    hours.
                  </span>
                ) : null}
              </p>
            </div>

            <ul className="divide-y divide-primary/10">
              {WEEK_DAYS.map(({ dow, label }) => (
                <DayRow
                  key={dow}
                  dayLabel={label}
                  windows={schedule[dow]}
                  onAdd={() => addWindow(dow)}
                  onRemove={(key) => removeWindow(dow, key)}
                  onUpdate={(key, patch) => updateWindow(dow, key, patch)}
                />
              ))}
            </ul>
          </DashboardPanel>
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}

function DayRow({
  dayLabel,
  windows,
  onAdd,
  onRemove,
  onUpdate,
}: {
  dayLabel: string;
  windows: DraftWindow[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onUpdate: (key: string, patch: Partial<DraftWindow>) => void;
}) {
  const isAvailable = windows.length > 0;

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:gap-6 sm:px-6 sm:py-5">
      <div className="flex w-full shrink-0 items-start justify-between sm:w-36 sm:flex-col sm:justify-start">
        <div>
          <p className="text-sm font-semibold text-foreground">{dayLabel}</p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              isAvailable ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isAvailable ? "Available" : "Unavailable"}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add hours on ${dayLabel}`}
          className="inline-flex size-9 items-center justify-center rounded-full border border-primary/25 text-primary transition-colors hover:bg-primary/10 sm:mt-3"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {!isAvailable ? (
          <p className="text-sm text-muted-foreground">
            No hours — click <span className="font-medium text-foreground">+</span> to add a
            time block.
          </p>
        ) : (
          windows.map((window) => {
            const slots = slotCount(
              window.startTimeMinutes,
              window.endTimeMinutes,
              window.slotDurationMinutes,
            );
            const invalid = window.startTimeMinutes >= window.endTimeMinutes;

            return (
              <div
                key={window.key}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-xl border bg-background px-3 py-2.5 sm:gap-3 sm:px-4",
                  invalid ? "border-destructive/40" : "border-primary/15",
                )}
              >
                <TimeInput
                  value={window.startTimeMinutes}
                  onChange={(startTimeMinutes) =>
                    onUpdate(window.key, { startTimeMinutes })
                  }
                  aria-label="Start time"
                />
                <span className="text-sm text-muted-foreground">–</span>
                <TimeInput
                  value={window.endTimeMinutes}
                  onChange={(endTimeMinutes) =>
                    onUpdate(window.key, { endTimeMinutes })
                  }
                  aria-label="End time"
                />

                <span className="hidden h-5 w-px bg-primary/15 sm:block" aria-hidden />

                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">Slot</span>
                  <select
                    value={window.slotDurationMinutes}
                    onChange={(e) =>
                      onUpdate(window.key, {
                        slotDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="h-8 rounded-lg border border-primary/20 bg-white px-2 text-xs font-medium text-foreground"
                  >
                    {[30, 45, 60].map((n) => (
                      <option key={n} value={n}>
                        {n} min
                      </option>
                    ))}
                  </select>
                </label>

                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    invalid
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {invalid
                    ? "Invalid range"
                    : slots === 0
                      ? "No slots"
                      : `${slots} slot${slots === 1 ? "" : "s"}`}
                </span>

                {!invalid && slots > 0 ? (
                  <span className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
                    {formatMinutesLabel(window.startTimeMinutes)} –{" "}
                    {formatMinutesLabel(window.endTimeMinutes)}
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => onRemove(window.key)}
                  aria-label="Remove time block"
                  className="ml-auto inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </li>
  );
}

function TimeInput({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (minutes: number) => void;
  "aria-label": string;
}) {
  return (
    <input
      type="time"
      aria-label={ariaLabel}
      value={minutesToTimeInput(value)}
      onChange={(e) => onChange(timeInputToMinutes(e.target.value))}
      className="h-9 w-[7.25rem] rounded-lg border border-primary/20 bg-white px-2 text-sm font-medium text-foreground"
    />
  );
}

function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
