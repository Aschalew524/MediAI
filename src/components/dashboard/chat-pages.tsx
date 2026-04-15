"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Circle,
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
  sendMockChatMessage,
  submitMockIssueReport,
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
  initialSeededConversation = false,
}: {
  mode: ChatMode;
  initialSeededConversation?: boolean;
}) {
  const router = useRouter();
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const name = getProfileName(profile);
  const isProfessional = Boolean(profile.professionalProfile);
  const [messages, setMessages] = useState<ConversationMessage[]>(
    initialSeededConversation && mode === "personal"
      ? [...config.seededPersonalConversation]
      : [],
  );
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueDraft, setIssueDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  if (isProfessional) {
    return (
      <ProfessionalChatConversationPage
        mode={mode}
        initialSeededConversation={initialSeededConversation}
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

    try {
      const response = await sendMockChatMessage(mode, trimmed);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: response.author,
          content: response.reply,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: mode === "personal" ? "AI Doctor" : "General Chat",
          content:
            "I couldn't load a response from the mock API right now. Please try again.",
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
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="inline-flex h-12 min-w-52 items-center justify-center gap-3 rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-primary transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                  New Chat
                </button>
              ) : null}
            </div>

            {messages.length === 0 ? (
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
              await submitMockIssueReport(issueDraft);
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

export function ChatHistoryPage() {
  const profile = useDashboardProfile();
  const { data: config } = useChatConfig();
  const [filter, setFilter] = useState<"all" | ChatMode>("all");
  const isProfessional = Boolean(profile.professionalProfile);
  const items = useMemo(
    () =>
      config.chatHistoryItems.filter((item) =>
        filter === "all" ? true : item.type === filter,
      ),
    [config.chatHistoryItems, filter],
  );

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

        <div className="max-w-xs">
          <div className="relative">
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | ChatMode)
              }
              className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-base outline-none focus:border-primary"
            >
              <option value="all">AI Doctor Type</option>
              <option value="personal">Personal AI Doctor</option>
              <option value="general">General Chat</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <DashboardPanel key={`${item.title}-${index}`} className="space-y-4 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-medium">{item.title}</h2>
                <span className="rounded-full border border-primary/30 px-3 py-1 text-sm font-medium text-primary">
                  {item.type === "personal" ? "Personal AI Doctor" : "General Chat"}
                </span>
              </div>
              <div className="h-px bg-primary/10" />
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  Created at: <strong className="text-foreground">{item.createdAt}</strong>
                </span>
                <span>
                  Last Message Date:{" "}
                  <strong className="text-foreground">{item.lastMessageAt}</strong>
                </span>
                <span>
                  Summary: <strong className="text-foreground">{item.summary}</strong>
                </span>
              </div>
            </DashboardPanel>
          ))}
        </div>

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
