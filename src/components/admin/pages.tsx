"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Activity,
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  HeartPulse,
  Loader2,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import type { MonthlyGrowth } from "@/lib/admin-content";
import {
  createAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  getAdminBillingSummary,
  getAdminSubscriptionPlans,
  patchAdminSubscriptionPlan,
  priceCentsFromInput,
  priceInputFromCents,
  type AdminBillingSummary,
  type AdminBillingTransaction,
  type AdminSubscriptionPlan,
  type SubscriptionPlanWritePayload,
} from "@/lib/admin-subscriptions-api";
import {
  getAdminRecentActivity,
  getAdminSummary,
  getAdminUsers,
  type AdminActivityItem,
  type AdminActivityType,
  type AdminSummaryResponse,
  type AdminUserListItem,
} from "@/lib/admin-ops-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { useAdminConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  DashboardBackLink,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
  DashboardSectionHeader,
} from "../dashboard/primitives";

/* -------------------------------------------------------------------------- */
/*  Admin Dashboard                                                           */
/* -------------------------------------------------------------------------- */

type LiveSummaryStat = {
  label: string;
  valueKey: keyof AdminSummaryResponse;
};

const LIVE_SUMMARY_STATS: LiveSummaryStat[] = [
  { label: "Total users", valueKey: "userCount" },
  { label: "Profiles (onboarded)", valueKey: "profileCount" },
  { label: "Support reports", valueKey: "supportReportCount" },
  { label: "Admins", valueKey: "adminCount" },
  { label: "New registrations (24h)", valueKey: "last24hRegistrations" },
];

export function AdminDashboardPage() {
  const { data: config } = useAdminConfig();
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    async function load() {
      setSummaryLoading(true);
      setActivityLoading(true);
      setSummaryError(null);
      setActivityError(null);
      // Two independent calls; we don't want a slow activity feed to delay the
      // top stat cards (and vice-versa), so fetch in parallel and surface each
      // outcome separately.
      const [summaryRes, activityRes] = await Promise.allSettled([
        getAdminSummary({ signal: ac.signal }),
        getAdminRecentActivity({ limit: 12, signal: ac.signal }),
      ]);

      if (cancelled) return;

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
      } else {
        setSummary(null);
        setSummaryError(
          getFriendlyAxiosMessage(
            summaryRes.reason,
            "Could not load dashboard summary.",
          ),
        );
      }
      setSummaryLoading(false);

      if (activityRes.status === "fulfilled") {
        setActivity(activityRes.value.items);
      } else {
        setActivity([]);
        setActivityError(
          getFriendlyAxiosMessage(
            activityRes.reason,
            "Could not load recent activity.",
          ),
        );
      }
      setActivityLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-7 sm:space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        {summaryError ? (
          <DashboardPanel className="border-destructive/20 bg-destructive/5 px-6 py-4">
            <p className="text-sm font-medium text-destructive">{summaryError}</p>
          </DashboardPanel>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {LIVE_SUMMARY_STATS.map((stat) => (
            <LiveSummaryStatCard
              key={stat.valueKey}
              label={stat.label}
              value={
                summaryLoading || !summary
                  ? null
                  : summary[stat.valueKey].toLocaleString("en-US")
              }
              loading={summaryLoading}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1fr_380px]">
          <GrowthChart data={config.monthlyGrowth} />
          <RecentActivityPanel
            activities={activity}
            loading={activityLoading}
            error={activityError}
          />
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function LiveSummaryStatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | null;
  loading: boolean;
}) {
  return (
    <DashboardPanel className="space-y-3 px-6 py-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-3">
        {loading ? (
          <div
            className="h-9 w-24 max-w-full animate-pulse rounded-md bg-muted"
            aria-hidden
          />
        ) : (
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value ?? "—"}
          </p>
        )}
      </div>
      {!loading && value !== null ? (
        <p className="text-xs font-medium text-muted-foreground">Live</p>
      ) : null}
    </DashboardPanel>
  );
}

function GrowthChart({ data }: { data: MonthlyGrowth[] }) {
  const maxUsers = Math.max(...data.map((d) => d.users));

  return (
    <DashboardPanel className="space-y-5 px-6 py-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">User Growth</h2>
      </div>

      <div className="flex items-end gap-3 pt-2">
        {data.map((item) => {
          const heightPercent = (item.users / maxUsers) * 100;
          return (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {(item.users / 1000).toFixed(1)}k
              </span>
              <div className="w-full overflow-hidden rounded-t-lg bg-primary/8">
                <div
                  className="w-full rounded-t-lg bg-primary transition-all"
                  style={{ height: `${Math.max(heightPercent * 1.6, 12)}px` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground/80">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

function RecentActivityPanel({
  activities,
  loading,
  error,
}: {
  activities: AdminActivityItem[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Recent Activity
        </h2>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : loading ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-primary/8 py-3 last:border-b-0"
            >
              <span className="mt-0.5 size-7 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No recent activity yet — new signups and profile updates will show up
          here.
        </p>
      ) : (
        <div className="space-y-0.5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b border-primary/8 py-3.5 last:border-b-0"
            >
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                <ActivityIcon type={activity.type} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.description}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatActivityTimestamp(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

function ActivityIcon({ type }: { type: AdminActivityType }) {
  switch (type) {
    case "signup":
      return <UserPlus className="size-3.5" />;
    case "profile_update":
      return <BadgeCheck className="size-3.5" />;
    case "medical_history_update":
      return <HeartPulse className="size-3.5" />;
    case "ai_doctor_setup":
      return <Stethoscope className="size-3.5" />;
    case "support_report":
      return <FileText className="size-3.5" />;
    case "data_export":
      return <Download className="size-3.5" />;
    case "account_delete":
      return <Trash2 className="size-3.5" />;
  }
}

/**
 * Render an activity timestamp as a relative phrase ("3 minutes ago") for
 * very recent events and as an absolute date+time for older ones, which is
 * easier to scan than only relative or only absolute strings.
 */
function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const m = Math.round(diffMs / minute);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const h = Math.round(diffMs / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 7 * day) {
    const d = Math.round(diffMs / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* -------------------------------------------------------------------------- */
/*  User & Doctor Management                                                  */
/* -------------------------------------------------------------------------- */

type AdminRoleFilter = "all" | "personal" | "professional" | "admin";

const PAGE_SIZE = 20;

/**
 * Friendly display name for an admin row. We don't store first/last name on
 * `User` — `preferredName` is set during onboarding, so fall back to the
 * email's local-part for users who never finished onboarding.
 */
function displayNameFor(user: AdminUserListItem): string {
  if (user.preferredName?.trim()) return user.preferredName.trim();
  const local = user.email.split("@")[0] ?? user.email;
  return local;
}

export function UserManagementPage() {
  const [filter, setFilter] = useState<AdminRoleFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce keystrokes so a fast typer doesn't fire one request per character.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // The role filter is applied client-side over the current page (the backend
  // currently only filters by email contains). That's fine for the v1 admin UI
  // because pageSize is capped at 100.
  const refresh = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminUsers({
          page,
          pageSize: PAGE_SIZE,
          q: debouncedSearch || undefined,
          signal,
        });
        if (signal.aborted) return;
        setUsers(res.items);
        setTotal(res.total);
      } catch (e: unknown) {
        if (signal.aborted) return;
        setUsers([]);
        setTotal(0);
        setError(getFriendlyAxiosMessage(e, "Could not load users."));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [page, debouncedSearch],
  );

  useEffect(() => {
    const ac = new AbortController();
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  const filteredUsers = useMemo(() => {
    if (filter === "all") return users;
    if (filter === "admin") return users.filter((u) => u.appRole === "admin");
    if (filter === "professional") {
      return users.filter((u) => u.profileRole === "professional");
    }
    return users.filter((u) => u.profileRole === "personal");
  }, [users, filter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(total, page * PAGE_SIZE);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackLink href="/admin" ariaLabel="Back to admin home" />
        <DashboardSectionHeader
          title="User & Doctor Management"
          description="Browse every registered MediAI account. Search by email, narrow by role, and review onboarding completion."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email…"
              className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as AdminRoleFilter)}
              className="h-11 appearance-none rounded-xl border border-primary/15 bg-white px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="all">All roles</option>
              <option value="personal">Patients</option>
              <option value="professional">Doctors</option>
              <option value="admin">Admins</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {error ? (
          <DashboardPanel className="border-destructive/20 bg-destructive/5 px-6 py-4">
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          </DashboardPanel>
        ) : null}

        <DashboardPanel className="overflow-hidden p-0">
          <div className="hidden border-b border-primary/10 px-6 py-3.5 sm:grid sm:grid-cols-[1fr_1fr_120px_120px] sm:gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Name / Email
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Joined
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Role
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Onboarding
            </span>
          </div>

          {loading ? (
            <UserListSkeleton />
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              {debouncedSearch || filter !== "all"
                ? "No users match the current filters."
                : "No users registered yet."}
            </div>
          ) : (
            filteredUsers.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </DashboardPanel>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </DashboardContainer>
    </DashboardPage>
  );
}

function UserListSkeleton() {
  return (
    <div className="space-y-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_1fr_120px_120px] sm:items-center sm:gap-4"
        >
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function UserRow({ user }: { user: AdminUserListItem }) {
  const name = displayNameFor(user);
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_1fr_120px_120px] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        {user.profileRole === "professional" && user.specialty ? (
          <p className="mt-0.5 text-xs text-primary/80">{user.specialty}</p>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-muted-foreground sm:mt-0">{joined}</p>

      <div className="mt-2 sm:mt-0">
        <RoleBadge user={user} />
      </div>

      <div className="mt-1 sm:mt-0">
        <OnboardingBadge hasProfile={user.hasProfile} />
      </div>
    </div>
  );
}

function RoleBadge({ user }: { user: AdminUserListItem }) {
  if (user.appRole === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide text-amber-700">
        <ClipboardList className="size-3" />
        Admin
      </span>
    );
  }
  if (user.profileRole === "professional") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide text-primary">
        <Stethoscope className="size-3" />
        Doctor
      </span>
    );
  }
  if (user.profileRole === "personal") {
    return (
      <span className="inline-flex rounded-full bg-muted px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide text-muted-foreground">
        Patient
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-muted/60 px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide text-muted-foreground">
      No role
    </span>
  );
}

function OnboardingBadge({ hasProfile }: { hasProfile: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide",
        hasProfile
          ? "bg-emerald-50 text-emerald-600"
          : "bg-amber-50 text-amber-600",
      )}
    >
      {hasProfile ? "Complete" : "Pending"}
    </span>
  );
}

function PaginationBar({
  page,
  totalPages,
  showingFrom,
  showingTo,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const noPagination = total === 0;
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {noPagination
          ? "Showing 0 of 0"
          : `Showing ${showingFrom}–${showingTo} of ${total.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-primary/15 bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </button>
        <span className="text-xs font-medium text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-primary/15 bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subscription & Payment Management                                         */
/* -------------------------------------------------------------------------- */

type PlansLoadState =
  | { kind: "loading" }
  | { kind: "ok"; plans: AdminSubscriptionPlan[] }
  | { kind: "error"; message: string };

type BillingLoadState =
  | { kind: "loading" }
  | { kind: "ok"; summary: AdminBillingSummary }
  | { kind: "error"; message: string };

export function SubscriptionManagementPage() {
  const [plansState, setPlansState] = useState<PlansLoadState>({
    kind: "loading",
  });
  const [billingState, setBillingState] = useState<BillingLoadState>({
    kind: "loading",
  });

  // Editor modal state. `null` => closed; `"new"` => create a fresh plan;
  // a plan object => edit that plan.
  const [editorTarget, setEditorTarget] = useState<
    null | "new" | AdminSubscriptionPlan
  >(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const reloadPlans = useCallback(async (signal?: AbortSignal) => {
    setPlansState({ kind: "loading" });
    try {
      const { items } = await getAdminSubscriptionPlans({ signal });
      setPlansState({ kind: "ok", plans: items });
    } catch (e) {
      if ((e as { name?: string })?.name === "CanceledError") return;
      setPlansState({
        kind: "error",
        message: getFriendlyAxiosMessage(e, "Could not load plans."),
      });
    }
  }, []);

  const reloadBilling = useCallback(async (signal?: AbortSignal) => {
    setBillingState({ kind: "loading" });
    try {
      const summary = await getAdminBillingSummary({ signal });
      setBillingState({ kind: "ok", summary });
    } catch (e) {
      if ((e as { name?: string })?.name === "CanceledError") return;
      setBillingState({
        kind: "error",
        message: getFriendlyAxiosMessage(
          e,
          "Could not load the billing summary.",
        ),
      });
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void reloadPlans(ac.signal);
    void reloadBilling(ac.signal);
    return () => ac.abort();
  }, [reloadPlans, reloadBilling]);

  async function handleDelete(id: string) {
    setPendingDeleteId(id);
    try {
      await deleteAdminSubscriptionPlan(id);
      await reloadPlans();
    } catch (e) {
      window.alert(getFriendlyAxiosMessage(e, "Could not delete plan."));
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackLink href="/admin" ariaLabel="Back to admin home" />
        <DashboardSectionHeader
          title="Subscriptions & Payments"
          description="Manage service plans, pricing, and monitor transaction statuses."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <PlansPanel
            state={plansState}
            pendingDeleteId={pendingDeleteId}
            onCreate={() => setEditorTarget("new")}
            onEdit={(plan) => setEditorTarget(plan)}
            onDelete={handleDelete}
          />
          <RevenueSummaryPanel state={billingState} />
        </div>

        <TransactionsTable state={billingState} />

        {editorTarget !== null ? (
          <PlanEditorModal
            initial={editorTarget === "new" ? null : editorTarget}
            onClose={() => setEditorTarget(null)}
            onSaved={async () => {
              setEditorTarget(null);
              await Promise.all([reloadPlans(), reloadBilling()]);
            }}
          />
        ) : null}
      </DashboardContainer>
    </DashboardPage>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plans panel                                                               */
/* -------------------------------------------------------------------------- */

function PlansPanel({
  state,
  pendingDeleteId,
  onCreate,
  onEdit,
  onDelete,
}: {
  state: PlansLoadState;
  pendingDeleteId: string | null;
  onCreate: () => void;
  onEdit: (plan: AdminSubscriptionPlan) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Service Plans
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          New plan
        </button>
      </div>

      {state.kind === "loading" ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : state.kind === "error" ? (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {state.message}
        </p>
      ) : state.plans.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No plans yet — click &quot;New plan&quot; to add the first tier.
        </p>
      ) : (
        <div className="space-y-0.5">
          {state.plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between gap-4 border-b border-primary/8 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </p>
                  {!plan.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.monthlyPriceDisplay}/mo &middot;{" "}
                  {plan.yearlyPriceDisplay}/yr
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                  {plan.subscriberCount.toLocaleString()} users
                </span>
                <button
                  type="button"
                  onClick={() => onEdit(plan)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/20 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${plan.name}`}
                  disabled={pendingDeleteId === plan.id}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete the "${plan.name}" plan? This cannot be undone.`,
                      )
                    ) {
                      onDelete(plan.id);
                    }
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/20 text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-40"
                >
                  {pendingDeleteId === plan.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Revenue summary panel                                                     */
/* -------------------------------------------------------------------------- */

function RevenueSummaryPanel({ state }: { state: BillingLoadState }) {
  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <DollarSign className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Revenue Summary
        </h2>
      </div>

      {state.kind === "loading" ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : state.kind === "error" ? (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {state.message}
        </p>
      ) : (
        <RevenueSummaryRows summary={state.summary} />
      )}
    </DashboardPanel>
  );
}

function RevenueSummaryRows({ summary }: { summary: AdminBillingSummary }) {
  const items: { label: string; value: string; icon: ReactNode }[] = [
    {
      label: "Total revenue",
      value: summary.totalRevenueDisplay,
      icon: <DollarSign className="size-4" />,
    },
    {
      label: "Active subscriptions",
      value: summary.activeSubscriptions.toLocaleString(),
      icon: <Users className="size-4" />,
    },
    {
      label: "Monthly recurring revenue",
      value: summary.monthlyRecurringRevenueDisplay,
      icon: <TrendingUp className="size-4" />,
    },
    {
      label: "Churn rate",
      value:
        summary.churnRatePercent === null
          ? "—"
          : `${summary.churnRatePercent.toFixed(1)}%`,
      icon: <Activity className="size-4" />,
    },
  ];

  return (
    <>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 border-b border-primary/8 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
                {item.icon}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {!summary.paymentProviderConnected ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Connect a payment provider (Stripe, Paddle, …) to populate revenue
            and transactions. Active-subscription count currently reflects all
            non-admin users.
          </span>
        </p>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Transactions table                                                        */
/* -------------------------------------------------------------------------- */

function TransactionsTable({ state }: { state: BillingLoadState }) {
  return (
    <DashboardPanel className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-primary/10 px-6 py-4">
        <Activity className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Recent Transactions
        </h2>
      </div>

      {state.kind === "loading" ? (
        <div className="space-y-2 px-6 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : state.kind === "error" ? (
        <p className="m-6 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {state.message}
        </p>
      ) : state.summary.transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/8 text-primary">
            <CreditCard className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            No transactions yet
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {state.summary.paymentProviderConnected
              ? "Once your customers start subscribing, payments will show up here."
              : "Billing is not connected yet — once a payment provider is integrated, transactions will populate this list automatically."}
          </p>
        </div>
      ) : (
        <TransactionsList transactions={state.summary.transactions} />
      )}
    </DashboardPanel>
  );
}

function TransactionsList({
  transactions,
}: {
  transactions: AdminBillingTransaction[];
}) {
  return (
    <>
      <div className="hidden border-b border-primary/10 px-6 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_120px_100px] sm:gap-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          User
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Plan
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Amount
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
          Status
        </span>
      </div>

      {transactions.map((txn) => (
        <div
          key={txn.id}
          className="border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_100px_100px_120px_100px] sm:items-center sm:gap-4"
        >
          <p className="text-sm font-semibold text-foreground">
            {txn.userEmail}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
            {txn.planName}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground sm:mt-0">
            {txn.amountDisplay}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
            {new Date(txn.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </p>
          <div className="mt-2 flex justify-end sm:mt-0">
            <TransactionStatusBadge status={txn.status} />
          </div>
        </div>
      ))}
    </>
  );
}

function TransactionStatusBadge({
  status,
}: {
  status: AdminBillingTransaction["status"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-0.5 text-[0.625rem] leading-none font-semibold uppercase tracking-wide",
        status === "completed" && "bg-emerald-50 text-emerald-600",
        status === "pending" && "bg-amber-50 text-amber-600",
        status === "failed" && "bg-red-50 text-red-500",
      )}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plan editor modal                                                         */
/* -------------------------------------------------------------------------- */

function PlanEditorModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminSubscriptionPlan | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = initial !== null;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [monthlyPrice, setMonthlyPrice] = useState(
    priceInputFromCents(initial?.monthlyPriceCents ?? 0),
  );
  const [yearlyPrice, setYearlyPrice] = useState(
    priceInputFromCents(initial?.yearlyPriceCents ?? 0),
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [featuresText, setFeaturesText] = useState(
    (initial?.features ?? []).join("\n"),
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState(
    initial?.sortOrder != null ? String(initial.sortOrder) : "0",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    const monthlyCents = priceCentsFromInput(monthlyPrice);
    if (monthlyCents === null) {
      setError("Monthly price must be a non-negative number.");
      return;
    }
    const yearlyCents = priceCentsFromInput(yearlyPrice);
    if (yearlyCents === null) {
      setError("Yearly price must be a non-negative number.");
      return;
    }

    const features = featuresText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 25);

    const sortNum = Number(sortOrder);
    if (!Number.isFinite(sortNum) || sortNum < 0) {
      setError("Sort order must be a non-negative integer.");
      return;
    }

    const payload: SubscriptionPlanWritePayload = {
      name: trimmedName,
      description: description.trim() || null,
      monthlyPriceCents: monthlyCents,
      yearlyPriceCents: yearlyCents,
      currency: currency.trim().toUpperCase() || "USD",
      features,
      active,
      sortOrder: Math.trunc(sortNum),
    };

    setSaving(true);
    try {
      if (isEdit && initial) {
        await patchAdminSubscriptionPlan(initial.id, payload);
      } else {
        await createAdminSubscriptionPlan(payload);
      }
      await onSaved();
    } catch (e) {
      setError(getFriendlyAxiosMessage(e, "Could not save plan."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? `Edit "${initial!.name}"` : "New plan"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          <PlanEditorField label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pro"
              className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
              required
              maxLength={60}
            />
          </PlanEditorField>

          <PlanEditorField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary shown on the pricing page."
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </PlanEditorField>

          <div className="grid grid-cols-2 gap-3">
            <PlanEditorField label="Monthly price" required>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {currency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </PlanEditorField>
            <PlanEditorField label="Yearly price" required>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {currency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </PlanEditorField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PlanEditorField label="Currency">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={3}
                className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 text-sm uppercase outline-none transition-colors focus:border-primary"
              />
            </PlanEditorField>
            <PlanEditorField label="Sort order">
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-10 w-full rounded-lg border border-primary/15 bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </PlanEditorField>
          </div>

          <PlanEditorField
            label="Features"
            hint="One bullet per line. Max 25."
          >
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={"Personal AI Doctor\nUnlimited history\n..."}
              rows={5}
              className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </PlanEditorField>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mt-0.5 size-4 rounded border-primary/20"
            />
            <span>
              <span className="font-medium text-foreground">Active</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                When off, the plan is hidden from the public pricing page.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-lg border border-primary/15 bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlanEditorField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
