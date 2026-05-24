"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type ApiNotification,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications-api";

const PAGE_SIZE = 20;

type Tab = "all" | "unread";

/**
 * Phase 6 — full-page notifications inbox. Paired with the navbar bell:
 * the bell shows the latest 10 with a dropdown, this page is the canonical
 * paginated archive plus a `Mark all read` button.
 */
export function NotificationsInbox() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();

  const fetchPage = useCallback(
    async (nextPage: number, nextTab: Tab) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listMyNotifications({
          page: nextPage,
          pageSize: PAGE_SIZE,
          unreadOnly: nextTab === "unread",
        });
        setItems(res.items);
        setTotal(res.total);
        setUnreadCount(res.unreadCount);
        setPage(res.page);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load notifications. Try again in a moment.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchPage(1, tab);
  }, [fetchPage, tab]);

  const handleRowClick = useCallback(
    async (n: ApiNotification) => {
      if (!n.readAt) {
        // Optimistically mark read in-place; the API call is fire-and-
        // forget so the navigation feels instant.
        setItems((prev) =>
          prev.map((row) =>
            row.id === n.id
              ? { ...row, readAt: new Date().toISOString() }
              : row,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        void markNotificationRead(n.id).catch(() => {
          // Revert if the request fails — keeps state honest on flaky
          // networks. The bell badge re-syncs on its next poll anyway.
          setItems((prev) =>
            prev.map((row) =>
              row.id === n.id ? { ...row, readAt: null } : row,
            ),
          );
          setUnreadCount((prev) => prev + 1);
        });
      }
      if (n.actionUrl) {
        router.push(n.actionUrl);
      }
    },
    [router],
  );

  const handleMarkAll = useCallback(async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((row) =>
          row.readAt ? row : { ...row, readAt: new Date().toISOString() },
        ),
      );
      setUnreadCount(0);
      if (tab === "unread") {
        // Same tab now has no rows by definition — refetch so the empty
        // state shows up.
        void fetchPage(1, tab);
      }
    } catch {
      // No-op; the unread badge will sync on next bell poll.
    } finally {
      setMarkingAll(false);
    }
  }, [fetchPage, tab, unreadCount]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-primary/10 bg-muted/30 p-1 text-sm">
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            All
            {total > 0 ? (
              <span className="ml-2 text-xs text-muted-foreground">
                {total}
              </span>
            ) : null}
          </TabButton>
          <TabButton
            active={tab === "unread"}
            onClick={() => setTab("unread")}
          >
            Unread
            {unreadCount > 0 ? (
              <span className="ml-2 rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount}
              </span>
            ) : null}
          </TabButton>
        </div>

        <button
          type="button"
          onClick={() => void handleMarkAll()}
          disabled={unreadCount === 0 || markingAll}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {markingAll ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCheck className="size-3.5" />
          )}
          Mark all read
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="rounded-2xl border border-primary/10 bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-5 animate-spin" />
          Loading your notifications…
        </div>
      ) : items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-primary/10 bg-background">
          {items.map((n, idx) => (
            <li
              key={n.id}
              className={cn(idx > 0 && "border-t border-primary/5")}
            >
              <button
                type="button"
                onClick={() => void handleRowClick(n)}
                className={cn(
                  "block w-full px-4 py-4 text-left transition-colors hover:bg-muted/40",
                  !n.readAt && "bg-primary/4",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                      n.readAt ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 pt-2 text-sm">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void fetchPage(page - 1, tab)}
            className="rounded-lg border border-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void fetchPage(page + 1, tab)}
            className="rounded-lg border border-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/10 bg-muted/30 px-4 py-16 text-center">
      <div className="mb-6 rounded-full bg-primary/5 p-6">
        {tab === "unread" ? (
          <CheckCheck className="size-10 text-muted-foreground/40" />
        ) : (
          <Bell className="size-10 text-muted-foreground/40" />
        )}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {tab === "unread"
          ? "You're all caught up"
          : "No notifications yet"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {tab === "unread"
          ? "New notifications will appear here when something needs your attention."
          : "We'll let you know when a consultation status changes or a doctor sends you a meeting link."}
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-primary/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
      >
        <Inbox className="size-4" /> Back to dashboard
      </Link>
    </div>
  );
}
