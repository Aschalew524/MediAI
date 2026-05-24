"use client";

import { useCallback, useEffect, useState } from "react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  getMyNotificationsUnreadCount,
} from "@/lib/services/notifications-api";

/**
 * Phase 6 — same shape as `useUnreadMessages`: poll the unread notification
 * count every minute, refresh on focus, and listen for the
 * `NOTIFICATIONS_CHANGED_EVENT` custom event so on-screen actions clear the
 * badge instantly. Returns 0 while the user is unauthenticated so the hook
 * is safe to call from any dashboard component.
 */
const POLL_INTERVAL_MS = 60_000;

export function useUnreadNotifications(): number {
  const { user, isLoading } = useDashboardAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await getMyNotificationsUnreadCount();
      setCount(Math.max(0, next.count | 0));
    } catch {
      // Silent on transient failures — badge stays at its last known value.
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setCount(0);
      return;
    }
    void refresh();
  }, [isLoading, user, refresh]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    function onFocus() {
      void refresh();
    }
    function onChanged() {
      void refresh();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    };
  }, [user, refresh]);

  return count;
}
