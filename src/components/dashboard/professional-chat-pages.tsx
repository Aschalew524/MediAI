"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ChevronDown,
  CirclePlus,
  ClipboardPlus,
  FileSearch,
  FileText,
  Loader2,
  Microscope,
  MoreHorizontal,
  Paperclip,
  Search,
  SendHorizonal,
  X,
} from "lucide-react";

import type { ChatMode } from "@/lib/chat-content";
import { getProfessionalName } from "@/lib/dashboard-content";
import {
  getPersonalConversationMessages,
  listPersonalConversations,
  sendChatMessage,
  type ApiPersonalConversation,
} from "@/lib/services/app-content";
import {
  listProfessionalPatients,
  type ApiPatientSummary,
} from "@/lib/services/professional-api";
import { cn } from "@/lib/utils";

import {
  formatProfessionalPatient,
  formatProfessionalPatientCompact,
  toProfessionalPatient,
  type ProfessionalPatient,
  ProfessionalDashboardShell,
} from "./professional-shell";
import { DashboardPanel } from "./primitives";
import { useDashboardProfile } from "./use-dashboard-profile";

type ProfessionalConversationMessage = {
  role: "user" | "assistant";
  author: string;
  content: string;
  timestamp: string;
};

function useProfessionalPatients(): {
  patients: ProfessionalPatient[];
  isLoading: boolean;
  error: string | null;
  findPatient: (id: string | null | undefined) => ProfessionalPatient | null;
  refresh: () => void;
} {
  const [items, setItems] = useState<ApiPatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listProfessionalPatients({ pageSize: 100 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        setError(
          code === 403
            ? "Only professional accounts can access patient data."
            : "Could not load your patients.",
        );
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const patients = useMemo(() => items.map(toProfessionalPatient), [items]);
  const findPatient = useCallback(
    (id: string | null | undefined) =>
      patients.find((p) => p.id === id) ?? null,
    [patients],
  );
  const refresh = useCallback(() => setReloadToken((v) => v + 1), []);

  return { patients, isLoading, error, findPatient, refresh };
}

const conversationPrompts = [
  {
    title: "Discuss Patient Case",
    description:
      "Ask about differential diagnoses, treatment plans, or clinical insights for this patient case.",
    icon: ClipboardPlus,
  },
  {
    title: "Check Medications",
    description:
      "Get medication suggestions, dosages, and safety info tailored to the patient's profile.",
    icon: CirclePlus,
  },
  {
    title: "Get Latest Knowledge",
    description:
      "Ask about the latest guidelines, research, and recommendations relevant to this case.",
    icon: Search,
  },
  {
    title: "Explore Clinical Trials",
    description:
      "Find ongoing clinical trials that may apply to the patient's condition.",
    icon: FileSearch,
  },
];

function proGeneralSessionKey(patientId: string) {
  return `mediai:pro:gen:${patientId}`;
}

/**
 * There is no backend "clinical chat with patient context" path yet. We call
 * {@link postGeneralMessage} (no user profile in the model). JWT is only sent
 * for rate limits. Multi-turn is keyed per patient in sessionStorage.
 */
function getOrCreateProGeneralSessionId(patientId: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  const k = proGeneralSessionKey(patientId);
  let s = sessionStorage.getItem(k);
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem(k, s);
  }
  return s;
}

function resetProGeneralSessionId(patientId: string) {
  if (typeof window === "undefined") {
    return;
  }
  const s = crypto.randomUUID();
  sessionStorage.setItem(proGeneralSessionKey(patientId), s);
}

const researchPlanItems = [
  {
    title: "Add and Manage up to 50 patients",
    icon: CirclePlus,
  },
  {
    title: "Access Research Assistant",
    icon: Microscope,
  },
  {
    title: "Unlimited use of decision supports",
    icon: FileText,
  },
];

export function ProfessionalChatOptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const {
    patients,
    isLoading: patientsLoading,
    error: patientsError,
    findPatient,
  } = useProfessionalPatients();

  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const selectedPatientId = searchParams.get("patient");
  const selectedPatient = findPatient(selectedPatientId);

  return (
    <>
      <ProfessionalDashboardShell profile={profile}>
        <section className="flex min-h-[calc(100vh-11rem)] flex-col justify-center">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
            <div className="space-y-5">
              <div className="mx-auto">
                <DoctorOrb />
              </div>
              <div className="space-y-2">
                <h1 className="text-[2.7rem] font-semibold tracking-tight text-foreground">
                  AI Clinical Assistant
                </h1>
                <p className="text-base text-muted-foreground">
                  Your Personal AI Assistant for clinical insights and decision
                  support.
                </p>
              </div>
            </div>

            <div className="w-full max-w-3xl space-y-6">
              <button
                type="button"
                onClick={() => setPatientPickerOpen(true)}
                disabled={patientsLoading}
                className="flex h-13 w-full items-center justify-between rounded-2xl border border-primary/15 bg-white px-4 text-left text-sm text-foreground shadow-[0_26px_60px_-52px_rgba(76,104,220,0.8)] transition-colors hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={cn(!selectedPatient && "text-muted-foreground")}>
                  {selectedPatient
                    ? formatProfessionalPatient(selectedPatient)
                    : patientsLoading
                      ? "Loading your patients…"
                      : "Select a patient to start a chat"}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

              {patientsError ? (
                <p
                  className="text-center text-xs text-destructive"
                  role="alert"
                >
                  {patientsError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={buildClinicalRoute(
                    "/dashboard/ai-doctor/history",
                    selectedPatient?.id,
                  )}
                  className="inline-flex h-12 min-w-52 items-center justify-center rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Conversation History
                </Link>
                <Link
                  href={buildClinicalRoute(
                    "/dashboard/ai-doctor/general",
                    selectedPatient?.id,
                  )}
                  className="inline-flex h-12 min-w-52 items-center justify-center rounded-xl border border-primary/25 bg-white px-6 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Research Assistant
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ProfessionalDashboardShell>

      {patientPickerOpen ? (
        <PatientSelectionModal
          patients={patients}
          isLoading={patientsLoading}
          error={patientsError}
          selectedPatientId={selectedPatient?.id ?? ""}
          onClose={() => setPatientPickerOpen(false)}
          onSelect={(patient) => {
            setPatientPickerOpen(false);
            router.push(
              buildClinicalRoute("/dashboard/ai-doctor/personal", patient.id),
            );
          }}
        />
      ) : null}
    </>
  );
}

export function ProfessionalChatConversationPage({
  mode,
  initialSeededConversation = false,
}: {
  mode: ChatMode;
  /**
   * Legacy "Last Chat" entry — when set, hydrate the most recent clinical
   * assistant conversation from the backend instead of starting empty.
   */
  initialSeededConversation?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const doctorName = getProfessionalName(profile);
  const {
    patients,
    isLoading: patientsLoading,
    error: patientsError,
    findPatient,
  } = useProfessionalPatients();

  const requestedPatientId = searchParams.get("patient");
  const requestedConversationId = searchParams.get("conversationId");
  const patient = findPatient(requestedPatientId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ProfessionalConversationMessage[]>(
    [],
  );
  const conversationIdRef = useRef<string | undefined>(undefined);

  // Hydrate the conversation: by URL `?conversationId=…`, or the most recent
  // one for `?patient=…` when `initialSeededConversation` is set ("Last Chat"),
  // or empty otherwise.
  const shouldHydrate =
    !!requestedConversationId ||
    (initialSeededConversation && !!requestedPatientId);
  const [hydrating, setHydrating] = useState<boolean>(shouldHydrate);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldHydrate) {
      setMessages([]);
      conversationIdRef.current = undefined;
      setHydrationError(null);
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    setHydrationError(null);

    async function load() {
      try {
        let conversationId = requestedConversationId ?? undefined;
        if (!conversationId && requestedPatientId) {
          const list = await listPersonalConversations({
            pageSize: 1,
            patientUserId: requestedPatientId,
          });
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
              author: m.role === "user" ? doctorName : "AI Doctor",
              content: m.content,
              timestamp: formatChatTimestamp(m.createdAt),
            })),
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        setHydrationError(
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
  }, [shouldHydrate, requestedConversationId, requestedPatientId, doctorName]);

  // Patient selector modal for switching/picking a patient inline.
  const [pickerOpen, setPickerOpen] = useState(false);

  if (mode === "general") {
    return (
      <ResearchAssistantUpgradePage
        patient={
          patient ?? { id: "", name: "this patient", age: "", sex: "" }
        }
      />
    );
  }

  // Without a real patient id we can't safely send a clinical-assistant
  // request: prompt the user to pick one.
  if (!requestedPatientId || (!patientsLoading && !patient)) {
    return (
      <ProfessionalDashboardShell profile={profile}>
        <section className="flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center gap-6 text-center">
          <div className="space-y-2">
            <h1 className="text-[2.4rem] font-semibold tracking-tight text-foreground">
              Pick a patient to begin
            </h1>
            <p className="text-base text-muted-foreground">
              The Clinical Assistant uses the selected patient&rsquo;s profile
              to ground every reply. Choose one of your patients from My patients
              to start a conversation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={patientsLoading}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {patientsLoading ? "Loading patients…" : "Select Patient"}
          </button>
          {patientsError ? (
            <p className="text-xs text-destructive" role="alert">
              {patientsError}
            </p>
          ) : null}
          {pickerOpen ? (
            <PatientSelectionModal
              patients={patients}
              isLoading={patientsLoading}
              error={patientsError}
              selectedPatientId=""
              onClose={() => setPickerOpen(false)}
              onSelect={(p) => {
                setPickerOpen(false);
                router.replace(
                  buildClinicalRoute("/dashboard/ai-doctor/personal", p.id),
                );
              }}
            />
          ) : null}
        </section>
      </ProfessionalDashboardShell>
    );
  }

  // From here on we have either a real patient or are still loading their row.
  const safePatient: ProfessionalPatient =
    patient ?? {
      id: requestedPatientId,
      name: "Loading…",
      age: "",
      sex: "",
    };

  async function submitMessage(nextDraft?: string) {
    const messageText = (nextDraft ?? draft).trim();
    if (!messageText || sending) return;
    if (!requestedPatientId) return;

    const timestamp = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const userMessage: ProfessionalConversationMessage = {
      role: "user",
      author: doctorName,
      content: messageText,
      timestamp,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);

    getOrCreateProGeneralSessionId(safePatient.id);
    try {
      const response = await sendChatMessage({
        mode: "personal",
        message: messageText,
        conversationId: conversationIdRef.current,
        patientUserId: requestedPatientId,
      });
      if (response.conversationId) {
        const isFirstTurn = !conversationIdRef.current;
        conversationIdRef.current = response.conversationId;
        // Persist conversationId in the URL on the first turn so refreshing
        // the page resumes the same thread (and history rows can deep-link).
        if (isFirstTurn && requestedPatientId) {
          const params = new URLSearchParams();
          params.set("patient", requestedPatientId);
          params.set("conversationId", response.conversationId);
          router.replace(`/dashboard/ai-doctor/personal?${params.toString()}`);
        }
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: "AI Doctor",
          content: response.reply,
          timestamp,
        },
      ]);
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      const content =
        code === 401
          ? "Please sign in again to continue."
          : code === 403
            ? "Only professional accounts can use the Clinical Assistant."
            : code === 404
              ? "Patient not found — refresh and try selecting again."
              : code === 400
                ? "This thread is bound to a different patient. Start a new chat from the patient's page."
                : code === 429
                  ? "You're sending messages too quickly — try again in a moment."
                  : code === 503
                    ? "The AI service is temporarily rate-limited. Please try again shortly."
                    : code === 504
                      ? "The AI service took too long to respond. Please try again."
                      : "I couldn't load a response right now. Please try again in a moment.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: "AI Doctor",
          content,
          timestamp,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <ProfessionalDashboardShell profile={profile}>
      <section
        className={cn(
          "relative flex min-h-[calc(100vh-11rem)] flex-col",
          messages.length === 0 && !hydrating ? "justify-between" : "gap-6",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {formatProfessionalPatientCompact(safePatient)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/90">
              Replies are general and do not use the patient&rsquo;s stored MediAI profile. Use
              the notes above for case context in your own words.
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/6 text-primary transition-colors hover:bg-primary/10"
              aria-label="Open clinical assistant options"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {menuOpen ? (
              <AssistantOptionsMenu
                patient={safePatient}
                onClose={() => setMenuOpen(false)}
                onStartNewConversation={() => {
                  setMenuOpen(false);
                  setMessages([]);
                  resetProGeneralSessionId(safePatient.id);
                  router.replace(
                    buildClinicalRoute(
                      "/dashboard/ai-doctor/personal",
                      safePatient.id,
                    ),
                  );
                }}
              />
            ) : null}
          </div>
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
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-9 text-center">
              <div className="space-y-3">
                <h1 className="text-[2.7rem] font-semibold tracking-tight text-foreground">
                  AI Clinical Assistant
                </h1>
                <p className="text-base text-muted-foreground">
                  Ask anything related to the selected patient&apos;s case. The model answers from
                  general knowledge only, not this patient&rsquo;s file.
                </p>
              </div>

              <div className="grid w-full gap-5 xl:grid-cols-4">
                {conversationPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.title}
                      type="button"
                      onClick={() => submitMessage(prompt.title)}
                      className="rounded-[1.25rem] border border-primary/12 bg-primary/5 px-5 py-5 text-left shadow-[0_26px_60px_-52px_rgba(76,104,220,0.7)] transition-transform hover:-translate-y-px"
                    >
                      <div className="flex min-h-40 flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <h2 className="text-lg font-semibold text-foreground">
                            {prompt.title}
                          </h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {prompt.description}
                          </p>
                        </div>
                        <div className="flex justify-end text-primary">
                          <Icon className="size-5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <ProfessionalComposer
              value={draft}
              onChange={setDraft}
              onSend={() => submitMessage()}
              sending={sending}
            />
          </>
        ) : (
          <>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-5xl rounded-[1.35rem] border px-5 py-4 shadow-[0_20px_60px_-52px_rgba(76,104,220,0.7)]",
                    message.role === "user"
                      ? "ml-auto border-primary/15 bg-white"
                      : "border-primary/20 bg-primary/7",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px]">
                        {message.role === "user" ? "D" : "AI"}
                      </span>
                      <span>{message.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/90">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            <ProfessionalComposer
              value={draft}
              onChange={setDraft}
              onSend={() => submitMessage()}
              sending={sending}
            />
          </>
        )}
      </section>
    </ProfessionalDashboardShell>
  );
}

/**
 * C1: No per-patient clinical thread list in the API yet; the assistant uses general chat
 * (no patient file in the model). Show an honest empty state and paths to start chatting.
 */
export function ProfessionalChatHistoryPage() {
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const { patients, findPatient } = useProfessionalPatients();
  const patientId = searchParams.get("patient") ?? "";
  const patient = findPatient(patientId);

  return (
    <ProfessionalDashboardShell profile={profile}>
      <section className="space-y-8">
        <div className="space-y-3">
          <Link
            href={buildClinicalRoute("/dashboard/ai-doctor", patientId)}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <span className="text-lg">←</span>
            <span>Clinical Assistant</span>
          </Link>
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-foreground">
            AI Conversation History
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            There is no saved <strong>per-patient</strong> clinical thread list in this version. The
            clinical assistant uses <strong>general</strong> answers (it does not load the
            patient&rsquo;s stored MediAI profile on the server). Open a case below to start a
            session; history stays in your current browser session for that case only.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={buildClinicalRoute(
              "/dashboard/ai-doctor/personal",
              patient?.id ?? patients[0]?.id,
            )}
            className="block rounded-2xl border border-primary/15 bg-primary/5 p-6 text-left transition-colors hover:border-primary/25"
          >
            <p className="text-sm font-medium text-primary">Start clinical chat</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {patient
                ? `Continue for ${formatProfessionalPatientCompact(patient)}`
                : "Select a patient on the home screen first, or we’ll use the first in your list when available."}
            </p>
          </Link>
          <Link
            href={buildClinicalRoute("/dashboard/ai-doctor", undefined)}
            className="block rounded-2xl border border-primary/15 bg-white p-6 text-left transition-colors hover:border-primary/25"
          >
            <p className="text-sm font-medium text-foreground">Choose a patient</p>
            <p className="mt-2 text-sm text-muted-foreground">Return to the assistant hub to pick who you&rsquo;re working with.</p>
          </Link>
        </div>
      </section>
    </ProfessionalDashboardShell>
  );
}

function AssistantOptionsMenu({
  patient,
  onClose,
  onStartNewConversation,
}: {
  patient: ProfessionalPatient;
  onClose: () => void;
  onStartNewConversation: () => void;
}) {
  const router = useRouter();

  const items = [
    {
      label: "Go to Patient Profile",
      onClick: () => router.push("/dashboard/profile"),
    },
    {
      label: "Change Patient",
      onClick: () => router.push("/dashboard/ai-doctor"),
    },
    {
      label: "Start New Conversation",
      onClick: onStartNewConversation,
    },
    {
      label: "Go to Conversation History",
      onClick: () =>
        router.push(buildClinicalRoute("/dashboard/ai-doctor/history", patient.id)),
    },
    {
      label: "Switch to Research Assistant",
      onClick: () =>
        router.push(buildClinicalRoute("/dashboard/ai-doctor/general", patient.id)),
    },
  ];

  return (
    <div className="absolute right-0 top-12 z-20 w-80 rounded-[1.35rem] border border-primary/15 bg-white p-3 shadow-[0_24px_70px_-40px_rgba(73,96,188,0.8)]">
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onClose();
              item.onClick();
            }}
            className="flex w-full items-center rounded-xl px-4 py-3 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PatientSelectionModal({
  patients,
  selectedPatientId,
  onClose,
  onSelect,
  isLoading,
  error,
}: {
  patients: ProfessionalPatient[];
  selectedPatientId: string;
  onClose: () => void;
  onSelect: (patient: ProfessionalPatient) => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[1.75rem] bg-white p-5 shadow-[0_40px_100px_-48px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">Select from My patients</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="Close patient selector"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center">
              <p className="text-base font-medium text-foreground">
                No patients in your list yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Patients are added when they message you from Top Doctors.
              </p>
            </div>
          ) : (
            <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(patient)}
                    className={cn(
                      "block w-full rounded-2xl px-4 py-3 text-left text-xl font-medium transition-colors sm:text-2xl",
                      selectedPatientId === patient.id
                        ? "bg-primary/6 text-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="text-foreground">{patient.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {patient.age} y.o {patient.sex}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-3 text-center">
            <Link
              href="/dashboard/patients"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open My patients for full profiles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfessionalComposer({
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
    <div className="rounded-2xl border border-primary/20 bg-white px-4 py-3 shadow-[0_26px_60px_-52px_rgba(76,104,220,0.75)]">
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
          aria-label="Send message"
        >
          <SendHorizonal className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ResearchAssistantUpgradePage({
  patient,
}: {
  patient: ProfessionalPatient;
}) {
  const profile = useDashboardProfile();

  return (
    <ProfessionalDashboardShell profile={profile}>
      <section className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-[0_26px_90px_-58px_rgba(76,104,220,0.85)]">
        <div className="relative overflow-hidden bg-[#4A4F63] px-6 py-10 text-white">
          <Link
            href={buildClinicalRoute("/dashboard/ai-doctor/personal", patient.id)}
            className="absolute right-5 top-5 inline-flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close research assistant upgrade dialog"
          >
            <X className="size-5" />
          </Link>

          <div className="mx-auto flex max-w-xl items-center justify-center gap-4">
            <ResearchLabCard
              title="Hemoglobin"
              value="10.2 g/dL"
              status="Normal"
              accent="border-[#B7D96B]"
            />
            <ResearchLabCard
              title="White Blood Cells (WBC)"
              value="13,500 cells/uL"
              status="High"
              accent="border-[#FF8383]"
              className="translate-y-16"
            />
            <ResearchLabCard
              title="Blood Glucose"
              value="135 mg/dL"
              status="High"
              accent="border-[#FF8383]"
            />
          </div>
        </div>

        <div className="space-y-10 px-6 py-10 text-center sm:px-8">
          <div className="space-y-3">
            <p className="text-[1.9rem] text-foreground/75">
              Research Assistant is available in paid plans.
            </p>
            <h1 className="text-[2.5rem] font-semibold leading-tight tracking-tight text-foreground">
              Upgrade for more patients and Research Tools
            </h1>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {researchPlanItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="space-y-4">
                  <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <p className="text-[1.15rem] font-medium leading-8 text-foreground">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <p className="text-[1.8rem] font-medium text-foreground">
              Make more confident clinical Decisions!
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
              <PricingCard
                title="Start with Monthly"
                price="ETB 1,450/month"
                description="Billed Monthly"
              />
              <PricingCard
                title="Start with Yearly for only"
                price="ETB 1,450/month"
                description="Billed Annually ETB 17,400"
                featured
                badge="Save 50%"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Need more options?{" "}
            <Link
              href="/dashboard/billing"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              View more plans
            </Link>
          </p>
        </div>
      </section>
    </ProfessionalDashboardShell>
  );
}

function ResearchLabCard({
  title,
  value,
  status,
  accent,
  className,
}: {
  title: string;
  value: string;
  status: string;
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-44 rounded-2xl border bg-white px-3 py-4 text-left text-[#222] shadow-[0_18px_50px_-34px_rgba(0,0,0,0.55)]",
        accent,
        className,
      )}
    >
      <p className="text-xs font-semibold">{title}</p>
      <div className="mt-3 space-y-1 text-[10px] text-[#666]">
        <p>Test name: {title}</p>
        <p>User value: {value}</p>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  description,
  featured,
  badge,
}: {
  title: string;
  price: string;
  description: string;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border px-6 py-5 text-left",
        featured
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/25 bg-white text-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[1.4rem] font-medium">{title}</p>
          <p
            className={cn(
              "text-sm",
              featured ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        </div>
        <div className="space-y-2 text-right">
          <p className="text-[1.35rem] font-medium">{price}</p>
          {badge ? (
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative w-full max-w-xs">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-sm outline-none transition-colors focus:border-primary"
      >
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function DoctorOrb() {
  return (
    <div className="relative flex size-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(113,133,255,0.95),rgba(44,52,96,1)_72%)] shadow-[0_28px_58px_-24px_rgba(57,78,171,0.85)]">
      <div className="absolute inset-3 rounded-full bg-white/8 blur-2xl" />
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div className="flex w-18 items-center justify-center gap-3 rounded-full bg-[#10173A] px-3 py-2 shadow-inner">
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
        <span className="h-3 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(120,140,255,0.95)]" />
      </div>
      <div className="absolute bottom-6 h-5 w-10 rounded-full bg-[#10173A] shadow-inner">
        <div className="mx-auto mt-1 h-2 w-4 rounded-full bg-white/95" />
      </div>
    </div>
  );
}

function buildClinicalRoute(basePath: string, patientId?: string) {
  return patientId
    ? `${basePath}?patient=${encodeURIComponent(patientId)}`
    : basePath;
}

function formatChatTimestamp(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
