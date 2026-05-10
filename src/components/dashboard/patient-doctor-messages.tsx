"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CircleUserRound,
  Loader2,
  MessageCircleMore,
  RefreshCcw,
  Send,
  Stethoscope,
} from "lucide-react";

import {
  getMyThread,
  listMyThreads,
  sendMyMessage,
  type ApiThreadDetail,
  type ApiThreadMessage,
  type ApiThreadSummary,
} from "@/lib/services/messages-api";
import { cn } from "@/lib/utils";

import {
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";

const POLL_INTERVAL_MS = 15_000;

/**
 * Inbox view at /dashboard/messages — lists every doctor↔patient thread the
 * patient is participating in (created by the doctor when they first message
 * them). Polls every 15s so a freshly-arrived message bubbles up.
 */
export function PatientDoctorMessagesPage() {
  const profile = useDashboardProfile();

  if (profile.professionalProfile) {
    return <ProfessionalMessagesInboxPage />;
  }

  return <PatientMessagesInboxPage />;
}

function PatientMessagesInboxPage() {
  const [items, setItems] = useState<ApiThreadSummary[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(
    async (mode: "initial" | "background" = "background") => {
      if (mode === "initial") setIsInitialLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);
      try {
        const next = await listMyThreads();
        setItems(next.items);
      } catch (err: unknown) {
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (code === 401) {
          setLoadError("Please sign in to view your messages.");
        } else {
          setLoadError("Could not load your messages. Try again.");
        }
      } finally {
        if (mode === "initial") setIsInitialLoading(false);
        else setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      void refresh("background");
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <DashboardBackTitle
            title="Messages"
            description="Conversations with your doctors. New replies arrive here as soon as they are sent."
          />
          <button
            type="button"
            onClick={() => void refresh("background")}
            disabled={isRefreshing || isInitialLoading}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <RefreshCcw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <DashboardPanel className="overflow-hidden p-0">
          {isInitialLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : loadError && items.length === 0 ? (
            <ThreadsEmptyState
              variant="error"
              title={loadError}
              actionLabel="Try again"
              onAction={() => void refresh("background")}
            />
          ) : items.length === 0 ? (
            <ThreadsEmptyState
              variant="empty"
              title="No conversations yet"
              description="When a doctor sends you a message you’ll see it here. You can also reach out from the AI Doctor or your health profile."
            />
          ) : (
            <ul>
              {items.map((thread) => (
                <ThreadRow key={thread.threadId} thread={thread} />
              ))}
            </ul>
          )}
        </DashboardPanel>

        {loadError && items.length > 0 ? (
          <p className="text-xs text-amber-700" role="alert">
            {loadError}
          </p>
        ) : null}
      </DashboardContainer>
    </DashboardPage>
  );
}

/**
 * Doctor inbox at /dashboard/messages. Lists *only* the threads this doctor is
 * actually a participant in — backed by `GET /me/messages/threads`, which the
 * backend filters by `doctorUserId === caller`. This is the fix for the bug
 * where doctors were seeing every registered patient (the directory) instead
 * of only their own conversations.
 */
/**
 * Doctor inbox at /dashboard/messages. Lists *only* the threads this doctor is
 * actually a participant in — backed by `GET /me/messages/threads`, which the
 * backend filters by `doctorUserId === caller`. This is the fix for the bug
 * where doctors were seeing every registered patient (the directory) instead
 * of only their own conversations.
 */
function ProfessionalMessagesInboxPage() {
  const profile = useDashboardProfile();
  const [items, setItems] = useState<ApiThreadSummary[]>([]);
  const [items, setItems] = useState<ApiThreadSummary[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(
    async (mode: "initial" | "background" = "background") => {
      if (mode === "initial") setIsInitialLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);
      try {
        const next = await listMyThreads();
        setItems(next.items);
        const next = await listMyThreads();
        setItems(next.items);
      } catch (err: unknown) {
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (code === 401) {
          setLoadError("Please sign in to view your messages.");
        } else {
          setLoadError("Could not load patient messages. Try again.");
        }
        if (code === 401) {
          setLoadError("Please sign in to view your messages.");
        } else {
          setLoadError("Could not load patient messages. Try again.");
        }
      } finally {
        if (mode === "initial") setIsInitialLoading(false);
        else setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      void refresh("background");
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Home / <span className="font-semibold text-foreground">Messages</span>
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Patient Messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Conversations you’ve had with your patients. New replies bubble to the top.
              Conversations you’ve had with your patients. New replies bubble to the top.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh("background")}
            disabled={isRefreshing || isInitialLoading}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <RefreshCcw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <DashboardPanel className="overflow-hidden p-0">
          {isInitialLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : loadError && items.length === 0 ? (
            <ThreadsEmptyState
              variant="error"
              title={loadError}
              actionLabel="Try again"
              onAction={() => void refresh("background")}
            />
          ) : items.length === 0 ? (
            <ThreadsEmptyState
              variant="empty"
              title="No conversations yet"
              description="Open a patient profile and tap “Message” to start your first conversation. New patient replies will appear here."
              title="No conversations yet"
              description="Open a patient profile and tap “Message” to start your first conversation. New patient replies will appear here."
            />
          ) : (
            <ul>
              {items.map((thread) => (
                <ProfessionalThreadRow key={thread.threadId} thread={thread} />
              {items.map((thread) => (
                <ProfessionalThreadRow key={thread.threadId} thread={thread} />
              ))}
            </ul>
          )}
        </DashboardPanel>

        {loadError && items.length > 0 ? (
          <p className="text-xs text-amber-700" role="alert">
            {loadError}
          </p>
        ) : null}
      </div>
    </ProfessionalDashboardShell>
  );
}

/**
 * Inbox row on the doctor side. Renders the patient's name + the last
 * exchanged message, with an unread badge for messages the patient has sent
 * that the doctor hasn't opened yet. Clicking jumps into the existing
 * `/dashboard/patients/:id/messages` chat view.
 */
function ProfessionalThreadRow({ thread }: { thread: ApiThreadSummary }) {
  const name = thread.patientName.trim() || "Unnamed patient";
  const date = formatTimestamp(thread.lastMessageAt);
  const previewPrefix = thread.lastMessageSender === "doctor" ? "You: " : "";
  const preview = thread.lastMessagePreview
    ? `${previewPrefix}${thread.lastMessagePreview}`
    : "No messages yet";
  const hasUnread = thread.unreadCount > 0;
/**
 * Inbox row on the doctor side. Renders the patient's name + the last
 * exchanged message, with an unread badge for messages the patient has sent
 * that the doctor hasn't opened yet. Clicking jumps into the existing
 * `/dashboard/patients/:id/messages` chat view.
 */
function ProfessionalThreadRow({ thread }: { thread: ApiThreadSummary }) {
  const name = thread.patientName.trim() || "Unnamed patient";
  const date = formatTimestamp(thread.lastMessageAt);
  const previewPrefix = thread.lastMessageSender === "doctor" ? "You: " : "";
  const preview = thread.lastMessagePreview
    ? `${previewPrefix}${thread.lastMessagePreview}`
    : "No messages yet";
  const hasUnread = thread.unreadCount > 0;

  return (
    <li className="border-b border-primary/10 last:border-b-0">
      <Link
        href={`/dashboard/patients/${encodeURIComponent(thread.patientUserId)}/messages`}
        href={`/dashboard/patients/${encodeURIComponent(thread.patientUserId)}/messages`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
      >
        <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleUserRound className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm font-semibold text-foreground sm:text-base",
                hasUnread && "text-foreground",
              )}
            >
            <p
              className={cn(
                "truncate text-sm font-semibold text-foreground sm:text-base",
                hasUnread && "text-foreground",
              )}
            >
              {name}
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {date}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm leading-5",
                hasUnread
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {preview}
            </p>
            {hasUnread ? (
              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {thread.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

function ThreadRow({ thread }: { thread: ApiThreadSummary }) {
  const date = formatTimestamp(thread.lastMessageAt);
  const previewPrefix =
    thread.lastMessageSender === "patient" ? "You: " : "";
  const preview = thread.lastMessagePreview
    ? `${previewPrefix}${thread.lastMessagePreview}`
    : "No messages yet";
  const hasUnread = thread.unreadCount > 0;

  return (
    <li className="border-b border-primary/10 last:border-b-0">
      <Link
        href={`/dashboard/messages/${encodeURIComponent(thread.threadId)}`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
      >
        <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Stethoscope className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm font-semibold text-foreground sm:text-base",
                hasUnread && "text-foreground",
              )}
            >
              {thread.doctorName}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {date}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm leading-5",
                hasUnread
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {preview}
            </p>
            {hasUnread ? (
              <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.625rem] font-semibold leading-none text-primary-foreground">
                {thread.unreadCount}
              </span>
            ) : null}
          </div>
          {thread.doctorSpecialty ? (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {thread.doctorSpecialty}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function ThreadsEmptyState({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: {
  variant: "empty" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          variant === "error"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <MessageCircleMore className="size-7" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-primary/15 px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Chat view at /dashboard/messages/[threadId]. Mirrors the look of the
 * doctor's PatientMessagesPage but reverses the "mine vs theirs" alignment so
 * the patient's messages are on the right.
 */
export function PatientDoctorThreadPage({ threadId }: { threadId: string }) {
  const [thread, setThread] = useState<ApiThreadDetail | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const refresh = useCallback(
    async (mode: "initial" | "background" = "background") => {
      if (mode === "initial") setIsInitialLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);
      try {
        const next = await getMyThread(threadId, 200);
        setThread(next);
      } catch (err: unknown) {
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (code === 404) {
          setLoadError("This conversation could not be found.");
        } else if (code === 403) {
          setLoadError("You are not a participant in this conversation.");
        } else if (code === 401) {
          setLoadError("Please sign in to view this conversation.");
        } else {
          setLoadError("Could not load this conversation. Try again.");
        }
      } finally {
        if (mode === "initial") setIsInitialLoading(false);
        else setIsRefreshing(false);
      }
    },
    [threadId],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      void refresh("background");
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    setSendError(null);
    setIsSending(true);
    try {
      const created = await sendMyMessage(threadId, trimmed);
      setThread((current) =>
        current
          ? { ...current, messages: [...current.messages, created] }
          : current,
      );
      setDraft("");
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      if (code === 400) {
        setSendError("Message could not be sent — it may be too long or empty.");
      } else if (code === 403) {
        setSendError("You are not a participant in this conversation.");
      } else if (code === 429) {
        setSendError("You're sending messages too quickly. Slow down a bit.");
      } else {
        setSendError("Could not send your message. Try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  if (isInitialLoading) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  if (loadError && !thread) {
    return (
      <DashboardPage>
        <DashboardContainer>
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
            <p className="text-base font-semibold text-destructive">
              {loadError}
            </p>
            <Link
              href="/dashboard/messages"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              <ArrowLeft className="size-4" />
              Back to all messages
            </Link>
          </div>
        </DashboardContainer>
      </DashboardPage>
    );
  }

  const messages = thread?.messages ?? [];
  const doctorName = thread?.doctorName?.trim() || "Doctor";
  const doctorSpecialty = thread?.doctorSpecialty ?? null;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard/messages"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to all messages
          </Link>
          <p className="text-sm text-muted-foreground">
            Home /{" "}
            <Link href="/dashboard/messages" className="hover:underline">
              Messages
            </Link>{" "}
            /{" "}
            <span className="font-semibold text-foreground">{doctorName}</span>
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[1.45rem] border border-primary/15 bg-white shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]">
          <ChatHeader
            doctorName={doctorName}
            specialty={doctorSpecialty}
            isRefreshing={isRefreshing}
            onRefresh={() => void refresh("background")}
          />

          <MessageList messages={messages} doctorName={doctorName} />

          {loadError ? (
            <div className="border-t border-amber-200/40 bg-amber-50 px-5 py-2 text-xs text-amber-800">
              {loadError}
            </div>
          ) : null}

          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSend}
            isSending={isSending}
            error={sendError}
          />
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function ChatHeader({
  doctorName,
  specialty,
  isRefreshing,
  onRefresh,
}: {
  doctorName: string;
  specialty: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Stethoscope className="size-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{doctorName}</p>
          <p className="text-xs text-muted-foreground">
            {specialty ?? "Direct messages with your doctor"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        <RefreshCcw className={cn("size-3.5", isRefreshing && "animate-spin")} />
        Refresh
      </button>
    </div>
  );
}

function MessageList({
  messages,
  doctorName,
}: {
  messages: ApiThreadMessage[];
  doctorName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex min-h-[400px] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-muted-foreground"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircleMore className="size-7" />
        </div>
        <p className="text-base font-medium text-foreground">No messages yet</p>
        <p className="max-w-md text-sm">
          Send a message to {doctorName} below to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-[400px] max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-5 py-5"
    >
      {messages.map((m) => (
        <Bubble key={m.id} message={m} doctorName={doctorName} />
      ))}
    </div>
  );
}

function Bubble({
  message,
  doctorName,
}: {
  message: ApiThreadMessage;
  doctorName: string;
}) {
  const senderLabel = message.mine ? "You" : doctorName;
  const dateLabel = formatTimestamp(message.createdAt);

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        message.mine ? "items-end" : "items-start",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {senderLabel} · {dateLabel}
      </div>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6",
          message.mine
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-primary/8 text-foreground",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  isSending,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  error: string | null;
}) {
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isSending;

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-primary/10 bg-background/40 px-4 py-3"
    >
      {error ? (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) {
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Write a message…"
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-primary/15 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Enter to send · Shift + Enter for newline
      </p>
    </form>
  );
}

function formatTimestamp(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
