"use client";

import { useMemo, useState, type ReactNode } from "react";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  lastMonthLabels,
  revenueSeriesFromBilling,
} from "@/lib/admin-analytics-fallback";
import type {
  AdminMonthlyGrowthPoint,
  AdminMonthlyRevenuePoint,
} from "@/lib/admin-ops-api";
import type { AdminBillingSummary } from "@/lib/admin-subscriptions-api";
import { cn } from "@/lib/utils";

import { DashboardPanel } from "../dashboard/primitives";

/* -------------------------------------------------------------------------- */
/*  Data helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Prefer live `/admin/analytics` series; fall back to billing txns; always return month buckets. */
export function resolveMonthlyRevenue(
  analyticsSeries: AdminMonthlyRevenuePoint[] | undefined | null,
  billing: AdminBillingSummary | null,
): AdminMonthlyRevenuePoint[] {
  if (analyticsSeries?.length) return analyticsSeries;
  return revenueSeriesFromBilling(billing, lastMonthLabels());
}

function formatCents(cents: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}

function formatCompactCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

function periodChangePercent(values: number[]) {
  if (values.length < 2) return null;
  const prev = values[values.length - 2]!;
  const last = values[values.length - 1]!;
  if (prev === 0) return null;
  return ((last - prev) / prev) * 100;
}

/* -------------------------------------------------------------------------- */
/*  Total revenue hero                                                        */
/* -------------------------------------------------------------------------- */

export function TotalRevenueHeroCard({
  billing,
  loading,
  error,
}: {
  billing: AdminBillingSummary | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <DashboardPanel className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-7">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/8 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 size-40 rounded-full bg-primary/5 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <DollarSign className="size-3.5" />
            Total revenue
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : loading ? (
            <div className="space-y-2">
              <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted/80" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {billing?.totalRevenueDisplay ?? "$0.00"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {billing?.paymentProviderConnected
                  ? "Lifetime revenue from assistant plans and paid consultations. Amounts may be low or zero in early months."
                  : "Revenue from Chapa and consultation fees when configured. Totals can be zero until the first payment completes."}
              </p>
            </>
          )}
        </div>

        {!loading && billing ? (
          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <RevenueMetricPill
              label="MRR"
              value={billing.monthlyRecurringRevenueDisplay}
            />
            <RevenueMetricPill
              label="Active accounts"
              value={billing.activeSubscriptions.toLocaleString("en-US")}
            />
            <RevenueMetricPill
              label="Churn"
              value={
                billing.churnRatePercent === null
                  ? "—"
                  : `${billing.churnRatePercent.toFixed(1)}%`
              }
            />
            <Link
              href="/admin/subscriptions"
              className="col-span-2 inline-flex h-10 items-center justify-center rounded-xl border border-primary/15 bg-white/80 text-sm font-semibold text-primary transition-colors hover:bg-primary/6"
            >
              Manage subscriptions
            </Link>
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

function RevenueMetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white/70 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Interactive user growth (area chart)                                      */
/* -------------------------------------------------------------------------- */

export function InteractiveUserGrowthChart({
  data,
  loading = false,
  emptyMessage = "No user data for this period yet.",
}: {
  data: AdminMonthlyGrowthPoint[] | undefined | null;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const chartData = data ?? [];

  if (loading) {
    return <ChartPanelSkeleton title="User growth" />;
  }

  if (chartData.length === 0) {
    return (
      <ChartEmptyPanel title="User growth" message={emptyMessage} />
    );
  }
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const values = useMemo(() => chartData.map((d) => d.users), [chartData]);
  const change = periodChangePercent(values);
  const max = Math.max(...values, 1);
  const width = 560;
  const height = 200;
  const padX = 8;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = chartData.map((d, i) => {
    const x = padX + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = padY + chartH - (d.users / max) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${padY + chartH} L ${points[0]!.x} ${padY + chartH} Z`;
  const hover = activeIndex != null ? points[activeIndex] : null;

  return (
    <DashboardPanel className="space-y-5 px-6 py-5">
      <ChartHeader
        icon={<Users className="size-5 text-primary" />}
        title="User growth"
        change={change}
        activeLabel={
          hover
            ? `${hover.month}: ${hover.users.toLocaleString("en-US")} users`
            : null
        }
      />

      <div
        className="relative"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label="User growth over time"
        >
          <defs>
            <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={padY + chartH * t}
              y2={padY + chartH * t}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          ))}
          <path d={areaPath} fill="url(#userGrowthFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <g key={p.month}>
              <rect
                x={i === 0 ? padX : (points[i - 1]!.x + p.x) / 2}
                y={0}
                width={
                  i === 0
                    ? (p.x + (points[i + 1]?.x ?? p.x + chartW / chartData.length)) / 2 - padX
                    : i === points.length - 1
                      ? width - padX - (points[i - 1]!.x + p.x) / 2
                      : (points[i + 1]!.x - points[i - 1]!.x) / 2
                }
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                tabIndex={0}
                aria-label={`${p.month}: ${p.users} users`}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={activeIndex === i ? 6 : 4}
                className={cn(
                  "transition-all",
                  activeIndex === i ? "fill-primary" : "fill-primary/70",
                )}
              />
            </g>
          ))}
          {hover ? (
            <>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={padY}
                y2={padY + chartH}
                stroke="var(--color-primary)"
                strokeOpacity={0.25}
                strokeDasharray="4 4"
              />
              <circle cx={hover.x} cy={hover.y} r={7} className="fill-primary/15" />
              <circle cx={hover.x} cy={hover.y} r={4} className="fill-primary" />
            </>
          ) : null}
        </svg>

        {hover ? (
          <ChartTooltip
            className="left-[var(--tooltip-x)] top-2 -translate-x-1/2"
            style={{ "--tooltip-x": `${(hover.x / width) * 100}%` } as React.CSSProperties}
          >
            <p className="text-xs font-medium text-muted-foreground">{hover.month}</p>
            <p className="text-sm font-semibold text-foreground">
              {hover.users.toLocaleString("en-US")} users
            </p>
          </ChartTooltip>
        ) : null}
      </div>

      <div className="flex justify-between gap-2 px-1">
        {chartData.map((d) => (
          <span
            key={d.month}
            className="flex-1 text-center text-xs font-medium text-muted-foreground"
          >
            {d.month}
          </span>
        ))}
      </div>
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Interactive revenue (bar chart) — sidebar                                   */
/* -------------------------------------------------------------------------- */

export function InteractiveRevenueChart({
  data,
  currency = "ETB",
  loading = false,
}: {
  data: AdminMonthlyRevenuePoint[] | undefined | null;
  currency?: string;
  loading?: boolean;
}) {
  const chartData =
    data?.length ? data : lastMonthLabels().map((month) => ({ month, revenueCents: 0 }));

  if (loading) {
    return <ChartPanelSkeleton title="Revenue" compact />;
  }
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const values = useMemo(() => chartData.map((d) => d.revenueCents), [chartData]);
  const change = periodChangePercent(values);
  const max = Math.max(...values, 1);
  const hover = activeIndex != null ? chartData[activeIndex] : null;

  return (
    <DashboardPanel className="space-y-5 px-5 py-5">
      <ChartHeader
        icon={<TrendingUp className="size-5 text-primary" />}
        title="Revenue"
        change={change}
        activeLabel={
          hover
            ? `${hover.month}: ${formatCents(hover.revenueCents, currency)}`
            : null
        }
        compact
      />

      <div
        className="flex h-40 items-end gap-2 pt-1"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {chartData.map((item, i) => {
          const heightPercent = (item.revenueCents / max) * 100;
          const barHeight =
            item.revenueCents === 0
              ? 6
              : Math.max(Math.round((heightPercent / 100) * 128), 10);
          const isActive = activeIndex === i;
          return (
            <button
              key={item.month}
              type="button"
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2 outline-none"
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              aria-label={`${item.month}: ${formatCents(item.revenueCents, currency)}`}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums transition-opacity",
                  isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100",
                )}
              >
                {formatCompactCount(item.revenueCents / 100)}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-200",
                  isActive
                    ? "bg-primary shadow-[0_8px_24px_-8px_rgba(73,96,188,0.55)]"
                    : "bg-primary/25 group-hover:bg-primary/45",
                )}
                style={{ height: barHeight }}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.month}
              </span>
            </button>
          );
        })}
      </div>

      {hover ? (
        <div className="rounded-xl border border-primary/12 bg-primary/5 px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground">{hover.month}</p>
          <p className="text-base font-semibold text-foreground">
            {formatCents(hover.revenueCents, currency)}
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          {chartData.every((p) => p.revenueCents === 0)
            ? "No paid revenue in this window yet — bars show zero until payments complete."
            : "Hover a bar to inspect monthly revenue"}
        </p>
      )}
    </DashboardPanel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared UI                                                                 */
/* -------------------------------------------------------------------------- */

function ChartHeader({
  icon,
  title,
  change,
  activeLabel,
  compact,
}: {
  icon: ReactNode;
  title: string;
  change: number | null;
  activeLabel: string | null;
  compact?: boolean;
}) {
  const trendUp = change != null && change >= 0;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2
          className={cn(
            "font-semibold tracking-tight text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          {title}
        </h2>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        {change != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trendUp
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-rose-500/10 text-rose-700",
            )}
          >
            {trendUp ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        ) : null}
        {activeLabel ? (
          <p className="max-w-[12rem] truncate text-xs font-medium text-primary">
            {activeLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChartPanelSkeleton({
  title,
  compact,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <DashboardPanel className="space-y-5 px-6 py-5">
      <div className="h-6 w-36 animate-pulse rounded-md bg-muted" />
      <div
        className={cn(
          "w-full animate-pulse rounded-xl bg-muted/70",
          compact ? "h-40" : "h-[200px]",
        )}
      />
      <div className="flex justify-between gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 flex-1 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    </DashboardPanel>
  );
}

function ChartEmptyPanel({
  title,
  message,
  compact,
}: {
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <DashboardPanel
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        compact && "py-8",
      )}
    >
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </DashboardPanel>
  );
}

function ChartTooltip({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 rounded-xl border border-primary/12 bg-white px-3 py-2 shadow-lg",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
