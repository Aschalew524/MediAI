"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  Sparkles,
  X,
} from "lucide-react";

import {
  getAssistantPrompt,
  type ChatMode,
} from "@/lib/chat-content";
import type { ChatCitation } from "@/lib/services/app-content";
import { AssistantPaywallPanel } from "./assistant-paywall-panel";
import { PersonalAccessSheet } from "./personal-access-sheet";
import { ChatCitations } from "./chat-citations";
import {
  canSendPersonalChat,
  getAssistantBillingErrorCode,
  getMyBilling,
  type MyBillingResponse,
} from "@/lib/payments-api";
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
  citations?: ChatCitation[];
};

export function ChatOptionsPage() {
  const router = useRouter();
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const name = getProfileName(profile);
  const isProfessional = Boolean(profile.professionalProfile);
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [accessSheetOpen, setAccessSheetOpen] = useState(false);

  useEffect(() => {
    if (isProfessional) return;
    let cancelled = false;
    void getMyBilling()
      .then((b) => {
        if (!cancelled) setBilling(b);
      })
      .catch(() => {
        if (!cancelled) setBilling(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isProfessional]);

  if (isProfessional) {
    return <ProfessionalChatOptionsPage />;
  }

  const personalBadge =
    billing?.assistantAccess.active
      ? "Active"
      : billing && billing.personalTrial.remaining > 0
        ? billing.personalTrial.remaining === billing.personalTrial.limit
          ? `${billing.personalTrial.limit} free chats`
          : `${billing.personalTrial.remaining} left`
        : billing
          ? "Premium"
          : null;

  return (
    <DashboardPage>
      <DashboardContainer>
        <PersonalAccessSheet
          open={accessSheetOpen}
          onClose={() => setAccessSheetOpen(false)}
          billing={billing}
          onStartTrial={() => router.push("/dashboard/ai-doctor/personal")}
          onAccessActive={() => void getMyBilling().then(setBilling)}
        />
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
              {config.doctorTypeOptions.map((option) => {
                const cardClass =
                  "relative w-full rounded-[1.5rem] bg-primary px-7 py-6 text-left text-primary-foreground transition-transform hover:-translate-y-px";
                if (option.id === "general") {
                  return (
                    <Link key={option.id} href="/dashboard/ai-doctor/general" className={cardClass}>
                      <h2 className="text-2xl font-semibold">{option.shortLabel}</h2>
                      <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
                        No memory. Provides general health advice
                      </p>
                    </Link>
                  );
                }
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (billing?.personalChatAllowed) {
                        router.push("/dashboard/ai-doctor/personal");
                      } else {
                        setAccessSheetOpen(true);
                      }
                    }}
                    className={cardClass}
                  >
                    {personalBadge ? (
                      <span className="absolute right-4 top-4 rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                        {personalBadge}
                      </span>
                    ) : null}
                    <h2 className="text-2xl font-semibold">{option.shortLabel}</h2>
                    <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
                      {billing?.personalTrial.remaining
                        ? "Try personalized answers using your health profile."
                        : billing?.personalChatReadOnly
                          ? "Unlock unlimited access — free trial used."
                          : "Uses your health data for tailored insights."}
                    </p>
                  </button>
                );
              })}
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
  const isPersonalPatient = mode === "personal" && !isProfessional;
  const [billing, setBilling] = useState<MyBillingResponse | null>(
    isPersonalPatient ? null : null,
  );
  const [accessSheetOpen, setAccessSheetOpen] = useState(false);

  const checkingAccess = isPersonalPatient && billing === null;
  const canSend =
    !isPersonalPatient || (billing !== null && canSendPersonalChat(billing));
  const showComposerLock =
    isPersonalPatient && billing !== null && billing.personalChatReadOnly;
  const showFullPaywall =
    isPersonalPatient &&
    billing !== null &&
    !billing.personalChatAllowed &&
    !billing.personalChatReadOnly;

  const shouldHydrate =
    isPersonalPatient &&
    billing !== null &&
    (billing.personalChatAllowed || billing.personalChatReadOnly) &&
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

  // Billing snapshot drives the proactive trial UI ("X of 3 free chats
  // left" badge and the post-trial upgrade panel). Only fetched for
  // patient-side personal chat — professional clinical assistant flows
  // are not billed, and general chat is intentionally free.
  const shouldTrackTrial = mode === "personal" && !isProfessional;
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState<boolean>(shouldTrackTrial);
  const [billingErrored, setBillingErrored] = useState(false);

  const refreshBilling = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    if (!shouldTrackTrial) {
      refreshBilling.current = async () => {};
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getMyBilling();
        if (cancelled) return;
        setBilling(data);
        setBillingErrored(false);
      } catch {
        if (cancelled) return;
        // A billing-fetch failure shouldn't block the chat — degrade to
        // the legacy "reactive 403 banner" flow. We just don't show the
        // proactive counter / upgrade panel in that case.
        setBillingErrored(true);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    };
    refreshBilling.current = load;
    void load();
    return () => {
      cancelled = true;
    };
  }, [shouldTrackTrial]);

  // Carry the backend ids across turns so the LLM keeps multi-turn memory.
  // `conversationId` is set by `/chat/personal/messages` on the first reply
  // (or hydrated below from the URL / "last chat" flow); `sessionId` is
  // generated client-side for `/chat/general/messages`.
  const conversationIdRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const refreshBilling = useCallback(async () => {
    if (!isPersonalPatient) return;
    const b = await getMyBilling();
    setBilling(b);
  }, [isPersonalPatient]);

  useEffect(() => {
    if (!isPersonalPatient) return;
    let cancelled = false;
    void getMyBilling()
      .then((b) => {
        if (!cancelled) setBilling(b);
      })
      .catch(() => {
        if (!cancelled) setBilling(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isPersonalPatient]);

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
              ...(m.citations?.length ? { citations: m.citations } : {}),
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
    if (checkingAccess || !canSend) {
      if (showComposerLock) setAccessSheetOpen(true);
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
          citations: response.citations,
        },
      ]);
      // Decrement the trial counter via a fresh billing fetch — cheap,
      // and avoids drift if the user has another tab open.
      if (shouldTrackTrial) {
        void refreshBilling.current();
      }
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      const trialError = getAssistantBillingErrorCode(err);
      const fallbackAuthor = mode === "personal" ? "AI Doctor" : "General Chat";
      if (mode === "personal" && code === 403) {
        setAssistantAccessRequired(true);
        if (shouldTrackTrial) {
          void refreshBilling.current();
        }
      }
      const content =
        code === 401
          ? "Please sign in again to continue this conversation."
          : code === 403 && mode === "personal" && trialError === "assistant_trial_exhausted"
            ? "You've used your 3 free personalized chats. Unlock a pass to continue."
          : code === 403 && mode === "personal"
            ? "Personalized AI Doctor requires an active assistant pass."
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

  // Decide what — if anything — to show around the composer based on the
  // user's current entitlements. Three relevant states:
  //
  //  1. Paid plan active: show no trial UI at all — they paid, get out of
  //     the way.
  //  2. On the free trial with credits remaining: show a small
  //     "Free trial: X of N personalized chats left · See plans" badge.
  //  3. No credits left and no paid plan: swap the composer out for a
  //     full upgrade panel. This covers both the read-only-history case
  //     and the env-disabled trial case (`ASSISTANT_TRIAL_ENABLED=false`).
  const trial = billing?.personalTrial;
  const isOnPaidPlan = billing?.personalChatPaidActive === true;
  const trialExhaustedBlocked =
    shouldTrackTrial &&
    !billingErrored &&
    Boolean(billing) &&
    billing!.personalChatAllowed === false;
  const showTrialBadge =
    shouldTrackTrial &&
    !billingErrored &&
    !billingLoading &&
    !isOnPaidPlan &&
    Boolean(trial?.enabled) &&
    (trial?.remaining ?? 0) > 0;
  const trialBadge = showTrialBadge ? (
    <TrialCounterBadge
      used={trial!.used}
      limit={trial!.limit}
      remaining={trial!.remaining}
    />
  ) : null;

  return (
    <>
      {isPersonalPatient ? (
        <PersonalAccessSheet
          open={accessSheetOpen}
          onClose={() => setAccessSheetOpen(false)}
          billing={billing}
          onStartTrial={() => setAccessSheetOpen(false)}
          onAccessActive={() => void refreshBilling()}
        />
      ) : null}
      <DashboardPage>
        <DashboardContainer>
          {assistantAccessRequired && !trialExhaustedBlocked ? (
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
          <ChatDisclaimer mode={mode} ragEnabled={config.ragEnabled} />
          {showTrialChip ? (
            <DashboardPanel className="mb-4 flex flex-col gap-2 border-primary/15 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-foreground">
                Free trial · {trialRemaining} of {trialLimit} chats left
                {trialRemaining === 1 ? " (last free chat)" : ""}
              </p>
              <button
                type="button"
                onClick={() => setAccessSheetOpen(true)}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Upgrade
              </button>
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
            ) : messages.length === 0 && !showFullPaywall && !checkingAccess ? (
              <EmptyChatState mode={mode} />
            ) : messages.length > 0 ? (
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
                      {message.citations?.length ? (
                        <ChatCitations citations={message.citations} />
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : null}

            {trialExhaustedBlocked ? (
              <TrialExhaustedPanel
                limit={billing?.personalTrial.limit ?? 3}
                readOnly={billing?.personalChatReadOnly ?? true}
              />
            ) : (
              <>
                {trialBadge ? (
                  <div className="flex justify-end">{trialBadge}</div>
                ) : null}
                <ChatComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={submitMessage}
                  sending={sending}
                />
              </>
            )}
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

function ChatDisclaimer({
  mode,
  ragEnabled,
}: {
  mode: ChatMode;
  ragEnabled?: boolean;
}) {
  return (
    <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
      Educational information only — not medical advice, diagnosis, or treatment. For emergencies,
      go to a hospital or emergency unit.{" "}
      {mode === "general"
        ? "General chat does not use your saved health profile."
        : "Personalized chat uses information you entered in the app; it may be incomplete."}
      {ragEnabled ? " Guideline sources may appear under replies when available." : null}
    </p>
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

function TrialCounterBadge({
  used,
  limit,
  remaining,
}: {
  used: number;
  limit: number;
  remaining: number;
}) {
  // Soft amber tone on the last credit so users get a heads-up before
  // they're cut off; muted indigo for the earlier turns so it reads as
  // informational, not alarming.
  const isLast = remaining === 1;
  return (
    <Link
      href="/pricing"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        isLast
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
      )}
      aria-label={`Free trial: ${used} of ${limit} personalized chats used, ${remaining} left. View plans to upgrade.`}
    >
      <Sparkles className="size-3.5" aria-hidden />
      <span>
        Free trial:{" "}
        <strong className="font-semibold">
          {remaining} of {limit}
        </strong>{" "}
        {remaining === 1 ? "chat" : "chats"} left
      </span>
      <span className="text-foreground/40">·</span>
      <span className="underline-offset-2 hover:underline">See plans</span>
    </Link>
  );
}

function TrialExhaustedPanel({
  limit,
  readOnly,
}: {
  limit: number;
  /** True for the normal post-trial state (history visible, sends blocked).
   * False when the trial itself is disabled — show a slightly different
   * heading so the copy reads correctly. */
  readOnly: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-primary/20 bg-linear-to-br from-primary/5 via-white to-primary/5 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {readOnly
                ? `You've used all ${limit} free personalized chats`
                : "Personalized chat is a paid feature"}
            </h3>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Upgrade to <strong className="text-foreground">Lite</strong> or{" "}
              <strong className="text-foreground">Pro</strong> to keep chatting
              with your AI Doctor — it remembers your conditions, medications,
              and prior conversations.
              {readOnly ? " Your existing conversations stay visible either way." : ""}
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 hover:shadow"
        >
          View plans
        </Link>
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
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [accessSheetOpen, setAccessSheetOpen] = useState(false);
  const [assistantAccessRequired, setAssistantAccessRequired] = useState(false);
  const readOnly =
    billing !== null &&
    billing.personalChatReadOnly &&
    !billing.assistantAccess.active;

  useEffect(() => {
    if (isProfessional) return;
    let cancelled = false;

    async function load() {
      let billingSnapshot: MyBillingResponse | null = null;
      try {
        billingSnapshot = await getMyBilling();
        if (cancelled) return;
        setBilling(billingSnapshot);
        const canRead =
          billingSnapshot.personalChatAllowed || billingSnapshot.personalChatReadOnly;
        if (!canRead) {
          setAssistantAccessRequired(true);
          setItems([]);
          setIsLoading(false);
          return;
        }
      } catch {
        if (cancelled) return;
      }

      try {
        const res = await listPersonalConversations({ pageSize: 50 });
        if (cancelled) return;
        setItems(res.items);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        setAssistantAccessRequired(code === 403);
        setError(
          code === 401
            ? "Please sign in again to view your chat history."
            : code === 403
              ? "An active assistant pass or free trial is required to view personalized chat history."
              : "Could not load your chat history. Try again.",
        );
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isProfessional]);

  if (isProfessional) {
    return <ProfessionalChatHistoryPage />;
  }

  return (
    <DashboardPage>
      <PersonalAccessSheet
        open={accessSheetOpen}
        onClose={() => setAccessSheetOpen(false)}
        billing={billing}
        onStartTrial={() => setAccessSheetOpen(false)}
        onAccessActive={() => void getMyBilling().then(setBilling)}
      />
      <DashboardContainer className="space-y-8">
        {readOnly ? (
          <DashboardPanel className="border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">
                Free trial used — you can read past chats but need a pass to send new messages.
              </p>
              <button
                type="button"
                onClick={() => setAccessSheetOpen(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Unlock to continue
              </button>
            </div>
          </DashboardPanel>
        ) : null}
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
        ) : assistantAccessRequired && items.length === 0 ? (
          <AssistantPaywallPanel variant="full" />
        ) : error && items.length === 0 ? (
          <DashboardPanel className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
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
