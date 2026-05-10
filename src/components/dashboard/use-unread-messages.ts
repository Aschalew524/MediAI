"use client";

import { useCallback, useEffect, useState } from "react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { getMyUnreadCount } from "@/lib/services/messages-api";

/**
 * Custom event that any component can dispatch on the `window` after it
 * mutates read-state — e.g. opening a chat which marks messages as read, or
 * sending a new message. The navbar listens for it so the badge clears
 * immediately rather than waiting for the next 30s poll.
 *
 * Usage:
 *   window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
 */
export const MESSAGES_CHANGED_EVENT = "mediai:messages-changed";

const POLL_INTERVAL_MS = 30_000;

/**
 * Returns the current unread-messages total for the calling user. Polls every
 * 30s, refreshes when the tab regains focus, and listens for the
 * `MESSAGES_CHANGED_EVENT` custom event so on-screen actions can clear the
 * navbar badge instantly. Returns 0 while the user is unauthenticated so the
 * hook is safe to call from any dashboard component.
 */
export function useUnreadMessages(): number {
  const { user, isLoading } = useDashboardAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const next = await getMyUnreadCount();
      setCount(Math.max(0, next.count | 0));
    } catch {
      // Silent on transient failures — the badge just stays at its last
      // known value rather than flashing an error in the navbar.
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
    window.addEventListener(MESSAGES_CHANGED_EVENT, onChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(MESSAGES_CHANGED_EVENT, onChanged);
    };
  }, [user, refresh]);

  return count;
}
