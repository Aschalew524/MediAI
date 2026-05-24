import api from "@/lib/axios";

/**
 * Phase 6 — single notification as rendered by the bell dropdown.
 *
 * Backend enum is mirrored as a string-literal union so the dropdown can
 * render type-specific icons without importing the Prisma client. Add new
 * enum values to BOTH sides in lockstep.
 */
export type NotificationType =
  | "booking_submitted"
  | "booking_paid"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "booking_reminder_24h"
  | "booking_reminder_1h"
  | "meeting_link_set"
  | "message_received"
  | "system";

export type ApiNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type ApiNotificationList = {
  items: ApiNotification[];
  total: number;
  /** Global unread total, independent of the current page filter. */
  unreadCount: number;
  page: number;
  pageSize: number;
};

export type ApiNotificationUnreadCount = {
  count: number;
};

export type ListNotificationsParams = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

/**
 * Phase 6 — dispatched after any call that mutates notification state
 * (mark-read / mark-all-read). The header bell listens for this on
 * `window` to refresh its badge immediately rather than waiting for the
 * 60s poll.
 */
export const NOTIFICATIONS_CHANGED_EVENT = "mediai:notifications-changed";

export function notifyNotificationsChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  } catch {
    // Old browsers / SSR — safe to ignore.
  }
}

export async function listMyNotifications(
  params: ListNotificationsParams = {},
): Promise<ApiNotificationList> {
  const cleaned: Record<string, string | number | boolean> = {};
  if (params.page) cleaned.page = params.page;
  if (params.pageSize) cleaned.pageSize = params.pageSize;
  if (params.unreadOnly) cleaned.unreadOnly = true;
  const { data } = await api.get<ApiNotificationList>("/me/notifications", {
    params: cleaned,
  });
  return data;
}

export async function getMyNotificationsUnreadCount(): Promise<ApiNotificationUnreadCount> {
  const { data } = await api.get<ApiNotificationUnreadCount>(
    "/me/notifications/unread-count",
  );
  return data;
}

export async function markNotificationRead(
  id: string,
): Promise<ApiNotification> {
  const { data } = await api.post<ApiNotification>(
    `/me/notifications/${encodeURIComponent(id)}/read`,
  );
  notifyNotificationsChanged();
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    "/me/notifications/read-all",
  );
  notifyNotificationsChanged();
  return data;
}
