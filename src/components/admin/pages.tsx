"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  ChevronDown,
  CreditCard,
  DollarSign,
  Minus,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import type {
  AdminActivity,
  AdminStatCard,
  AdminTransaction,
  AdminUser,
  MonthlyGrowth,
  SubscriptionPlan,
  TransactionStatus,
  UserRole,
  UserStatus,
} from "@/lib/admin-content";
import { useAdminConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  DashboardActionButton,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
  DashboardSectionHeader,
} from "../dashboard/primitives";

/* -------------------------------------------------------------------------- */
/*  Admin Dashboard                                                           */
/* -------------------------------------------------------------------------- */

export function AdminDashboardPage() {
  const { data: config } = useAdminConfig();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {config.statCards.map((card) => (
            <StatCard key={card.label} card={card} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <GrowthChart data={config.monthlyGrowth} />
          <RecentActivityPanel activities={config.recentActivity} />
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function StatCard({ card }: { card: AdminStatCard }) {
  const TrendIcon =
    card.trend === "up"
      ? ArrowUpRight
      : card.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <DashboardPanel className="space-y-3 px-6 py-5">
      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {card.value}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            card.trend === "up" && "bg-emerald-50 text-emerald-600",
            card.trend === "down" && "bg-red-50 text-red-500",
            card.trend === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          <TrendIcon className="size-3" />
          {card.trendValue}
        </span>
      </div>
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
}: {
  activities: AdminActivity[];
}) {
  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Recent Activity
        </h2>
      </div>

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
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ActivityIcon({
  type,
}: {
  type: AdminActivity["type"];
}) {
  switch (type) {
    case "signup":
      return <UserPlus className="size-3.5" />;
    case "verification":
      return <BadgeCheck className="size-3.5" />;
    case "payment":
      return <DollarSign className="size-3.5" />;
    case "subscription":
      return <CreditCard className="size-3.5" />;
    case "block":
      return <Ban className="size-3.5" />;
  }
}

/* -------------------------------------------------------------------------- */
/*  User & Doctor Management                                                  */
/* -------------------------------------------------------------------------- */

type UserFilter = "all" | UserRole;

export function UserManagementPage() {
  const { data: config } = useAdminConfig();
  const [filter, setFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(config.users);
  const [verifyModal, setVerifyModal] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filter !== "all") {
      result = result.filter((u) => u.role === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return result;
  }, [users, filter, search]);

  function toggleBlock(userId: string) {
    setUsers((current) =>
      current.map((u) =>
        u.id === userId
          ? { ...u, status: (u.status === "blocked" ? "active" : "blocked") as UserStatus }
          : u,
      ),
    );
  }

  function verifyDoctor(userId: string) {
    setUsers((current) =>
      current.map((u) =>
        u.id === userId
          ? { ...u, status: "active" as UserStatus, licenseStatus: "verified" as const }
          : u,
      ),
    );
    setVerifyModal(null);
  }

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-8">
          <DashboardSectionHeader
            title="User & Doctor Management"
            description="Verify doctor licenses, approve profiles, and manage user accounts."
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as UserFilter)}
                className="h-11 appearance-none rounded-xl border border-primary/15 bg-white px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="all">All</option>
                <option value="user">Users</option>
                <option value="doctor">Doctors</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <DashboardPanel className="overflow-hidden p-0">
            <div className="hidden border-b border-primary/10 px-6 py-3.5 sm:grid sm:grid-cols-[1fr_1fr_100px_100px_140px] sm:gap-4">
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
                Status
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Actions
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onToggleBlock={() => toggleBlock(user.id)}
                  onVerify={() => setVerifyModal(user)}
                />
              ))
            )}
          </DashboardPanel>
        </DashboardContainer>
      </DashboardPage>

      {verifyModal ? (
        <VerifyLicenseModal
          user={verifyModal}
          onConfirm={() => verifyDoctor(verifyModal.id)}
          onClose={() => setVerifyModal(null)}
        />
      ) : null}
    </>
  );
}

function UserRow({
  user,
  onToggleBlock,
  onVerify,
}: {
  user: AdminUser;
  onToggleBlock: () => void;
  onVerify: () => void;
}) {
  const isDoctor = user.role === "doctor";
  const needsVerification =
    isDoctor && user.licenseStatus === "pending";

  return (
    <div className="border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_1fr_100px_100px_140px] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        {isDoctor && user.specialty ? (
          <p className="mt-0.5 text-xs text-primary/80">{user.specialty}</p>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
        {user.joinedAt}
      </p>

      <div className="mt-2 sm:mt-0">
        <RoleBadge role={user.role} />
      </div>

      <div className="mt-1 sm:mt-0">
        <StatusBadge status={user.status} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
        {needsVerification ? (
          <button
            type="button"
            onClick={onVerify}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            <ShieldCheck className="size-3" />
            Verify
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleBlock}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors",
            user.status === "blocked"
              ? "border-primary/20 text-primary hover:bg-primary/5"
              : "border-destructive/30 text-destructive hover:bg-destructive/5",
          )}
        >
          {user.status === "blocked" ? (
            <>
              <UserCheck className="size-3" />
              Unblock
            </>
          ) : (
            <>
              <ShieldAlert className="size-3" />
              Block
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        role === "doctor"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "active" && "bg-emerald-50 text-emerald-600",
        status === "pending" && "bg-amber-50 text-amber-600",
        status === "blocked" && "bg-red-50 text-red-500",
      )}
    >
      {status}
    </span>
  );
}

function VerifyLicenseModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_35px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold">Verify Doctor License</h3>
          <button
            type="button"
            aria-label="Close verify dialog"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/12 bg-primary/3 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">
              {user.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user.email}
            </p>
            {user.specialty ? (
              <p className="mt-1 text-xs font-medium text-primary">
                {user.specialty}
              </p>
            ) : null}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            Confirm that this doctor&rsquo;s medical license has been reviewed
            and meets the platform requirements. This action will mark their
            profile as verified and grant full access.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <DashboardActionButton onClick={onConfirm}>
              Verify License
            </DashboardActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subscription & Payment Management                                         */
/* -------------------------------------------------------------------------- */

export function SubscriptionManagementPage() {
  const { data: config } = useAdminConfig();

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardSectionHeader
          title="Subscriptions & Payments"
          description="Manage service plans, pricing, and monitor transaction statuses."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <PlansPanel plans={config.subscriptionPlans} />
          <RevenueSummaryPanel
            totalRevenue={config.revenueSummary.totalRevenue}
            activeSubscriptions={config.revenueSummary.activeSubscriptions}
            churnRate={config.revenueSummary.churnRate}
          />
        </div>

        <TransactionsTable transactions={config.transactions} />
      </DashboardContainer>
    </DashboardPage>
  );
}

function PlansPanel({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <CreditCard className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Service Plans
        </h2>
      </div>

      <div className="space-y-0.5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between gap-4 border-b border-primary/8 py-4 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {plan.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.monthlyPrice}/mo &middot; {plan.yearlyPrice}/yr
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                {plan.subscriberCount.toLocaleString()} users
              </span>
              <button
                type="button"
                className="inline-flex h-8 items-center rounded-lg border border-primary/20 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function RevenueSummaryPanel({
  totalRevenue,
  activeSubscriptions,
  churnRate,
}: {
  totalRevenue: string;
  activeSubscriptions: number;
  churnRate: string;
}) {
  const items: { label: string; value: string; icon: ReactNode }[] = [
    {
      label: "Total Revenue",
      value: totalRevenue,
      icon: <DollarSign className="size-4" />,
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions.toLocaleString(),
      icon: <Users className="size-4" />,
    },
    {
      label: "Churn Rate",
      value: churnRate,
      icon: <TrendingUp className="size-4" />,
    },
  ];

  return (
    <DashboardPanel className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <DollarSign className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Revenue Summary
        </h2>
      </div>

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
    </DashboardPanel>
  );
}

function TransactionsTable({
  transactions,
}: {
  transactions: AdminTransaction[];
}) {
  return (
    <DashboardPanel className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-primary/10 px-6 py-4">
        <Activity className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Recent Transactions
        </h2>
      </div>

      <div className="hidden border-b border-primary/10 px-6 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_100px_100px] sm:gap-4">
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
          className="border-b border-primary/8 px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_100px_100px_100px_100px] sm:items-center sm:gap-4"
        >
          <p className="text-sm font-semibold text-foreground">
            {txn.userName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
            {txn.plan}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground sm:mt-0">
            {txn.amount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
            {txn.date}
          </p>
          <div className="mt-2 flex justify-end sm:mt-0">
            <TransactionStatusBadge status={txn.status} />
          </div>
        </div>
      ))}
    </DashboardPanel>
  );
}

function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "completed" && "bg-emerald-50 text-emerald-600",
        status === "pending" && "bg-amber-50 text-amber-600",
        status === "failed" && "bg-red-50 text-red-500",
      )}
    >
      {status}
    </span>
  );
}
