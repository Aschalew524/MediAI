"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  CirclePlus,
  ClipboardPlus,
  FileSearch,
  FileText,
  Microscope,
  MoreHorizontal,
  Paperclip,
  Search,
  SendHorizonal,
  X,
} from "lucide-react";

import type { ChatMode } from "@/lib/chat-content";
import { sendMockChatMessage } from "@/lib/services/app-content";
import { cn } from "@/lib/utils";

import {
  formatProfessionalPatient,
  formatProfessionalPatientCompact,
  getProfessionalPatient,
  getProfessionalPatients,
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

type HistoryFilter = "all" | ChatMode;

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
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const selectedPatientId = searchParams.get("patient");
  const selectedPatient = selectedPatientId
    ? getProfessionalPatient(profile, selectedPatientId)
    : null;

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
                className="flex h-13 w-full items-center justify-between rounded-2xl border border-primary/15 bg-white px-4 text-left text-sm text-foreground shadow-[0_26px_60px_-52px_rgba(76,104,220,0.8)] transition-colors hover:border-primary/25"
              >
                <span className={cn(!selectedPatient && "text-muted-foreground")}>
                  {selectedPatient
                    ? formatProfessionalPatient(selectedPatient)
                    : "Select a patient to start a chat"}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

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
          patients={getProfessionalPatients(profile)}
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
  initialSeededConversation?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const patient = getProfessionalPatient(profile, searchParams.get("patient"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ProfessionalConversationMessage[]>(
    initialSeededConversation
      ? getSeededProfessionalConversation(patient)
      : [],
  );

  useEffect(() => {
    if (!initialSeededConversation) {
      setMessages([]);
    }
  }, [initialSeededConversation, patient.id]);

  if (mode === "general") {
    return <ResearchAssistantUpgradePage patient={patient} />;
  }

  async function submitMessage(nextDraft?: string) {
    const messageText = (nextDraft ?? draft).trim();
    if (!messageText || sending) return;

    const timestamp = "14 Apr, 2026";
    const userMessage: ProfessionalConversationMessage = {
      role: "user",
      author: "Dr. Ashenafi",
      content: messageText,
      timestamp,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);

    try {
      const response = await sendMockChatMessage("personal", messageText);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: "AI Doctor",
          content: response.reply,
          timestamp,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          author: "AI Doctor",
          content:
            "I couldn't load a response right now. Please try again in a moment.",
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
          messages.length === 0 ? "justify-between" : "gap-6",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            {formatProfessionalPatientCompact(patient)}
          </p>
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
                patient={patient}
                onClose={() => setMenuOpen(false)}
                onStartNewConversation={() => {
                  setMenuOpen(false);
                  setMessages([]);
                  router.replace(
                    buildClinicalRoute(
                      "/dashboard/ai-doctor/personal",
                      patient.id,
                    ),
                  );
                }}
              />
            ) : null}
          </div>
        </div>

        {messages.length === 0 ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-9 text-center">
              <div className="space-y-3">
                <h1 className="text-[2.7rem] font-semibold tracking-tight text-foreground">
                  AI Clinical Assistant
                </h1>
                <p className="text-base text-muted-foreground">
                  Ask anything related to the selected patient's case.
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

export function ProfessionalChatHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useDashboardProfile();
  const patients = getProfessionalPatients(profile);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [patientId, setPatientId] = useState(searchParams.get("patient") ?? "");

  const items = useMemo(() => {
    const baseItems = [
      {
        title: "General",
        type: "personal" as ChatMode,
        patient: patients[0] ?? getProfessionalPatient(profile, null),
        lastMessageAt: "02 Apr, 9:55 AM",
      },
    ];

    return baseItems.filter((item) => {
      const matchesType = filter === "all" ? true : item.type === filter;
      const matchesPatient = patientId ? item.patient.id === patientId : true;
      return matchesType && matchesPatient;
    });
  }, [filter, patientId, patients, profile]);

  return (
    <ProfessionalDashboardShell profile={profile}>
      <section className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <Link
              href="/dashboard/ai-doctor"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              <span className="text-lg">←</span>
              <span>Clinical Assistant</span>
            </Link>
            <h1 className="text-[2.25rem] font-semibold tracking-tight text-foreground">
              AI Conversation History
            </h1>
          </div>

          <Link
            href={buildClinicalRoute("/dashboard/ai-doctor", patientId)}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            + New Chat
          </Link>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <SelectField
            value={filter}
            onChange={(value) => setFilter(value as HistoryFilter)}
            options={[
              { value: "all", label: "Select type" },
              { value: "personal", label: "Clinical Assistant" },
              { value: "general", label: "Research Assistant" },
            ]}
          />
          <SelectField
            value={patientId}
            onChange={setPatientId}
            options={[
              { value: "", label: "Select Patient" },
              ...patients.map((patient) => ({
                value: patient.id,
                label: formatProfessionalPatient(patient),
              })),
            ]}
          />
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <button
              key={`${item.title}-${item.patient.id}`}
              type="button"
              onClick={() =>
                router.push(
                  buildClinicalRoute(
                    "/dashboard/ai-doctor/last-chat",
                    item.patient.id,
                  ),
                )
              }
              className="block w-full text-left"
            >
              <DashboardPanel className="rounded-[1.35rem] border-primary/20 px-6 py-5 shadow-none transition-colors hover:border-primary/30">
                <div className="space-y-3">
                  <h2 className="text-[1.75rem] font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <p>
                      Patient:{" "}
                      <span className="font-semibold text-foreground">
                        {formatProfessionalPatientCompact(item.patient)}
                      </span>
                    </p>
                    <p>
                      Last Message Date:{" "}
                      <span className="font-semibold text-foreground">
                        {item.lastMessageAt}
                      </span>
                    </p>
                  </div>
                </div>
              </DashboardPanel>
            </button>
          ))}
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
}: {
  patients: ProfessionalPatient[];
  selectedPatientId: string;
  onClose: () => void;
  onSelect: (patient: ProfessionalPatient) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[1.75rem] bg-white p-5 shadow-[0_40px_100px_-48px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">Select Patient</p>
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
          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => onSelect(patient)}
              className={cn(
                "block w-full rounded-2xl px-4 py-3 text-left text-[2rem] font-medium transition-colors sm:text-[2.1rem]",
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
          ))}

          <div className="flex flex-col gap-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-[2rem] font-medium text-foreground sm:text-[2.1rem]">
              Can&apos;t find the patient?
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-7 text-[1.1rem] font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              <CirclePlus className="size-5" />
              Add New Patient
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
                price="$25/month"
                description="Billed Monthly"
              />
              <PricingCard
                title="Start with Yearly for only"
                price="$25/month"
                description="Billed Annually $300"
                featured
                badge="Save 50%"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Need more options?{" "}
            <span className="font-medium text-primary">View more plans</span>
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
        {options.map((option) => (
          <option key={option.label} value={option.value}>
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

function getSeededProfessionalConversation(patient: ProfessionalPatient) {
  return [
    {
      role: "user" as const,
      author: "Dr. Ashenafi",
      content:
        "Ask about differential diagnoses, treatment plans, or clinical insights for this patient case.",
      timestamp: "14 Apr, 2026",
    },
    {
      role: "assistant" as const,
      author: "AI Doctor",
      content: `To provide the most accurate and helpful support, could you please share more details about ${patient.name}'s current condition? Specifically, it would be beneficial to know:\nSymptoms: What symptoms is the patient experiencing?\nMedical History: Are there any relevant past medical conditions or family history that should be considered?\nPreliminary Test Results: Have any tests been conducted, and if so, what were the results?\nSpecific Concerns: Are there any particular concerns or questions you have regarding this case?\nThis information will help in formulating potential differential diagnoses and suggesting appropriate treatment plans.`,
      timestamp: "14 Apr, 2026",
    },
  ];
}

function buildClinicalRoute(basePath: string, patientId?: string) {
  return patientId ? `${basePath}?patient=${patientId}` : basePath;
}
