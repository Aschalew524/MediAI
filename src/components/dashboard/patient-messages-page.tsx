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
  Lock,
  Loader2,
  MessageCircleMore,
  RefreshCcw,
  Send,
} from "lucide-react";

import {
  listProfessionalPatientMessages,
  sendProfessionalPatientMessage,
  type ApiPatientMessage,
  type ApiPatientMessageThread,
} from "@/lib/services/professional-api";
import { getProfessionalName } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";

const POLL_INTERVAL_MS = 15_000;

export function PatientMessagesPage({ patientId }: { patientId: string }) {
  const viewerProfile = useDashboardProfile();
  const doctorName = getProfessionalName(viewerProfile);

  const [thread, setThread] = useState<ApiPatientMessageThread | null>(null);
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
        const next = await listProfessionalPatientMessages(patientId, 200);
        setThread(next);
      } catch (err: unknown) {
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (code === 404) {
          setLoadError("This patient could not be found.");
        } else if (code === 403) {
          setLoadError("Only professional accounts can message patients.");
        } else {
          setLoadError("Could not load this conversation. Try again.");
        }
      } finally {
        if (mode === "initial") setIsInitialLoading(false);
        else setIsRefreshing(false);
      }
    },
    [patientId],
  );

  useEffect(() => {
    void refresh("initial");
  }, [refresh]);

  // Lightweight polling so doctor can see patient replies without WebSockets.
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
      const created = await sendProfessionalPatientMessage(patientId, trimmed);
      setThread((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, created],
            }
          : current,
      );
      setDraft("");
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      if (code === 400) {
        setSendError("Message could not be sent — it may be too long.");
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
      <ProfessionalDashboardShell profile={viewerProfile}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </ProfessionalDashboardShell>
    );
  }

  if (loadError && !thread) {
    return (
      <ProfessionalDashboardShell profile={viewerProfile}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-base font-semibold text-destructive">{loadError}</p>
          <Link
            href="/dashboard/patients"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            <ArrowLeft className="size-4" />
            Back to My patients
          </Link>
        </div>
      </ProfessionalDashboardShell>
    );
  }

  const messages = thread?.messages ?? [];
  const patientName = thread?.patientName?.trim() || "Patient";

  return (
    <ProfessionalDashboardShell profile={viewerProfile}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href={`/dashboard/patients/${patientId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to {patientName}&rsquo;s profile
          </Link>
          <p className="text-sm text-muted-foreground">
            Home / My patients /{" "}
            <Link
              href={`/dashboard/patients/${patientId}`}
              className="hover:underline"
            >
              {patientName}
            </Link>{" "}
            / <span className="font-semibold text-foreground">Messages</span>
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[1.45rem] border border-primary/15 bg-white shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]">
          <ChatHeader
            patientName={patientName}
            doctorName={doctorName}
            isRefreshing={isRefreshing}
            onRefresh={() => void refresh("background")}
          />

          <MessageList
            messages={messages}
            doctorName={doctorName}
            patientName={patientName}
          />

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
            chatWindowEndsAt={thread?.chatWindowEndsAt ?? null}
            patientName={patientName}
          />
        </div>
      </div>
    </ProfessionalDashboardShell>
  );
}

function ChatHeader({
  patientName,
  doctorName,
  isRefreshing,
  onRefresh,
}: {
  patientName: string;
  doctorName: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleUserRound className="size-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {patientName}
          </p>
          <p className="text-xs text-muted-foreground">
            Direct messages with {doctorName}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/15 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        <RefreshCcw
          className={cn("size-3.5", isRefreshing && "animate-spin")}
        />
        Refresh
      </button>
    </div>
  );
}

function MessageList({
  messages,
  doctorName,
  patientName,
}: {
  messages: ApiPatientMessage[];
  doctorName: string;
  patientName: string;
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
        <p className="text-base font-medium text-foreground">
          No messages yet
        </p>
        <p className="max-w-md text-sm">
          Start the conversation with {patientName} below.
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
        <Bubble
          key={m.id}
          message={m}
          doctorName={doctorName}
          patientName={patientName}
        />
      ))}
    </div>
  );
}

function Bubble({
  message,
  doctorName,
  patientName,
}: {
  message: ApiPatientMessage;
  doctorName: string;
  patientName: string;
}) {
  const isDoctor = message.sender === "doctor";
  const senderLabel = isDoctor ? doctorName : patientName;
  const dateLabel = formatTimestamp(message.createdAt);

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isDoctor ? "items-end" : "items-start",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {senderLabel} · {dateLabel}
      </div>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6",
          isDoctor
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
  chatWindowEndsAt,
  patientName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  error: string | null;
  /** Phase 4 — see frontend mirror in patient-doctor-messages.tsx. */
  chatWindowEndsAt: string | null;
  patientName: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!chatWindowEndsAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [chatWindowEndsAt]);

  const trimmed = value.trim();
  const windowEndsAt = chatWindowEndsAt
    ? new Date(chatWindowEndsAt).getTime()
    : null;
  const isLocked =
    windowEndsAt === null || Number.isNaN(windowEndsAt) || windowEndsAt <= Date.now();
  const canSend = !isLocked && trimmed.length > 0 && !isSending;

  if (isLocked) {
    return (
      <div className="space-y-2 border-t border-primary/10 bg-muted/40 px-4 py-4 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">
              No active consultation with {patientName}.
            </p>
            <p className="text-xs text-muted-foreground">
              Your last consultation window has closed. {patientName} needs
              to book a follow-up consultation before either of you can
              continue messaging.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <ChatWindowHint windowEndsAt={windowEndsAt} />
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

/** Tiny "Chat closes in Xh Ym" badge — shows when <6h left. */
function ChatWindowHint({ windowEndsAt }: { windowEndsAt: number | null }) {
  if (windowEndsAt === null) return null;
  const remainingMs = windowEndsAt - Date.now();
  if (remainingMs <= 0 || remainingMs > 6 * 60 * 60 * 1000) return null;
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(minutes, 1)}m`;
  return (
    <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
      <Lock className="size-3" />
      Chat closes in {label}
    </p>
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
