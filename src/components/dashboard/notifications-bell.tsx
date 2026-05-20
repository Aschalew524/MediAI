"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type ApiNotification,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications-api";

import { useUnreadNotifications } from "./use-unread-notifications";

const PAGE_SIZE = 10;

/**
 * Phase 6 — bell button + dropdown shown in the dashboard header.
 *
 * Behaviour:
 *   * Click the bell ⇒ fetch the latest 10 notifications and show the panel.
 *   * Badge mirrors `useUnreadNotifications` (1-min poll + focus refresh).
 *   * Each row: click navigates to `actionUrl` (if any) and silently marks
 *     it read.
 *   * "Mark all as read" hits the bulk endpoint.
 *   * Closing the panel preserves the fetched list so re-opening is snappy;
 *     a fresh fetch is triggered each open to keep things current.
 */
export function NotificationsBell() {
  const unread = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [marking, setMarking] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMyNotifications({ page: 1, pageSize: PAGE_SIZE });
      setItems(res.items);
    } catch {
      // Keep whatever we had; the empty-state copy already covers "first
      // open never succeeded" so we don't need a separate error UI.
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the panel opens. Cheap (10-row query, indexed),
  // and keeps the list aligned with the badge.
  useEffect(() => {
    if (!open) return;
    void fetchLatest();
  }, [open, fetchLatest]);

  // Close on outside click + Escape — the dropdown is otherwise a portal-
  // less inline element so we manage focus ourselves.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      const node = containerRef.current;
      if (!node) return;
      if (node.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleRowClick = useCallback(
    async (n: ApiNotification) => {
      // Mark-read on click is best-effort. If the click also navigates the
      // user away (actionUrl), we fire the request without awaiting so the
      // navigation doesn't pay the round-trip cost.
      if (!n.readAt) {
        setMarking(n.id);
        // Don't await; let the hook + global event take care of badge sync.
        void markNotificationRead(n.id)
          .then(() => {
            setItems((prev) =>
              prev.map((row) =>
                row.id === n.id
                  ? { ...row, readAt: new Date().toISOString() }
                  : row,
              ),
            );
          })
          .finally(() => setMarking(null));
      }
      if (n.actionUrl) {
        setOpen(false);
        router.push(n.actionUrl);
      }
    },
    [router],
  );

  const handleMarkAll = useCallback(async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((row) =>
          row.readAt
            ? row
            : { ...row, readAt: new Date().toISOString() },
        ),
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const headerBell = useMemo(
    () => (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-primary/10 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
      >
        {unread > 0 ? (
          <BellRing className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {unread > 0 ? (
          <span
            className="pointer-events-none absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-[0_2px_8px_-2px_rgba(220,38,38,0.6)] ring-2 ring-background"
            aria-hidden="true"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
    ),
    [unread, open],
  );

  return (
    <div ref={containerRef} className="relative inline-flex">
      {headerBell}
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-primary/10 bg-background shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
            <div className="text-sm font-semibold text-foreground">
              Notifications
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unread === 0 || loading}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </div>
            ) : (
              <ul className="divide-y divide-primary/5">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleRowClick(n)}
                      className={cn(
                        "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.readAt && "bg-primary/4",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!n.readAt ? (
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
                                aria-hidden
                              />
                            ) : null}
                            <p className="truncate text-sm font-medium text-foreground">
                              {n.title}
                            </p>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                            {formatRelativeTime(n.createdAt)}
                            {n.actionUrl ? (
                              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                                <ExternalLink className="size-3" /> Open
                              </span>
                            ) : null}
                          </p>
                        </div>
                        {marking === n.id ? (
                          <Loader2 className="mt-1 size-3 animate-spin text-muted-foreground" />
                        ) : n.readAt ? (
                          <Check
                            className="mt-1 size-3 text-muted-foreground/40"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-primary/10 bg-muted/30 px-4 py-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Phase 6 — terse relative-time helper. We don't pull in a heavy date lib
 * because the bell only shows ~10 rows and the format is always coarse
 * ("3m ago", "yesterday"). Localized formatting can come later if needed.
 */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  if (diffMs < 30_000) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
