"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  CircleUserRound,
  Loader2,
  MessageCircleMore,
  Search,
  Users,
} from "lucide-react";

import {
  listProfessionalPatients,
  type ApiPatientList,
  type ApiPatientSummary,
} from "@/lib/services/professional-api";
import { useDashboardProfile } from "./use-dashboard-profile";
import { ProfessionalDashboardShell } from "./professional-shell";

const PAGE_SIZE = 24;
const DEBOUNCE_MS = 250;

type FetchState = {
  isLoading: boolean;
  data: ApiPatientList | null;
  error: string | null;
};

type FetchAction =
  | { type: "request" }
  | { type: "success"; data: ApiPatientList }
  | { type: "failure"; error: string };

const INITIAL_FETCH_STATE: FetchState = {
  isLoading: true,
  data: null,
  error: null,
};

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "request":
      return { ...state, isLoading: true, error: null };
    case "success":
      return { isLoading: false, data: action.data, error: null };
    case "failure":
      return { isLoading: false, data: null, error: action.error };
    default:
      return state;
  }
}

function readableSex(sex: ApiPatientSummary["sexAtBirth"]) {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Other";
}

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function PatientListPage() {
  const profile = useDashboardProfile();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_FETCH_STATE);

  // Debounce search input.
  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "request" });
    listProfessionalPatients({
      q: debouncedQuery || undefined,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        dispatch({ type: "success", data: res });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? "Only professional accounts can view registered patients."
            : "Could not load patients. Check your connection and try again.";
        dispatch({ type: "failure", error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const { isLoading, data, error } = state;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const showEmpty = !isLoading && !error && items.length === 0;

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Home / <span className="font-semibold text-foreground">Patients</span>
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[2.4rem] font-semibold tracking-tight text-foreground">
                Patients
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading registered patients…"
                  : `${total} registered patient${total === 1 ? "" : "s"} on this server.`}
              </p>
            </div>
          </div>
        </div>

        <SearchBar value={query} onChange={setQuery} />

        {error ? (
          <div
            className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <LoadingState />
        ) : showEmpty ? (
          <EmptyState query={debouncedQuery} />
        ) : (
          <PatientGrid items={items} />
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative block max-w-2xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search patients by name or email…"
        className="h-12 w-full rounded-xl border border-primary/12 bg-white pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function PatientGrid({ items }: { items: ApiPatientSummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <PatientCard key={p.id} patient={p} />
      ))}
    </div>
  );
}

function PatientCard({ patient }: { patient: ApiPatientSummary }) {
  const lastActivity = useMemo(
    () => formatRelative(patient.lastActivityAt),
    [patient.lastActivityAt],
  );
  const profileHref = `/dashboard/patients/${patient.id}`;
  const messageHref = `/dashboard/patients/${patient.id}/messages`;

  return (
    <div className="flex flex-col gap-4 rounded-[1.35rem] border border-primary/15 bg-white px-5 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleUserRound className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={profileHref}
            className="block truncate text-lg font-semibold text-foreground transition-colors hover:text-primary"
          >
            {patient.preferredName || "Unnamed patient"}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {patient.email}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground/70">Age</dt>
          <dd className="text-foreground">{patient.age || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/70">Sex</dt>
          <dd className="text-foreground">{readableSex(patient.sexAtBirth)}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/70">Region</dt>
          <dd className="truncate text-foreground">{patient.region || "—"}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 pt-1">
        {lastActivity ? (
          <span className="text-xs text-muted-foreground">
            Last message {lastActivity}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No messages yet</span>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={messageHref}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <MessageCircleMore className="size-3.5" />
            Message
          </Link>
          <Link
            href={profileHref}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            Open profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-[1.35rem] border border-primary/10 bg-primary/5"
        />
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[1.35rem] border border-dashed border-primary/25 bg-white px-6 py-16 text-center text-muted-foreground">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="size-7" />
      </div>
      <p className="text-base font-medium text-foreground">
        {query ? "No patients matched your search" : "No registered patients yet"}
      </p>
      <p className="max-w-md text-sm">
        {query
          ? "Try a different name or email."
          : "When patients complete the onboarding flow they will appear here automatically."}
      </p>
      {query ? null : (
        <Link
          href="/dashboard"
          className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
        >
          <span aria-hidden>←</span>
          Back to dashboard
        </Link>
      )}
    </div>
  );
}

function ProfessionalLoaderShell({ profile }: { profile: ReturnType<typeof useDashboardProfile> }) {
  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    </ProfessionalDashboardShell>
  );
}

// Re-export for parity with other pages — `<ProfessionalLoaderShell>` is also useful for the
// detail and chat pages, so we expose it here.
export { ProfessionalLoaderShell };
