"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ChevronDown,
  Circle,
  Loader2,
  MessageCircleMore,
  Paperclip,
  Plus,
  SendHorizonal,
  X,
} from "lucide-react";

import {
  getAssistantPrompt,
  type ChatMode,
} from "@/lib/chat-content";
import { getProfileName } from "@/lib/dashboard-content";
import { useChatConfig } from "@/lib/hooks/use-app-config";
import {
  getPersonalConversationMessages,
  listPersonalConversations,
  sendChatMessage,
  submitIssueReport,
  type ApiPersonalConversation,
} from "@/lib/services/app-content";
import { cn } from "@/lib/utils";

import { DashboardActionButton, DashboardContainer, DashboardPage, DashboardPanel } from "./primitives";
import {
  ProfessionalChatConversationPage,
  ProfessionalChatHistoryPage,
  ProfessionalChatOptionsPage,
} from "./professional-chat-pages";
import { useDashboardProfile } from "./use-dashboard-profile";

type ConversationMessage = {
  role: "user" | "assistant";
  author: string;
  content: string;
};

export function ChatOptionsPage() {
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const name = getProfileName(profile);
  const isProfessional = Boolean(profile.professionalProfile);

  if (isProfessional) {
    return <ProfessionalChatOptionsPage />;
  }

  return (
    <DashboardPage>
      <DashboardContainer>
        <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
          <div className="w-full max-w-4xl space-y-12 text-center">
            <div className="space-y-5">
              <div className="mx-auto">
                <DoctorOrb />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight">
                  {name}&rsquo;s AI Doctor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose Doctor type to start Conversation
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {config.doctorTypeOptions.map((option) => (
                <Link
                  key={option.id}
                  href={
                    option.id === "personal"
                      ? "/dashboard/ai-doctor/personal"
                      : "/dashboard/ai-doctor/general"
                  }
                  className="rounded-[1.5rem] bg-primary px-7 py-6 text-left text-primary-foreground transition-transform hover:-translate-y-px"
                >
                  <h2 className="text-2xl font-semibold">{option.shortLabel}</h2>
                  <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
                    {option.id === "personal"
                      ? "Has memory. Uses your health data for tailored insights"
                      : "No memory. Provides general health advice"}
                  </p>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard/ai-doctor/history"
                className="inline-flex h-12 min-w-40 items-center justify-center rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                Chat History
              </Link>
              <Link
                href="/dashboard/ai-doctor/last-chat"
                className="inline-flex h-12 min-w-40 items-center justify-center rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                Last Chat
              </Link>
            </div>
          </div>
        </section>
      </DashboardContainer>
    </DashboardPage>
  );
}

export function ChatConversationPage({
  mode,
  loadLastConversation = false,
}: {
  mode: ChatMode;
  /**
   * When true (used by `/dashboard/ai-doctor/last-chat`), hydrate the most
   * recent personal conversation from the backend instead of starting empty.
   * Specific conversations can also be opened with `?conversationId=…` —
   * that URL parameter overrides this flag when present.
   */
  loadLastConversation?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const name = getProfileName(profile);
  const isProfessional = Boolean(profile.professionalProfile);

  const requestedConversationId = searchParams.get("conversationId");
  const shouldHydrate =
    mode === "personal" &&
    !isProfessional &&
    (Boolean(requestedConversationId) || loadLastConversation);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [hydrating, setHydrating] = useState<boolean>(shouldHydrate);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [assistantAccessRequired, setAssistantAccessRequired] = useState(false);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueDraft, setIssueDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Carry the backend ids across turns so the LLM keeps multi-turn memory.
  // `conversationId` is set by `/chat/personal/messages` on the first reply
  // (or hydrated below from the URL / "last chat" flow); `sessionId` is
  // generated client-side for `/chat/general/messages`.
  const conversationIdRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);

  // Hydrate from the backend when the route asked for a specific or the most
  // recent personal conversation. Runs once per `(requestedConversationId,
  // loadLastConversation, mode, isProfessional)` combination.
  useEffect(() => {
    if (!shouldHydrate) {
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        let conversationId = requestedConversationId ?? undefined;
        if (!conversationId) {
          const list = await listPersonalConversations({ pageSize: 1 });
          conversationId = list.items[0]?.id;
        }
        if (!conversationId) {
          if (cancelled) return;
          setMessages([]);
          conversationIdRef.current = undefined;
          return;
        }
        const detail = await getPersonalConversationMessages(conversationId, {
          limit: 100,
        });
        if (cancelled) return;
        conversationIdRef.current = conversationId;
        setMessages(
          detail.items
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              author: m.role === "user" ? name : "AI Doctor",
              content: m.content,
            })),
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (mode === "personal" && code === 403) {
          setAssistantAccessRequired(true);
        }
        setHydrationError(
          code === 403 && mode === "personal"
            ? "An active assistant pass is required to open personalized chat history."
            : 
          code === 404
            ? "This conversation could not be found."
            : code === 401
              ? "Please sign in again to view this conversation."
              : "Could not load this conversation. Try again.",
        );
        setMessages([]);
        conversationIdRef.current = undefined;
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, shouldHydrate, requestedConversationId, name]);

  if (isProfessional) {
    return (
      <ProfessionalChatConversationPage
        mode={mode}
        initialSeededConversation={loadLastConversation}
      />
    );
  }

  async function submitMessage() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    const userMessage: ConversationMessage = {
      role: "user",
      author: name,
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");

    setSending(true);
    setAssistantAccessRequired(false);

    try {
      if (mode === "general" && !sessionIdRef.current) {
        sessionIdRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      const response = await sendChatMessage({
        mode,
        message: trimmed,
        conversationId: conversationIdRef.current,
        sessionId: sessionIdRef.current,
      });
      if (response.conversationId) {
        conversationIdRef.current = response.conversationId;
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: response.author,
          content: response.reply,
        },
      ]);
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      const fallbackAuthor = mode === "personal" ? "AI Doctor" : "General Chat";
      if (mode === "personal" && code === 403) {
        setAssistantAccessRequired(true);
      }
      const content =
        code === 401
          ? "Please sign in again to continue this conversation."
          : code === 403 && mode === "personal"
            ? "Personalized AI Doctor requires an active assistant pass. Open Billing to continue."
          : code === 404
            ? "Finish setting up your health profile to use the AI Doctor."
            : code === 429
              ? "You're sending messages too quickly — try again in a moment."
              : code === 503
                ? "The AI service is temporarily rate-limited. Please try again shortly."
                : code === 504
                  ? "The AI service took too long to respond. Please try again."
                  : "Sorry, I couldn't load a response right now. Please try again.";
      setMessages((current) => [
        ...current,
        { role: "assistant", author: fallbackAuthor, content },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <DashboardPage>
        <DashboardContainer>
          {assistantAccessRequired ? (
            <DashboardPanel className="mb-4 border-primary/20 bg-primary/5 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Personalized AI Doctor is locked until you subscribe to Lite or Pro.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    General chat is still free, but personalized conversations use your saved medical context.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View plans
                </Link>
              </div>
            </DashboardPanel>
          ) : null}
          <section
            className={cn(
              "space-y-8 py-8",
              messages.length === 0 && "flex min-h-[calc(100vh-12rem)] flex-col justify-center",
            )}
          >
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-3 text-4xl font-semibold tracking-tight"
                >
                  <span>{mode === "personal" ? `${name}'s AI Doctor` : "General Chat"}</span>
                  <ChevronDown className="size-5 text-muted-foreground" />
                </button>

                {menuOpen ? (
                  <DoctorTypeMenu
                    doctorTypeOptions={config.doctorTypeOptions}
                    personalTitle={`${name}'s AI Doctor`}
                    currentMode={mode}
                    onSelect={(nextMode) => {
                      setMenuOpen(false);
                      router.push(
                        nextMode === "personal"
                          ? "/dashboard/ai-doctor/personal"
                          : "/dashboard/ai-doctor/general",
                      );
                    }}
                  />
                ) : null}
              </div>

              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setHydrationError(null);
                    conversationIdRef.current = undefined;
                    sessionIdRef.current = undefined;
                    if (requestedConversationId || loadLastConversation) {
                      router.replace(
                        mode === "personal"
                          ? "/dashboard/ai-doctor/personal"
                          : "/dashboard/ai-doctor/general",
                      );
                    }
                  }}
                  className="inline-flex h-12 min-w-52 items-center justify-center gap-3 rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-primary transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                  New Chat
                </button>
              ) : null}
            </div>

            {hydrationError ? (
              <div
                role="alert"
                className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-3 text-sm text-destructive"
              >
                {hydrationError}
              </div>
            ) : null}

            {hydrating ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyChatState mode={mode} />
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) =>
                  message.role === "user" ? (
                    <DashboardPanel key={`${message.role}-${index}`} className="ml-auto max-w-4xl px-5 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <span>👤</span>
                          <span>{message.author}</span>
                        </div>
                        <p className="text-base">{message.content}</p>
                      </div>
                    </DashboardPanel>
                  ) : (
                    <div
                      key={`${message.role}-${index}`}
                      className="rounded-[1.25rem] border border-primary/15 bg-primary/5 px-5 py-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10">
                            ✦
                          </span>
                          <span>{message.author}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportOpen(true)}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Report Issue
                        </button>
                      </div>
                      <p className="mt-3 text-base leading-7 text-foreground/90">
                        {message.content}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={submitMessage}
              sending={sending}
            />
          </section>
        </DashboardContainer>
      </DashboardPage>

      {reportOpen ? (
        <ReportIssueModal
          issueDraft={issueDraft}
          onChange={setIssueDraft}
          onClose={() => setReportOpen(false)}
          submitting={submittingIssue}
          onSubmit={async () => {
            if (!issueDraft.trim() || submittingIssue) return;
            setSubmittingIssue(true);
            try {
              await submitIssueReport(issueDraft);
              setReportOpen(false);
              setIssueDraft("");
            } finally {
              setSubmittingIssue(false);
            }
          }}
        />
      ) : null}
    </>
  );
}

function EmptyChatState({ mode }: { mode: ChatMode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <DoctorOrb />
      <div className="space-y-2">
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          {getAssistantPrompt(mode)}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">How can I help you?</h2>
      </div>
    </div>
  );
}

function ChatComposer({
  value,
  onChange,
  onSend,
  sending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Paperclip className="size-4 text-primary" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Type Your Questions Here..."
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          disabled={sending}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="inline-flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8"
        >
          <SendHorizonal className="size-4" />
        </button>
      </div>
    </div>
  );
}

function DoctorTypeMenu({
  doctorTypeOptions,
  personalTitle,
  currentMode,
  onSelect,
}: {
  doctorTypeOptions: { id: ChatMode; title: string; description: string }[];
  /**
   * Override for the static `option.title` of the `personal` row so the menu
   * shows e.g. "Kiyar's AI Doctor" instead of the placeholder "Joe's AI
   * Doctor" baked into config.
   */
  personalTitle: string;
  currentMode: ChatMode;
  onSelect: (mode: ChatMode) => void;
}) {
  return (
    <div className="absolute left-0 top-12 z-20 w-80 rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_24px_60px_-35px_rgba(73,96,188,0.7)]">
      <div className="space-y-3">
        {doctorTypeOptions.map((option) => {
          const displayTitle =
            option.id === "personal" ? personalTitle : option.title;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">{displayTitle}</p>
                <p className="text-sm leading-5 text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <span className="mt-1 text-primary">
                {currentMode === option.id ? "◉" : <Circle className="size-4" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChatHistoryPage() {
  const profile = useDashboardProfile();
  const isProfessional = Boolean(profile.professionalProfile);

  const [items, setItems] = useState<ApiPersonalConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistantAccessRequired, setAssistantAccessRequired] = useState(false);

  useEffect(() => {
    if (isProfessional) return;
    let cancelled = false;
    listPersonalConversations({ pageSize: 50 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        setAssistantAccessRequired(code === 403);
        setError(
          code === 401
            ? "Please sign in again to view your chat history."
            : code === 403
              ? "An active assistant pass is required to view personalized chat history."
            : "Could not load your chat history. Try again.",
        );
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isProfessional]);

  if (isProfessional) {
    return <ProfessionalChatHistoryPage />;
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <div className="space-y-5">
          <Link
            href="/dashboard/ai-doctor"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <span className="text-lg">←</span>
            <span>My Dashboard</span>
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight">Chat History</h1>
          <p className="text-sm text-muted-foreground">
            Conversations with your AI Doctor (most recent first). Open one to
            continue the chat — the assistant remembers everything you’ve
            discussed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : error && items.length === 0 ? (
          <DashboardPanel className="px-5 py-8 text-center">
            <p
              className={cn(
                "text-sm font-semibold",
                assistantAccessRequired ? "text-foreground" : "text-destructive",
              )}
            >
              {error}
            </p>
            {assistantAccessRequired ? (
              <Link
                href="/pricing"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View plans
              </Link>
            ) : null}
          </DashboardPanel>
        ) : items.length === 0 ? (
          <DashboardPanel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircleMore className="size-7" />
            </div>
            <p className="text-base font-medium text-foreground">
              No conversations yet
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Start a new chat with your AI Doctor to see it here.
            </p>
          </DashboardPanel>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/ai-doctor/personal?conversationId=${encodeURIComponent(item.id)}`}
                className="block transition-transform hover:-translate-y-px"
              >
                <DashboardPanel className="space-y-4 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="line-clamp-1 text-xl font-medium">
                      {summariseConversationTitle(item)}
                    </h2>
                    <span className="rounded-full border border-primary/30 px-3 py-1 text-sm font-medium text-primary">
                      Personal AI Doctor
                    </span>
                  </div>
                  <div className="h-px bg-primary/10" />
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      Created at:{" "}
                      <strong className="text-foreground">
                        {formatHistoryTimestamp(item.createdAt)}
                      </strong>
                    </span>
                    <span>
                      Last Message Date:{" "}
                      <strong className="text-foreground">
                        {formatHistoryTimestamp(item.updatedAt)}
                      </strong>
                    </span>
                  </div>
                </DashboardPanel>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/dashboard/ai-doctor/personal"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-all hover:opacity-95"
        >
          Start New Chat
        </Link>
      </DashboardContainer>
    </DashboardPage>
  );
}

/** Best-effort title for a personal conversation row (no `title` column on
 * the backend yet). Uses the last-message preview if available, otherwise the
 * creation date. */
function summariseConversationTitle(item: ApiPersonalConversation): string {
  const preview = item.lastMessagePreview?.trim();
  if (preview) {
    const firstLine = preview.split(/\r?\n/)[0]?.trim() ?? "";
    if (firstLine.length > 0) {
      return firstLine.length > 80 ? `${firstLine.slice(0, 79)}…` : firstLine;
    }
  }
  return `Conversation from ${formatHistoryTimestamp(item.createdAt)}`;
}

function formatHistoryTimestamp(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReportIssueModal({
  issueDraft,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  issueDraft: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0_35px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Close report issue dialog"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-5xl font-semibold tracking-tight">
              Noticed an issue?
            </h2>
            <p className="text-2xl text-muted-foreground">
              Tell us what&rsquo;s wrong so we can improve MediAI.
            </p>
          </div>

          <textarea
            value={issueDraft}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Describe your issue here..."
            className="min-h-32 w-full rounded-2xl border border-primary/15 px-5 py-4 text-2xl outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            disabled={submitting}
          />

          <DashboardActionButton
            className="h-16 w-full text-3xl"
            onClick={onSubmit}
            disabled={submitting || issueDraft.trim().length === 0}
          >
            {submitting ? "Submitting..." : "Submit"}
          </DashboardActionButton>
        </div>
      </div>
    </div>
  );
}

function DoctorOrb() {
  return (
    <div className="relative flex size-36 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(113,133,255,0.95),rgba(44,52,96,1)_72%)] shadow-[0_28px_58px_-24px_rgba(57,78,171,0.85)]">
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div className="flex w-18 items-center justify-center gap-3 rounded-full bg-[#10173A] px-3 py-2 shadow-inner">
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
      </div>
      <div className="absolute bottom-7 h-5 w-10 rounded-full bg-[#10173A] shadow-inner">
        <div className="mx-auto mt-1 h-2 w-4 rounded-full bg-white/95" />
      </div>
    </div>
  );
}
