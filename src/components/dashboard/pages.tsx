"use client";

import {
  useEffect,
  useReducer,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ClipboardPlus,
  FileText,
  FlaskConical,
  HeartPulse,
  MapPin,
  MessageCircleMore,
  Pencil,
  Stethoscope,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  activityOptions,
  alcoholOptions,
  allergyOptions,
  chronicDiseaseOptions,
  dashboardProfileStorageKey,
  type DashboardProfile,
  dietOptions,
  familyHistoryOptions,
  getProfileHeight,
  getProfileName,
  getProfessionalName,
  getProfileSex,
  getProfileWeight,
  type MedicalHistoryData,
  sleepOptions,
  smokingOptions,
  stressOptions,
} from "@/lib/dashboard-content";
import { clearAccessToken } from "@/lib/auth-storage";
import { postForgotPassword, userFacingAxiosError } from "@/lib/auth-api";
import {
  deleteMeAccount,
  patchAiDoctorSetup,
  patchMeProfile,
  profileToPatchBody,
  putMedicalHistory,
  userFacingMeError,
} from "@/lib/me-api";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";
import {
  computeProfileCompletion,
  mainHealthInformationCompletionPercent,
  overallProfileCompletionPercent,
} from "@/lib/profile-completion";
import { cn } from "@/lib/utils";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { useDashboardMe } from "./dashboard-me-provider";
import { HealthConcernsPanel } from "./health-concerns-panel";
import { HealthQuotesCard } from "./health-quotes-card";
import { NotificationsInbox } from "./notifications-inbox";

import {
  CompletionRing,
  CompletionBar,
  DashboardActionButton,
  DashboardBackLink,
  DashboardBackTitle,
  DashboardContainer,
  DashboardListRow,
  DashboardPage,
  DashboardPanel,
} from "./primitives";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";
import {
  listProfessionalPatients,
  type ApiPatientSummary,
} from "@/lib/services/professional-api";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

export function DashboardHomePage() {
  const profile = useDashboardProfile();
  const { medicalHistory } = useDashboardMe();
  const { data: config } = useDashboardConfig();
  const name = getProfileName(profile);

  if (profile.professionalProfile) {
    return <ProfessionalDashboardHomePage profile={profile} />;
  }

  const profileCompletion = overallProfileCompletionPercent(
    profile,
    medicalHistory,
  );

  return (
    <DashboardPage className="py-8 sm:py-10">
      <DashboardContainer className="space-y-8">
        <Link
          href="/dashboard/profile"
          className="block transition-transform duration-300 hover:-translate-y-0.5"
        >
          <DashboardPanel className="relative overflow-hidden border-primary/10 px-5 py-5 sm:px-8 sm:py-6">
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.06] via-transparent to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                  Overview
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {name}&rsquo;s health profile
                </h1>
                <p className="text-sm text-muted-foreground">Completion snapshot</p>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  v1 estimate from your basics and medical history forms (not AI
                  Doctor setup or documents).
                </p>
              </div>
              <CompletionRing value={profileCompletion} />
            </div>
          </DashboardPanel>
        </Link>

        <HealthQuotesCard />

        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Quick actions
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Jump to tools and programs
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {config.dashboardCards.map((card) => (
              <DashboardShortcutCard
                key={card.href}
                title={card.title}
                description={card.description}
                href={card.href}
                accent={card.accent}
                muted={"muted" in card ? card.muted : undefined}
              />
            ))}
          </div>
        </div>

        <div className="pt-1">
          <DashboardShortcutCard
            title={config.consultDoctorsCard.title}
            description={config.consultDoctorsCard.description}
            href={config.consultDoctorsCard.href}
            accent="doctors"
            wide
          />
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

type DoctorPatientsState = {
  isLoading: boolean;
  patients: ApiPatientSummary[];
  error: string | null;
};

type DoctorPatientsAction =
  | { type: "request" }
  | { type: "success"; patients: ApiPatientSummary[] }
  | { type: "failure"; message: string | null };

function doctorPatientsReducer(
  state: DoctorPatientsState,
  action: DoctorPatientsAction,
): DoctorPatientsState {
  switch (action.type) {
    case "request":
      return { ...state, isLoading: true, error: null };
    case "success":
      return { isLoading: false, patients: action.patients, error: null };
    case "failure":
      return { isLoading: false, patients: [], error: action.message };
    default:
      return state;
  }
}

function ProfessionalDashboardHomePage({
  profile,
}: {
  profile: DashboardProfile;
}) {
  const professionalName = getProfessionalName(profile);
  const router = useRouter();
  const [patientsState, dispatchPatients] = useReducer(
    doctorPatientsReducer,
    { isLoading: true, patients: [], error: null },
  );
  const { patients, isLoading: isLoadingPatients, error: patientsError } =
    patientsState;
  const [selectedPatient, setSelectedPatient] = useState("");

  useEffect(() => {
    let cancelled = false;
    dispatchPatients({ type: "request" });
    listProfessionalPatients({ pageSize: 50 })
      .then((res) => {
        if (cancelled) return;
        dispatchPatients({ type: "success", patients: res.items });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        const message =
          code === 403 ? null : "Could not load patients. Try again later.";
        dispatchPatients({ type: "failure", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handlePatientSelect(value: string) {
    setSelectedPatient(value);
    if (value) {
      router.push(`/dashboard/patients/${value}`);
    }
  }

  return (
    <ProfessionalDashboardShell profile={profile}>
      <DashboardPanel className="relative overflow-hidden rounded-3xl border-primary/10 px-6 py-6 shadow-[0_22px_70px_-48px_rgba(76,104,220,0.28)] sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.05] via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Hello {professionalName}!
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Manage your patients, screenings, and assistant workflows from one
              place.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative max-w-3xl">
              <select
                value={selectedPatient}
                onChange={(event) => handlePatientSelect(event.target.value)}
                disabled={isLoadingPatients}
                className="h-12 min-h-12 w-full appearance-none rounded-xl border border-primary/12 bg-white px-4 py-2.5 pr-10 text-base text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60 sm:h-11 sm:min-h-11 sm:text-sm"
              >
                <option value="">
                  {isLoadingPatients
                    ? "Loading patients…"
                    : patients.length === 0
                      ? "No patients linked to you yet"
                      : "Jump to a patient…"}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {formatPatientOption(patient)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {patientsError ? (
              <p className="text-xs text-destructive" role="alert">
                {patientsError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Or open{" "}
                <Link
                  href="/dashboard/patients"
                  className="font-medium text-primary hover:underline"
                >
                  My patients
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </DashboardPanel>

      <HealthQuotesCard />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ProfessionalDashboardCard
          title="Clinical Assistant"
          href="/dashboard/ai-doctor"
          visual={<AssistantOrbVisual />}
        />
        <ProfessionalDashboardCard
          title="Research Assistant"
          href="/dashboard/ai-doctor/general"
          visual={<NotesVisual />}
        />
        <ProfessionalDashboardCard
          title="Conversation History"
          href="/dashboard/ai-doctor/history"
          visual={<LabSheetVisual />}
        />
        <ProfessionalDashboardCard
          title="My patients"
          description="Profiles and health records for patients linked to you."
          href="/dashboard/patients"
          visual={<PatientsVisual />}
        />
        <ProfessionalDashboardCard
          title="Health Blog"
          description="Care guides, product news, and wellness reads."
          href="/dashboard/blog"
          visual={<BlogStackVisual />}
        />
      </div>
    </ProfessionalDashboardShell>
  );
}

function formatPatientOption(p: ApiPatientSummary): string {
  const sex =
    p.sexAtBirth === "male"
      ? "Male"
      : p.sexAtBirth === "female"
        ? "Female"
        : "Other";
  const name = p.preferredName || p.email;
  const age = p.age || "—";
  return `${name} · ${age} y.o · ${sex}`;
}

function ProfessionalDashboardCard({
  title,
  description,
  href,
  muted,
  visual,
}: {
  title: string;
  description?: string;
  href: string;
  muted?: boolean;
  visual: ReactNode;
}) {
  const content = (
    <DashboardPanel className="min-h-52 overflow-hidden rounded-3xl border-primary/12 px-5 py-6 shadow-[0_20px_64px_-50px_rgba(76,104,220,0.28)] transition-all duration-300 hover:border-primary/18 hover:shadow-[0_28px_80px_-44px_rgba(76,104,220,0.38)] sm:px-8 sm:py-7">
      <div className="flex h-full flex-col items-start justify-between gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="space-y-2">
          <h2 className="max-w-sm text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">
              {muted ? `○ ${description}` : description}
            </p>
          ) : null}
        </div>
        <div className="self-center sm:shrink-0">{visual}</div>
      </div>
    </DashboardPanel>
  );

  // Same rule as `DashboardShortcutCard` below — hash-only placeholders are
  // never wrapped in a `<Link>`.
  if (href === "#" || href.startsWith("#")) {
    return content;
  }

  return (
    <Link href={href} className="block transition-transform hover:-translate-y-px">
      {content}
    </Link>
  );
}

function AssistantOrbVisual() {
  return (
    <div className="relative flex size-32 items-center justify-center">
      <div className="absolute inset-3 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex size-24 items-center justify-center rounded-full bg-white shadow-[0_24px_80px_-38px_rgba(76,104,220,0.9)]">
        <div className="absolute inset-1 rounded-full bg-primary/6" />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-inner">
          <Stethoscope className="size-8" />
        </div>
      </div>
    </div>
  );
}

function LabSheetVisual() {
  return (
    <div className="relative flex size-32 items-center justify-center">
      <div className="absolute inset-2 rounded-full bg-primary/7 blur-3xl" />
      <div className="relative rotate-6 rounded-[1.4rem] border border-primary/20 bg-white px-4 py-4 shadow-[0_24px_80px_-42px_rgba(76,104,220,0.7)]">
        <div className="-rotate-6 space-y-2">
          <div className="h-1.5 w-14 rounded-full bg-primary/80" />
          <div className="h-1.5 w-10 rounded-full bg-primary/35" />
          <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/8">
            <FlaskConical className="size-7 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesVisual() {
  return (
    <div className="relative flex size-32 items-center justify-center">
      <div className="absolute inset-4 rounded-full bg-primary/6 blur-3xl" />
      <div className="relative flex items-end gap-2">
        <div className="rounded-[1.2rem] border border-primary/15 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(76,104,220,0.55)]">
          <FileText className="size-8 text-primary" />
        </div>
        <div className="rounded-full bg-primary p-1 text-primary-foreground shadow-[0_16px_35px_-20px_rgba(76,104,220,0.75)]">
          <ClipboardPlus className="size-4" />
        </div>
      </div>
    </div>
  );
}

function PatientsVisual() {
  return (
    <div className="relative flex size-32 items-center justify-center">
      <div className="absolute inset-3 rounded-full bg-primary/6 blur-3xl" />
      <div className="relative flex items-end gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Users className="size-6" />
          </div>
          <div className="h-10 w-7 rounded-t-full bg-primary/65" />
        </div>
        <div className="mb-2 h-12 w-px bg-primary/20" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Users className="size-6" />
          </div>
          <div className="h-10 w-7 rounded-t-full bg-primary/45" />
        </div>
      </div>
    </div>
  );
}

function BlogStackVisual() {
  return (
    <div className="relative flex size-32 items-center justify-center">
      <div className="absolute inset-3 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative rounded-[1.25rem] border border-primary/15 bg-white px-4 py-3 shadow-[0_22px_70px_-42px_rgba(76,104,220,0.6)]">
        <BookOpen className="size-9 text-primary" strokeWidth={1.75} aria-hidden />
      </div>
    </div>
  );
}

function DashboardShortcutCard({
  title,
  description,
  href,
  accent,
  muted,
  wide,
}: {
  title: string;
  description: string;
  href: string;
  accent: "bot" | "facilities" | "doctors" | "messages";
  muted?: boolean;
  wide?: boolean;
}) {
  const cardContent = (
    <DashboardPanel
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:border-primary/18 hover:shadow-[0_32px_88px_-44px_rgba(76,104,220,0.42)]",
        muted && "opacity-[0.92]",
        wide && "min-h-[8.5rem] sm:min-h-36",
        !wide && "min-h-[7.5rem] sm:min-h-32",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 flex min-h-[6.5rem] flex-col justify-between gap-4 sm:min-h-0 sm:flex-row sm:items-center">
        <div className="min-w-0 space-y-1.5">
          <h2 className="max-w-[14rem] text-lg font-semibold leading-snug tracking-tight text-foreground sm:max-w-xs sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {muted ? `○ ${description}` : description}
            </p>
          ) : null}
        </div>
        <VisualAccent accent={accent} title={title} />
      </div>
    </DashboardPanel>
  );

  // Treat any hash-only placeholder (e.g. `#check-up-plan`) as non-clickable
  // — the dashboard config keeps "Coming Soon" tiles with unique hash anchors
  // so the merger can't collapse them, but they shouldn't actually navigate.
  if (href === "#" || href.startsWith("#")) return cardContent;

  return (
    <Link href={href} className="block transition-transform hover:-translate-y-px">
      {cardContent}
    </Link>
  );
}

function VisualAccent({
  accent,
  title,
}: {
  accent: "bot" | "facilities" | "doctors" | "messages";
  title: string;
}) {
  if (title === "Health Blog") {
    return (
      <div className="relative flex size-20 shrink-0 items-center justify-center sm:size-[5.25rem]">
        <div className="absolute inset-2 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative rounded-2xl border border-primary/15 bg-white p-3.5 shadow-[0_18px_48px_-32px_rgba(76,104,220,0.65)]">
          <BookOpen className="size-8 text-primary" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
    );
  }

  if (title === "Check Up Plan") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <Image
          src="/checkup_plan.png"
          alt="Check Up Plan Icon"
          width={80}
          height={80}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  if (title === "Health Reports") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <Image
          src="/report.png"
          alt="Health Reports Icon"
          width={80}
          height={80}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  if (title === "Consult Top Doctors") {
    return (
      <div className="relative flex size-24 items-center justify-center">
        <Image
          src="/consult_top_doctors.png"
          alt="Consultation Icon"
          width={96}
          height={96}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  if (accent === "bot") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <Image
          src="/bot-logo.png"
          alt="Bot Icon"
          width={80}
          height={80}
          className="object-contain"
        />
      </div>
    );
  }

  if (accent === "facilities") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-3 rounded-full bg-primary/8 blur-2xl" />
        <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <MapPin
            className="size-8 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>
    );
  }

  if (accent === "messages") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-3 rounded-full bg-primary/8 blur-2xl" />
        <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <MessageCircleMore
            className="size-8 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-24 items-center justify-center">
      <div className="absolute inset-2 rounded-full bg-primary/8 blur-3xl" />
      <div className="flex -space-x-3">
        <div className="flex size-14 items-center justify-center rounded-full border border-primary/10 bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.75)] overflow-hidden">
          <Image
            src="/sample_doc_photo.png"
            alt="Doctor Photo"
            width={56}
            height={56}
            className="size-full object-cover"
          />
        </div>
        <div className="mt-4 flex size-14 items-center justify-center rounded-full border border-primary/10 bg-white shadow-[0_20px_50px_-35px_rgba(76,104,220,0.75)]">
          <Stethoscope className="size-6 text-primary/60" />
        </div>
      </div>
    </div>
  );
}

export function HealthProfilePage() {
  const profile = useDashboardProfile();
  const router = useRouter();

  // Doctors no longer have a personal "Health Profile" page — My patients is the
  // entry point for profiles and messaging.
  useEffect(() => {
    if (profile.professionalProfile) {
      router.replace("/dashboard/patients");
    }
  }, [profile.professionalProfile, router]);

  if (profile.professionalProfile) {
    return (
      <ProfessionalDashboardShell profile={profile}>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Redirecting to My patients…
        </div>
      </ProfessionalDashboardShell>
    );
  }

  return <ConsumerHealthProfilePage profile={profile} />;
}

function ConsumerHealthProfilePage({
  profile,
}: {
  profile: DashboardProfile;
}) {
  const { refreshMe, medicalHistory, raw, meError } = useDashboardMe();
  const [editableProfile, setEditableProfile] = useState<DashboardProfile>(profile);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setEditableProfile(profile);
  }, [profile]);

  function openEditModal() {
    setProfileSaveError(null);
    setEditableProfile(profile);
    setEditModalOpen(true);
  }

  async function handleProfileSave(nextProfile: DashboardProfile) {
    setProfileSaveError(null);
    setProfileSaving(true);
    try {
      await patchMeProfile(profileToPatchBody(nextProfile));
      await refreshMe();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          dashboardProfileStorageKey,
          JSON.stringify(nextProfile),
        );
      }
      setEditableProfile(nextProfile);
      setEditModalOpen(false);
    } catch (e) {
      setProfileSaveError(
        userFacingMeError(e, "Could not save your profile. Please try again."),
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // The ring on `/dashboard` and the bar/ring here all derive from
  // `editableProfile` + the latest medical-history snapshot so any edit
  // (general info modal, medical-history page, AI Doctor wizard) shifts the
  // indicators in lockstep.
  const overallCompletion = overallProfileCompletionPercent(
    editableProfile,
    medicalHistory,
  );
  const mainHealthInfoCompletion =
    mainHealthInformationCompletionPercent(medicalHistory);
  const completion =
    raw?.profile != null && !meError
      ? computeProfileCompletion(editableProfile, medicalHistory)
      : null;

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <DashboardBackTitle
              title="Health Profile"
              description="Complete your basics and medical history so guidance stays relevant. v1 completion is a simple checklist score (client-only from your saved profile)."
            />
            <CompletionBar value={overallCompletion} label="Completed" />
          </div>

          <DashboardPanel className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">General Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Health Profile</p>
              </div>
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
              >
                <Pencil className="size-4 text-primary" />
                Edit details
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_180px_1fr] lg:items-center">
              <div className="space-y-4">
                <ProfileStat title="Age" value={`${editableProfile.age || "55"} Years`} />
                <ProfileStat title="Height" value={getProfileHeight(editableProfile)} />
              </div>

              <div className="flex justify-center">
                <Image
                  src="/BODY.png"
                  alt="Body parts overview"
                  width={160}
                  height={260}
                  className="h-48 w-auto object-contain"
                />
              </div>

              <div className="space-y-4">
                <ProfileStat title="Weight" value={getProfileWeight(editableProfile)} />
                <ProfileStat title="Sex Assigned at birth" value={getProfileSex(editableProfile)} />
              </div>
            </div>
          </DashboardPanel>

          <Link href="/dashboard/profile/main-health-information" className="block transition-transform hover:-translate-y-px">
            <DashboardPanel className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
              <CompletionRing value={mainHealthInfoCompletion} size="sm" />
              <h3 className="text-xl font-semibold">Main Health Information</h3>
            </DashboardPanel>
          </Link>

          <Link href="/dashboard/profile/medical-history" className="block transition-transform hover:-translate-y-px">
            <DashboardPanel className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
              {completion ? (
                <span title="Medical history & lifestyle checklist only">
                  <CompletionRing value={completion.segments.medical} size="sm" />
                </span>
              ) : (
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/25 bg-muted/30 text-[0.625rem] font-semibold leading-none text-muted-foreground">
                  —
                </span>
              )}
              <div>
                <h3 className="text-xl font-semibold">Medical History &amp; Lifestyle</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Chronic diseases, allergies, medications, and lifestyle habits
                </p>
              </div>
            </DashboardPanel>
          </Link>

        </DashboardContainer>
      </DashboardPage>

      {editModalOpen ? (
        <EditGeneralInformationModal
          profile={editableProfile}
          saveError={profileSaveError}
          isSaving={profileSaving}
          onClose={() => {
            setProfileSaveError(null);
            setEditModalOpen(false);
          }}
          onSave={handleProfileSave}
        />
      ) : null}
    </>
  );
}

function ProfileStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/12 bg-background px-5 py-4">
      <div className="flex items-center gap-3 text-lg font-medium">
        <Pencil className="size-4 text-primary" />
        <span>{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function EditGeneralInformationModal({
  profile,
  onClose,
  onSave,
  saveError,
  isSaving,
}: {
  profile: DashboardProfile;
  onClose: () => void;
  onSave: (profile: DashboardProfile) => void | Promise<void>;
  saveError?: string | null;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState<DashboardProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_35px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Edit General Information</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your profile using the same core fields from onboarding.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close edit profile dialog"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submitForm} className="space-y-5">
          {saveError ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Preferred Name</span>
              <input
                value={draft.preferredName}
                onChange={(event) => setDraft((current) => ({ ...current, preferredName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
                placeholder="Your name"
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Age</span>
              <input
                value={draft.age}
                onChange={(event) => setDraft((current) => ({ ...current, age: event.target.value }))}
                className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
                inputMode="numeric"
                placeholder="55"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Weight (lbs)</span>
              <input
                value={draft.weight}
                onChange={(event) => setDraft((current) => ({ ...current, weight: event.target.value }))}
                className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
                inputMode="numeric"
                placeholder="77"
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Height (ft)</span>
              <input
                value={draft.heightFeet}
                onChange={(event) => setDraft((current) => ({ ...current, heightFeet: event.target.value }))}
                className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
                inputMode="numeric"
                placeholder="5"
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Height (in)</span>
              <input
                value={draft.heightInches}
                onChange={(event) => setDraft((current) => ({ ...current, heightInches: event.target.value }))}
                className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
                inputMode="numeric"
                placeholder="6"
                required
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Sex assigned at birth</p>
            <div className="grid grid-cols-3 gap-2">
              {["male", "female", "other"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      sexAtBirth: option as DashboardProfile["sexAtBirth"],
                    }))
                  }
                  className={cn(
                    "h-10 rounded-xl border text-sm font-medium capitalize transition-colors",
                    draft.sexAtBirth === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/15 hover:bg-muted",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MainHealthInformationPage() {
  const { profile, medicalHistory, raw, meError } = useDashboardMe();
  const completion =
    raw?.profile != null && !meError
      ? computeProfileCompletion(profile, medicalHistory)
      : null;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <DashboardBackTitle
            title="Main Health Information"
            description="Complete your main health information to personalize your AI Doctor, explore your health risks and get personal checkup plan."
          />
          {completion ? (
            <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
              <CompletionBar value={completion.segments.mainHealthHub} label="hub" />
              <p className="max-w-[14rem] text-xs leading-snug text-muted-foreground lg:text-right">
                v1: average of general profile and medical/lifestyle forms.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Completion unavailable.</p>
          )}
        </div>

        <DashboardPanel className="px-6 py-4">
          <DashboardListRow
            title="General Information"
            href="/dashboard/profile"
          />
          <DashboardListRow
            title="Medications"
            href="/dashboard/profile/medical-history"
          />
          <DashboardListRow
            title="Life patterns and Habits"
            href="/dashboard/profile/medical-history"
          />
        </DashboardPanel>

        <div className="flex justify-center">
          <Link href="/dashboard/profile/medical-history">
            <DashboardActionButton>Update Health Information</DashboardActionButton>
          </Link>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

/* -------------------------------------------------------------------------- */
/*  Medical History & Lifestyle                                               */
/* -------------------------------------------------------------------------- */

function useMedicalHistory() {
  const { medicalHistory, refreshMe, aiDoctorSetupCompleted } =
    useDashboardMe();

  // `medicalHistory` from context is already merged with `defaultMedicalHistory`
  // so we don't need a separate hydration step here. Returning the context
  // value directly also avoids cascading setState-in-effect renders.
  const data: MedicalHistoryData = medicalHistory;

  /**
   * Persist the latest medical-history form. When the user has not yet
   * finished the AI Doctor setup wizard we also flip
   * `aiDoctorSetupCompleted=true`: filling the medical-history page is a
   * superset of the wizard, so the wizard gate should auto-clear regardless
   * of which surface the user used.
   */
  async function save(next: MedicalHistoryData) {
    await putMedicalHistory(next);
    if (!aiDoctorSetupCompleted) {
      try {
        await patchAiDoctorSetup(true);
      } catch (e) {
        console.warn("Failed to mark AI Doctor setup complete", e);
      }
    }
    await refreshMe();
  }

  return { data, save };
}

export function MedicalHistoryPage() {
  const { data, save } = useMedicalHistory();
  const [draft, setDraft] = useState<MedicalHistoryData>(data);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(data);
  }, [data]);

  function update(partial: Partial<MedicalHistoryData>) {
    setDraft((current) => ({ ...current, ...partial }));
    setSaved(false);
  }

  function toggleItem(
    field: "chronicDiseases" | "allergies" | "familyHistory",
    value: string,
  ) {
    setDraft((current) => {
      const list = current[field];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...current, [field]: next };
    });
    setSaved(false);
  }

  function handleSave() {
    setSaveError(null);
    setSaving(true);
    void save(draft)
      .then(() => {
        setSaved(true);
      })
      .catch((e: unknown) => {
        setSaveError(userFacingMeError(e, "Could not save medical history."));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <DashboardBackTitle
          title="Medical History & Lifestyle"
          description="Record your chronic conditions, allergies, medications, and daily habits so your AI Doctor can give tailored guidance."
        />

        <HealthConcernsPanel />

        {/* Chronic Diseases */}
        <DashboardPanel className="space-y-5 px-6 py-5">
          <SectionHeading title="Chronic Diseases" icon={<HeartPulse className="size-5" />} />
          <p className="text-sm text-muted-foreground">
            Select any chronic or past conditions that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {chronicDiseaseOptions.map((option) => (
              <ChipToggle
                key={option}
                label={option}
                selected={draft.chronicDiseases.includes(option)}
                onClick={() => toggleItem("chronicDiseases", option)}
              />
            ))}
          </div>
          <input
            value={draft.chronicDetails}
            onChange={(e) => update({ chronicDetails: e.target.value })}
            placeholder="Other conditions not listed above..."
            className="h-11 w-full rounded-xl border border-primary/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </DashboardPanel>

        {/* Family Health History */}
        <DashboardPanel className="space-y-5 px-6 py-5">
          <SectionHeading
            title="Family Health History"
            icon={<HeartPulse className="size-5" />}
          />
          <p className="text-sm text-muted-foreground">
            Conditions present in close family members (parents, siblings,
            grandparents). Helps flag inherited risks.
          </p>
          <div className="flex flex-wrap gap-2">
            {familyHistoryOptions.map((option) => (
              <ChipToggle
                key={option}
                label={option}
                selected={draft.familyHistory.includes(option)}
                onClick={() => toggleItem("familyHistory", option)}
              />
            ))}
          </div>
          <input
            value={draft.familyHistoryDetails}
            onChange={(e) =>
              update({ familyHistoryDetails: e.target.value })
            }
            placeholder="e.g. Mother with diabetes, father had heart disease..."
            className="h-11 w-full rounded-xl border border-primary/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </DashboardPanel>

        {/* Allergies */}
        <DashboardPanel className="space-y-5 px-6 py-5">
          <SectionHeading title="Known Allergies" icon={<Stethoscope className="size-5" />} />
          <p className="text-sm text-muted-foreground">
            Select any known allergies (medications, food, environmental).
          </p>
          <div className="flex flex-wrap gap-2">
            {allergyOptions.map((option) => (
              <ChipToggle
                key={option}
                label={option}
                selected={draft.allergies.includes(option)}
                onClick={() => toggleItem("allergies", option)}
              />
            ))}
          </div>
          <input
            value={draft.allergyDetails}
            onChange={(e) => update({ allergyDetails: e.target.value })}
            placeholder="Other allergies not listed above..."
            className="h-11 w-full rounded-xl border border-primary/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </DashboardPanel>

        {/* Surgical History */}
        <DashboardPanel className="space-y-5 px-6 py-5">
          <SectionHeading
            title="Surgical History"
            icon={<ClipboardPlus className="size-5" />}
          />
          <p className="text-sm text-muted-foreground">
            Major operations and procedures, with approximate dates if
            possible.
          </p>
          <textarea
            value={draft.surgicalHistory}
            onChange={(e) => update({ surgicalHistory: e.target.value })}
            placeholder="e.g. cardiac stenting in 2019, appendectomy in 2003..."
            rows={3}
            className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </DashboardPanel>

        {/* Medications */}
        <DashboardPanel className="space-y-5 px-6 py-5">
          <SectionHeading title="Medications" icon={<ClipboardPlus className="size-5" />} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Current Medications</span>
            <textarea
              value={draft.currentMedications}
              onChange={(e) => update({ currentMedications: e.target.value })}
              placeholder="e.g. Metformin 500mg twice daily, Lisinopril 10mg once daily..."
              rows={3}
              className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Past Medications (last 6 months)</span>
            <textarea
              value={draft.pastMedications}
              onChange={(e) => update({ pastMedications: e.target.value })}
              placeholder="e.g. Amoxicillin course in January, Vitamin D supplements..."
              rows={3}
              className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
        </DashboardPanel>

        {/* Lifestyle */}
        <DashboardPanel className="space-y-6 px-6 py-5">
          <SectionHeading title="Lifestyle Habits" icon={<FileText className="size-5" />} />

          <ChoiceGroup
            label="Daily Smoking Intensity"
            options={smokingOptions}
            value={draft.smokingIntensity}
            onChange={(v) => update({ smokingIntensity: v })}
          />
          <ChoiceGroup
            label="Weekly Alcohol Intake"
            options={alcoholOptions}
            value={draft.alcoholIntake}
            onChange={(v) => update({ alcoholIntake: v })}
          />
          <ChoiceGroup
            label="Dietary Habits"
            options={dietOptions}
            value={draft.dietaryHabits}
            onChange={(v) => update({ dietaryHabits: v })}
          />
          <ChoiceGroup
            label="Weekly Activity Level"
            options={activityOptions}
            value={draft.activityLevel}
            onChange={(v) => update({ activityLevel: v })}
          />
          <ChoiceGroup
            label="Daily Sleep Pattern"
            options={sleepOptions}
            value={draft.sleepPattern}
            onChange={(v) => update({ sleepPattern: v })}
          />
          <ChoiceGroup
            label="Stress Level"
            options={stressOptions}
            value={draft.stressLevel}
            onChange={(v) => update({ stressLevel: v })}
          />
        </DashboardPanel>

        {saveError ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {saveError}
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-4 pb-4">
          <DashboardActionButton
            onClick={handleSave}
            disabled={saving}
            className="disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save Medical History"}
          </DashboardActionButton>
          {saved ? (
            <p className="text-sm font-medium text-primary">
              Your medical history has been saved.
            </p>
          ) : null}
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function SectionHeading({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-primary/15 text-foreground/80 hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2.5 border-b border-primary/8 pb-5 last:border-b-0 last:pb-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/15 text-foreground/80 hover:bg-muted",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NotificationsPage() {
  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <div className="flex items-center gap-3">
          <DashboardBackLink href="/dashboard" ariaLabel="Back to dashboard" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Notifications
          </h1>
        </div>
        {/* Phase 6 — live inbox backed by `/me/notifications`. The component
        owns its own data fetching + pagination so this page stays a thin
        layout wrapper. */}
        <NotificationsInbox />
      </DashboardContainer>
    </DashboardPage>
  );
}

type AccountModal = null | "edit-nickname" | "reset-password" | "delete-account";

export function AccountSettingsPage() {
  const { user, isLoading: authLoading } = useDashboardAuth();
  const { refreshMe } = useDashboardMe();
  const profile = useDashboardProfile();
  const defaultNickname = getProfileName(profile) || "User";
  const [nicknameOverride, setNicknameOverride] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<AccountModal>(null);
  const [passwordResetDone, setPasswordResetDone] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const accountEmail = user?.email ?? null;
  const displayUserId = authLoading ? "…" : (user?.id ?? "—");
  const displayEmail = authLoading ? "…" : (accountEmail ?? "—");
  const localNickname = nicknameOverride ?? defaultNickname;
  const resetPasswordEmail = accountEmail ?? "";

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-8">
          <div className="flex items-center gap-3">
            <DashboardBackLink href="/dashboard" ariaLabel="Back to dashboard" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account Settings</h1>
          </div>

          <DashboardPanel className="divide-y divide-primary/10 bg-white p-0">
            <section className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
              <h2 className="text-lg font-semibold text-foreground">User details</h2>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  User ID:{" "}
                  <span className="text-foreground/80 font-mono text-xs sm:text-sm">
                    {displayUserId}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Email: <span className="text-foreground/80">{displayEmail}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Email change is not available yet. Contact support if you need to update
                  the address on your account.
                </p>
                <p className="text-muted-foreground">
                  Subscription plan:{" "}
                  <span className="rounded-full bg-primary/15 px-3 py-0.5 text-[0.625rem] font-semibold uppercase leading-none tracking-wide text-primary sm:text-xs">
                    Free
                  </span>
                </p>
              </div>
            </section>

            <section className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted-foreground">
                    Nickname:{" "}
                    <span className="text-foreground/80">{localNickname}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenModal("edit-nickname")}
                    className="text-sm font-semibold text-primary/95 transition-colors hover:text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted-foreground">Password</p>
                  <button
                    type="button"
                    onClick={() => setOpenModal("reset-password")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/95 transition-colors hover:text-primary hover:underline"
                  >
                    Reset
                  </button>
                </div>
                {passwordResetDone ? (
                  <p className="text-sm font-medium text-primary">
                    Password reset link has been sent to your email.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-3 px-5 py-6 sm:px-8 sm:py-8">
              <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
              <p className="text-sm text-muted-foreground">
                Permanently remove your account and all related data from our platform.
              </p>
              <button
                type="button"
                onClick={() => setOpenModal("delete-account")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-destructive transition-colors hover:opacity-80 hover:underline"
              >
                <Trash2 className="size-4" />
                Delete Account
              </button>
            </section>
          </DashboardPanel>
        </DashboardContainer>
      </DashboardPage>

      {openModal === "edit-nickname" ? (
        <AccountSettingsModal
          title="Edit Nickname"
          onClose={() => {
            setNicknameError(null);
            setOpenModal(null);
          }}
        >
          <EditNicknameForm
            currentNickname={localNickname}
            isSaving={nicknameSaving}
            error={nicknameError}
            onSave={async (nextNickname) => {
              setNicknameError(null);
              setNicknameSaving(true);
              try {
                await patchMeProfile({ preferredName: nextNickname });
                await refreshMe();
                setNicknameOverride(null);
                setOpenModal(null);
              } catch (e) {
                setNicknameError(
                  userFacingMeError(
                    e,
                    "Could not update your nickname. Please try again.",
                  ),
                );
              } finally {
                setNicknameSaving(false);
              }
            }}
            onCancel={() => {
              setNicknameError(null);
              setOpenModal(null);
            }}
          />
        </AccountSettingsModal>
      ) : null}

      {openModal === "reset-password" ? (
        <AccountSettingsModal
          title="Reset Password"
          onClose={() => setOpenModal(null)}
        >
          <ResetPasswordForm
            email={resetPasswordEmail}
            onConfirm={async () => {
              if (!resetPasswordEmail) {
                throw new Error(
                  "No email is on file for this session. Add an email to your account before resetting your password.",
                );
              }
              await postForgotPassword({ email: resetPasswordEmail });
              setPasswordResetDone(true);
              setOpenModal(null);
            }}
            onCancel={() => setOpenModal(null)}
          />
        </AccountSettingsModal>
      ) : null}

      {openModal === "delete-account" ? (
        <AccountSettingsModal
          title="Delete Account"
          onClose={() => setOpenModal(null)}
        >
          <DeleteAccountForm
            onDelete={async ({ password }) => {
              if (password.trim()) {
                await deleteMeAccount({ password: password.trim() });
              } else {
                await deleteMeAccount({ confirm: "DELETE" });
              }
              clearAccessToken();
              try {
                window.localStorage.removeItem(dashboardProfileStorageKey);
              } catch {
                /* ignore */
              }
              window.location.href = "/signin";
            }}
            onCancel={() => setOpenModal(null)}
          />
        </AccountSettingsModal>
      ) : null}
    </>
  );
}

function AccountSettingsModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_35px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            type="button"
            aria-label={`Close ${title} dialog`}
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditNicknameForm({
  currentNickname,
  isSaving,
  error,
  onSave,
  onCancel,
}: {
  currentNickname: string;
  isSaving?: boolean;
  error?: string | null;
  onSave: (nickname: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(currentNickname);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim()) void onSave(draft.trim());
      }}
      className="space-y-5"
    >
      {error ? (
        <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Nickname</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none ring-primary transition focus:ring-2"
          placeholder="Your nickname"
          required
          disabled={isSaving}
        />
      </label>
      <AccountModalActions
        onCancel={onCancel}
        submitLabel={isSaving ? "Saving…" : "Save"}
        disabled={isSaving}
      />
    </form>
  );
}

function ResetPasswordForm({
  email,
  onConfirm,
  onCancel,
}: {
  email: string;
  /**
   * Should perform the actual API call. Throwing causes the form to display an
   * error message; resolving cleanly closes the modal.
   */
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasEmail = Boolean(email);

  async function handleSubmit() {
    if (!hasEmail || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      setError(
        userFacingAxiosError(
          e,
          "Could not send the reset email. Please try again in a moment.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">
        {hasEmail ? (
          <>
            We will send a password reset link to{" "}
            <span className="font-semibold text-foreground">{email}</span>. Are you sure
            you want to continue?
          </>
        ) : (
          <>
            No email is on file for this session. Add or verify an email in your account
            before using password reset, or contact support.
          </>
        )}
      </p>
      {error ? (
        <p
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <AccountModalActions
        onCancel={onCancel}
        submitLabel={submitting ? "Sending…" : "Send Reset Link"}
        onSubmit={handleSubmit}
        disabled={submitting || !hasEmail}
      />
    </div>
  );
}

function DeleteAccountForm({
  onDelete,
  onCancel,
}: {
  onDelete: (args: { password: string }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirmed = confirmText.toLowerCase() === "delete";

  async function handleDelete() {
    if (!confirmed) return;
    setError(null);
    setSubmitting(true);
    try {
      await onDelete({ password });
    } catch (e) {
      setError(
        userFacingMeError(
          e,
          "Could not delete your account. Check your password or try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">
          This action is <span className="font-semibold text-destructive">permanent</span> and
          cannot be undone. All your data, conversations, and health records will be
          permanently removed.
        </p>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Current password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-primary/15 px-3 text-sm outline-none transition focus:ring-2"
            placeholder="Required for email & password sign-in"
            autoComplete="current-password"
          />
          <span className="text-xs text-muted-foreground">
            If you use Google sign-in only, leave this empty — we will use the confirmation
            below instead.
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Type <span className="font-semibold text-destructive">delete</span> to confirm
          </span>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="h-11 w-full rounded-xl border border-destructive/30 px-3 text-sm outline-none transition focus:ring-2 focus:ring-destructive/30"
            placeholder="delete"
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            void handleDelete();
          }}
          disabled={!confirmed || submitting}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-destructive px-5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Deleting…" : "Delete My Account"}
        </button>
      </div>
    </div>
  );
}

function AccountModalActions({
  onCancel,
  submitLabel,
  onSubmit,
  disabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  onSubmit?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        Cancel
      </button>
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}

