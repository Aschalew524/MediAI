"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { isAxiosError } from "axios";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Circle,
  Paperclip,
  Plus,
  SendHorizonal,
  Square,
  X,
} from "lucide-react";

import { getAssistantPrompt, type ChatMode } from "@/lib/chat-content";
import { getProfileName } from "@/lib/dashboard-content";
import { CHAT_LIST_PAGE_SIZE, CHAT_MESSAGE_PAGE_SIZE, isChatStreamEnabled } from "@/lib/chat-constants";
import {
  getChatErrorMessage,
  getPersonalMessages,
  isChatAuthError,
  isChatRateLimited,
  listPersonalConversations,
  type ChatApiCitation,
  type ConversationListItem,
  type PersonalMessageItem,
  postGeneralMessage,
  postPersonalMessage,
  streamGeneralMessage,
  streamPersonalMessage,
} from "@/lib/chat-api";
import { useChatConfig } from "@/lib/hooks/use-app-config";
import { submitIssueReport } from "@/lib/services/app-content";
import { cn } from "@/lib/utils";

import { DashboardActionButton, DashboardContainer, DashboardPage, DashboardPanel } from "./primitives";
import {
  ProfessionalChatConversationPage,
  ProfessionalChatHistoryPage,
  ProfessionalChatOptionsPage,
} from "./professional-chat-pages";
import { useDashboardProfile } from "./use-dashboard-profile";

const GENERAL_SESSION_KEY = "mediai:generalChatSessionId";

/** Placeholder id for the assistant message while SSE tokens are arriving */
const STREAMING_PLACEHOLDER_ID = "__medi_ai_streaming__";

function isOnboardingRequiredError(e: unknown): boolean {
  if (!isAxiosError(e)) {
    return false;
  }
  if (e.response?.status !== 404) {
    return false;
  }
  const msgRaw = e.response?.data as { message?: string | string[] } | undefined;
  const m = msgRaw?.message;
  const text = Array.isArray(m) ? m.join(" ") : typeof m === "string" ? m : "";
  return text.toLowerCase().includes("onboarding");
}

function getOrCreateGeneralSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  let id = sessionStorage.getItem(GENERAL_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(GENERAL_SESSION_KEY, id);
  }
  return id;
}

function resetGeneralSessionId(): string {
  const id = crypto.randomUUID();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(GENERAL_SESSION_KEY, id);
  }
  return id;
}

type ConversationMessage = {
  role: "user" | "assistant";
  author: string;
  content: string;
  id?: string;
  citations?: ChatApiCitation[];
};

function formatThreadDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function mapStoredToMessage(
  m: PersonalMessageItem,
  userName: string,
  mode: ChatMode,
): ConversationMessage {
  if (m.role === "user") {
    return { role: "user", author: userName, content: m.content, id: m.id };
  }
  if (m.role === "system") {
    return { role: "assistant", author: "System", content: m.content, id: m.id };
  }
  return {
    role: "assistant",
    author: mode === "personal" ? "AI Doctor" : "General Chat",
    content: m.content,
    id: m.id,
  };
}

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
  initialSeededConversation = false,
  prefetchLatestPersonalConversation = false,
}: {
  mode: ChatMode;
  initialSeededConversation?: boolean;
  /** Load the most recent personal thread from the API (e.g. "Last chat"). */
  prefetchLatestPersonalConversation?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const name = getProfileName(profile);
  const isProfessional = Boolean(profile.professionalProfile);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueDraft, setIssueDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(
    () => mode === "personal" && (Boolean(searchParams.get("conversationId")) || prefetchLatestPersonalConversation),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [threadHasMore, setThreadHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const generalSessionIdRef = useRef<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingPrependScrollRef = useRef<{
    oldScrollHeight: number;
    oldScrollTop: number;
  } | null>(null);

  useEffect(() => {
    if (mode !== "general") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (!generalSessionIdRef.current) {
      generalSessionIdRef.current = getOrCreateGeneralSessionId();
    }
  }, [mode]);

  if (isProfessional) {
    return (
      <ProfessionalChatConversationPage
        mode={mode}
        initialSeededConversation={initialSeededConversation}
      />
    );
  }

  // Personal: open specific thread from ?conversationId=
  useEffect(() => {
    if (mode !== "personal" || prefetchLatestPersonalConversation) {
      return;
    }
    const c = searchParams.get("conversationId");
    setConversationId(c);
  }, [mode, prefetchLatestPersonalConversation, searchParams]);

  // Personal: "Last chat" — latest thread or seeded fallback
  useEffect(() => {
    if (mode !== "personal" || !prefetchLatestPersonalConversation) {
      return;
    }
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setLoadError(null);
      try {
        const { items } = await listPersonalConversations(1, 1);
        if (cancelled) {
          return;
        }
        if (items[0]) {
          setConversationId(items[0].id);
        } else if (initialSeededConversation) {
          setMessages(
            config.seededPersonalConversation.map((m) =>
              m.role === "user" ? { ...m, author: name } : { ...m },
            ),
          );
          setHistoryLoading(false);
        } else {
          setHistoryLoading(false);
        }
      } catch (e) {
        if (cancelled) {
          return;
        }
        if (initialSeededConversation) {
          setMessages(
            config.seededPersonalConversation.map((m) =>
              m.role === "user" ? { ...m, author: name } : { ...m },
            ),
          );
        } else {
          setLoadError(
            isChatAuthError(e)
              ? "Please sign in to view your recent chats."
              : (getChatErrorMessage(e) ?? "Could not load your last chat."),
          );
        }
        setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.seededPersonalConversation, initialSeededConversation, mode, name, prefetchLatestPersonalConversation]);

  // Personal: load most recent page of message history for the active conversation
  useEffect(() => {
    if (mode !== "personal" || !conversationId) {
      if (mode === "general") {
        setHistoryLoading(false);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setLoadError(null);
      setThreadHasMore(false);
      try {
        const { items, hasMore } = await getPersonalMessages(conversationId, {
          limit: CHAT_MESSAGE_PAGE_SIZE,
        });
        if (cancelled) {
          return;
        }
        setMessages(items.map((m) => mapStoredToMessage(m, name, mode)));
        setThreadHasMore(hasMore);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            isChatAuthError(e)
              ? "Please sign in again to use AI Doctor."
              : (getChatErrorMessage(e) ?? "Failed to load messages for this thread."),
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, mode, name]);

  useLayoutEffect(() => {
    const p = pendingPrependScrollRef.current;
    const el = threadScrollRef.current;
    if (!p || !el) {
      return;
    }
    const delta = el.scrollHeight - p.oldScrollHeight;
    el.scrollTop = p.oldScrollTop + delta;
    pendingPrependScrollRef.current = null;
  }, [messages]);

  const startNewPersonalChat = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
    setMessages([]);
    setConversationId(null);
    setLoadError(null);
    setOnboardingRequired(false);
    setThreadHasMore(false);
    router.replace(pathname.split("?")[0] || pathname);
  }, [pathname, router]);

  const loadEarlierMessages = useCallback(async () => {
    if (mode !== "personal" || !conversationId || !threadHasMore || loadingOlder || historyLoading) {
      return;
    }
    const oldest = messages[0]?.id;
    if (!oldest) {
      return;
    }
    const el = threadScrollRef.current;
    if (el) {
      pendingPrependScrollRef.current = {
        oldScrollHeight: el.scrollHeight,
        oldScrollTop: el.scrollTop,
      };
    }
    setLoadingOlder(true);
    try {
      const { items, hasMore } = await getPersonalMessages(conversationId, {
        limit: CHAT_MESSAGE_PAGE_SIZE,
        before: oldest,
      });
      setThreadHasMore(hasMore);
      setMessages((cur) => [...items.map((m) => mapStoredToMessage(m, name, mode)), ...cur]);
    } catch (e) {
      setLoadError(
        isChatAuthError(e)
          ? "Please sign in again to use AI Doctor."
          : (getChatErrorMessage(e) ?? "Could not load earlier messages."),
      );
    } finally {
      setLoadingOlder(false);
    }
  }, [
    conversationId,
    historyLoading,
    loadingOlder,
    mode,
    name,
    messages,
    threadHasMore,
  ]);

  const startNewGeneralChat = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
    if (typeof window !== "undefined") {
      generalSessionIdRef.current = resetGeneralSessionId();
    }
    setMessages([]);
    setLoadError(null);
    setOnboardingRequired(false);
  }, []);

  const assistantName = mode === "personal" ? "AI Doctor" : "General Chat";

  function stopStreaming() {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
  }

  async function sendPersonalJsonTrimmed(trimmed: string): Promise<void> {
    const response = await postPersonalMessage({
      message: trimmed,
      conversationId: conversationId ?? undefined,
    });
    setConversationId(response.conversationId);
    if (!searchParams.get("conversationId")) {
      router.replace(`${pathname}?conversationId=${response.conversationId}`);
    }
    setMessages((current) => [
      ...current,
      {
        role: "assistant" as const,
        author: assistantName,
        content: response.reply,
        citations: response.citations,
        id: response.messageId,
      },
    ]);
  }

  async function sendGeneralJsonTrimmed(trimmed: string): Promise<void> {
    if (typeof window !== "undefined" && !generalSessionIdRef.current) {
      generalSessionIdRef.current = getOrCreateGeneralSessionId();
    }
    const response = await postGeneralMessage({
      message: trimmed,
      sessionId: generalSessionIdRef.current ?? undefined,
    });
    setMessages((current) => [
      ...current,
      {
        role: "assistant" as const,
        author: assistantName,
        content: response.reply,
        citations: response.citations,
        id: response.messageId,
      },
    ]);
  }

  async function submitMessage() {
    const trimmed = draft.trim();
    if (!trimmed || sending || isStreaming) {
      return;
    }
    if (mode === "personal" && historyLoading) {
      return;
    }

    const userMessage: ConversationMessage = {
      role: "user",
      author: name,
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);

    const useStream = isChatStreamEnabled();

    const jsonFallbackError = (e: unknown) => {
      const isAuth = isChatAuthError(e);
      const isLimit = isChatRateLimited(e);
      const onboarding = mode === "personal" && isOnboardingRequiredError(e);
      if (onboarding) {
        setOnboardingRequired(true);
        return "Complete onboarding to use Personal AI Doctor.";
      }
      return isAuth
        ? "Your session has expired. Please sign in again to use AI Doctor."
        : isLimit
          ? "You have sent too many messages. Please wait a bit or sign in, then try again."
          : (getChatErrorMessage(e) === "Unauthorized" && mode === "general"
              ? "This chat session is not authorized right now. Please refresh and try again."
              : (getChatErrorMessage(e) ?? "I couldn't load a response right now. Please try again."));
    };

    if (useStream) {
      const ac = new AbortController();
      streamAbortRef.current = ac;
      setIsStreaming(true);
      setMessages((c) => [
        ...c,
        {
          role: "assistant",
          author: assistantName,
          content: "",
          id: STREAMING_PLACEHOLDER_ID,
        },
      ]);

      const appendStreamToken = (t: string) => {
        setMessages((c) => {
          const i = c.findIndex((m) => m.id === STREAMING_PLACEHOLDER_ID);
          if (i === -1) {
            return c;
          }
          const n = [...c];
          n[i] = { ...n[i]!, content: n[i]!.content + t };
          return n;
        });
      };

      const runJsonFallback = async () => {
        setMessages((c) => c.filter((m) => m.id !== STREAMING_PLACEHOLDER_ID));
        if (mode === "personal") {
          try {
            await sendPersonalJsonTrimmed(trimmed);
          } catch (e) {
            setMessages((c) => [
              ...c,
              { role: "assistant", author: assistantName, content: jsonFallbackError(e) },
            ]);
          }
        } else {
          try {
            await sendGeneralJsonTrimmed(trimmed);
          } catch (e) {
            setMessages((c) => [
              ...c,
              { role: "assistant", author: assistantName, content: jsonFallbackError(e) },
            ]);
          }
        }
      };

      const afterStream = async (finished: { current: boolean }) => {
        if (ac.signal.aborted) {
          setMessages((c) =>
            c.map((m) =>
              m.id === STREAMING_PLACEHOLDER_ID
                ? { ...m, content: m.content || "Generation stopped." }
                : m,
            ),
          );
        } else if (!finished.current) {
          await runJsonFallback();
        }
      };

      if (mode === "personal") {
        const finished = { current: false };
        try {
          await streamPersonalMessage(
            { message: trimmed, conversationId: conversationId ?? undefined },
            {
              onToken: (tok) => appendStreamToken(tok),
              onDone: (p) => {
                finished.current = true;
                setConversationId(p.conversationId);
                if (!searchParams.get("conversationId")) {
                  router.replace(`${pathname}?conversationId=${p.conversationId}`);
                }
                setMessages((c) => {
                  const i = c.findIndex((m) => m.id === STREAMING_PLACEHOLDER_ID);
                  if (i === -1) {
                    return c;
                  }
                  const n = [...c];
                  const body = n[i]!.content;
                  n[i] = {
                    role: "assistant",
                    author: assistantName,
                    id: p.messageId,
                    content: body,
                    citations: p.citations,
                  };
                  return n;
                });
              },
              onInStreamError: (e) => {
                finished.current = true;
                setMessages((c) =>
                  c
                    .filter((m) => m.id !== STREAMING_PLACEHOLDER_ID)
                    .concat({
                      role: "assistant",
                      author: assistantName,
                      content: e.error.message,
                    }),
                );
              },
            },
            { signal: ac.signal },
          );
          await afterStream(finished);
        } catch {
          if (!ac.signal.aborted) {
            await runJsonFallback();
          }
        } finally {
          setIsStreaming(false);
          streamAbortRef.current = null;
          setSending(false);
        }
        return;
      }

      const genFinished = { current: false };
      if (typeof window !== "undefined" && !generalSessionIdRef.current) {
        generalSessionIdRef.current = getOrCreateGeneralSessionId();
      }
      const sid = generalSessionIdRef.current ?? undefined;
      try {
        await streamGeneralMessage(
          { message: trimmed, sessionId: sid },
          {
            onToken: (tok) => appendStreamToken(tok),
            onDone: (p) => {
              genFinished.current = true;
              setMessages((c) => {
                const i = c.findIndex((m) => m.id === STREAMING_PLACEHOLDER_ID);
                if (i === -1) {
                  return c;
                }
                const n = [...c];
                n[i] = {
                  role: "assistant",
                  author: assistantName,
                  id: p.messageId,
                  content: p.reply,
                  citations: p.citations,
                };
                return n;
              });
            },
            onInStreamError: (e) => {
              genFinished.current = true;
              setMessages((c) =>
                c
                  .filter((m) => m.id !== STREAMING_PLACEHOLDER_ID)
                  .concat({
                    role: "assistant",
                    author: assistantName,
                    content: e.error.message,
                  }),
              );
            },
          },
          { signal: ac.signal },
        );
        await afterStream(genFinished);
      } catch {
        if (!ac.signal.aborted) {
          await runJsonFallback();
        }
      } finally {
        setIsStreaming(false);
        streamAbortRef.current = null;
        setSending(false);
      }
      return;
    }

    try {
      if (mode === "personal") {
        await sendPersonalJsonTrimmed(trimmed);
      } else {
        await sendGeneralJsonTrimmed(trimmed);
      }
    } catch (e) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: assistantName,
          content: jsonFallbackError(e),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <DashboardPage>
        <DashboardContainer>
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
                <div className="flex flex-wrap items-center gap-3">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Square className="size-4" />
                      Stop
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={mode === "personal" ? startNewPersonalChat : startNewGeneralChat}
                    className="inline-flex h-12 min-w-52 items-center justify-center gap-3 rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-primary transition-colors hover:bg-muted"
                  >
                    <Plus className="size-4" />
                    New Chat
                  </button>
                </div>
              ) : null}
            </div>

            {loadError && !historyLoading && messages.length === 0 && mode === "personal" ? (
              onboardingRequired ? (
                <div role="alert">
                  <DashboardPanel className="mx-auto max-w-xl border-primary/20 px-6 py-6 text-center">
                    <p className="text-sm text-foreground">
                      Complete onboarding to use{" "}
                      <span className="font-medium">Personal AI Doctor</span>.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <DashboardActionButton
                        type="button"
                        className="h-10 rounded-lg px-6 text-sm"
                        onClick={() => router.push("/onboarding")}
                      >
                        Complete onboarding
                      </DashboardActionButton>
                    </div>
                  </DashboardPanel>
                </div>
              ) : (
                <p className="text-center text-sm text-destructive" role="alert">
                  {loadError}
                </p>
              )
            ) : null}
            {historyLoading && mode === "personal" ? (
              <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>
            ) : null}
            {config.ragEnabled === true ? (
              <p className="text-center text-xs font-medium text-primary" role="status">
                RAG: on — guideline search is enabled. Sources appear only when guideline documents are available and relevant.
              </p>
            ) : null}
            {messages.length === 0 && !historyLoading && !loadError ? (
              <EmptyChatState mode={mode} />
            ) : null}
            {messages.length > 0 && !historyLoading ? (
              <div
                ref={threadScrollRef}
                className={cn("space-y-5", mode === "personal" && "max-h-[min(70vh,520px)] overflow-y-auto pr-1")}
              >
                {mode === "personal" && threadHasMore ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => void loadEarlierMessages()}
                      disabled={loadingOlder}
                      className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {loadingOlder ? "Loading…" : "Load earlier messages"}
                    </button>
                  </div>
                ) : null}
                {messages.map((message, index) =>
                  message.role === "user" ? (
                    <DashboardPanel
                      key={message.id ?? `user-${index}`}
                      className="ml-auto max-w-4xl px-5 py-4"
                    >
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
                      key={message.id ?? `assistant-${index}`}
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
                      {message.citations && message.citations.length > 0 ? (
                        <div className="mt-4 space-y-2 border-t border-primary/10 pt-3 text-left">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Sources
                          </p>
                          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {message.citations.map((c) => (
                              <li key={`${c.source}-${c.excerpt.slice(0, 24)}`}>
                                <span className="font-medium text-foreground/80">{c.source}</span>
                                {c.excerpt ? <span> — {c.excerpt}</span> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : null}

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={submitMessage}
              sending={sending || isStreaming}
              disabled={sending || isStreaming || (mode === "personal" && historyLoading)}
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
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
  disabled?: boolean;
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
          disabled={sending || disabled}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending || disabled}
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
  currentMode,
  onSelect,
}: {
  doctorTypeOptions: { id: ChatMode; title: string; description: string }[];
  currentMode: ChatMode;
  onSelect: (mode: ChatMode) => void;
}) {
  return (
    <div className="absolute left-0 top-12 z-20 w-80 rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_24px_60px_-35px_rgba(73,96,188,0.7)]">
      <div className="space-y-3">
        {doctorTypeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground">{option.title}</p>
              <p className="text-sm leading-5 text-muted-foreground">
                {option.description}
              </p>
            </div>
            <span className="mt-1 text-primary">
              {currentMode === option.id ? "◉" : <Circle className="size-4" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadListPanel({ item }: { item: ConversationListItem }) {
  const preview = item.lastMessagePreview ?? "No messages yet";
  const href = `/dashboard/ai-doctor/personal?conversationId=${encodeURIComponent(item.id)}`;

  return (
    <Link href={href}>
      <DashboardPanel className="space-y-3 px-5 py-4 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-left text-xl font-medium line-clamp-2">{preview}</h2>
          <span className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-sm font-medium text-primary">
            Personal AI Doctor
          </span>
        </div>
        <div className="h-px bg-primary/10" />
        <p className="text-sm text-muted-foreground">
          <span>Updated: </span>
          <time dateTime={item.updatedAt} className="text-foreground">
            {formatThreadDate(item.updatedAt)}
          </time>
        </p>
      </DashboardPanel>
    </Link>
  );
}

export function ChatHistoryPage() {
  const profile = useDashboardProfile();
  const isProfessional = Boolean(profile.professionalProfile);
  const [threads, setThreads] = useState<ConversationListItem[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listHasMore = threads.length < listTotal;

  useEffect(() => {
    if (isProfessional) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setListPage(1);
      try {
        const { items, total, page } = await listPersonalConversations(1, CHAT_LIST_PAGE_SIZE);
        if (!cancelled) {
          setThreads(items);
          setListTotal(total);
          setListPage(page);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            isChatAuthError(e)
              ? "Please sign in to see your saved conversations."
              : (getChatErrorMessage(e) ?? "Could not load chat history."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isProfessional]);

  async function loadMoreThreads() {
    if (loading || loadingMore || !listHasMore) {
      return;
    }
    setLoadingMore(true);
    setLoadError(null);
    const next = listPage + 1;
    try {
      const { items, page, total } = await listPersonalConversations(
        next,
        CHAT_LIST_PAGE_SIZE,
      );
      setThreads((t) => [...t, ...items]);
      setListPage(page);
      setListTotal(total);
    } catch (e) {
      setLoadError(
        isChatAuthError(e)
          ? "Please sign in to see your saved conversations."
          : (getChatErrorMessage(e) ?? "Could not load more conversations."),
      );
    } finally {
      setLoadingMore(false);
    }
  }

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
        </div>

        <p className="text-sm text-muted-foreground">
          Your saved <strong>personal</strong> AI Doctor threads. General chats are not listed here; open
          a new session from{" "}
          <Link href="/dashboard/ai-doctor/general" className="font-medium text-primary underline-offset-2 hover:underline">
            General Chat
          </Link>
          .
        </p>

        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your conversations…</p>
        ) : null}
        <div className="space-y-4">
          {!loading && !loadError && threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">You don&apos;t have any saved personal chats yet.</p>
          ) : null}
          {threads.map((item) => (
            <ThreadListPanel key={item.id} item={item} />
          ))}
        </div>
        {listHasMore && !loading && !loadError && threads.length > 0 ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadMoreThreads()}
              disabled={loadingMore}
              className="rounded-xl border border-primary/25 bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more conversations"}
            </button>
          </div>
        ) : null}

        <Link
          href="/dashboard/ai-doctor"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-all hover:opacity-95"
        >
          Start New Chat
        </Link>
      </DashboardContainer>
    </DashboardPage>
  );
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
