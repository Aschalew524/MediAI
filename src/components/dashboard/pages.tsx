"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  ClipboardPlus,
  FileText,
  FlaskConical,
  History,
  Pencil,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import {
  dashboardProfileStorageKey,
  type DashboardProfile,
  getProfileHeight,
  getProfileName,
  getProfessionalName,
  getProfileSex,
  getProfileWeight,
} from "@/lib/dashboard-content";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  CompletionRing,
  CompletionBar,
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardListRow,
  DashboardPage,
  DashboardPanel,
} from "./primitives";
import { useDashboardProfile } from "./use-dashboard-profile";

export function DashboardHomePage() {
  const profile = useDashboardProfile();
  const { data: config } = useDashboardConfig();
  const name = getProfileName(profile);

  if (profile.professionalProfile) {
    return <ProfessionalDashboardHomePage profile={profile} />;
  }

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <Link href="/dashboard/profile" className="block transition-transform hover:-translate-y-px">
          <DashboardPanel className="flex items-center justify-between px-6 py-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{name}&rsquo;s</h1>
              <p className="mt-1 text-sm text-muted-foreground">Health Profile</p>
            </div>
            <CompletionRing value={3} />
          </DashboardPanel>
        </Link>

        <div className="grid gap-5 md:grid-cols-2">
          {config.dashboardCards.map((card) => (
            <DashboardShortcutCard
              key={card.title + card.description}
              title={card.title}
              description={card.description}
              href={card.href}
              accent={card.accent}
              muted={"muted" in card ? card.muted : undefined}
            />
          ))}
        </div>

        <DashboardShortcutCard
          title={config.consultDoctorsCard.title}
          description={config.consultDoctorsCard.description}
          href={config.consultDoctorsCard.href}
          accent="doctors"
          wide
        />
      </DashboardContainer>
    </DashboardPage>
  );
}

function ProfessionalDashboardHomePage({
  profile,
}: {
  profile: DashboardProfile;
}) {
  const professionalName = getProfessionalName(profile);
  const [selectedPatient, setSelectedPatient] = useState("");
  const patientOption =
    profile.preferredName.trim() || "Patient profile";

  return (
    <DashboardPage>
      <DashboardContainer className="max-w-7xl px-6 py-1">
        <div className="grid gap-8 lg:grid-cols-[170px_minmax(0,1fr)]">
          <aside className="space-y-8 pt-6">
            <ProfessionalSidebarSection
              title="Patients"
              items={[
                {
                  label: "Patients",
                  href: "/dashboard/profile",
                  icon: <Users className="size-4" />,
                },
              ]}
            />

            <ProfessionalSidebarSection
              title="AI Assistant"
              items={[
                {
                  label: "Clinical Assistant",
                  href: "/dashboard/ai-doctor",
                  icon: <ClipboardPlus className="size-4" />,
                },
                {
                  label: "Research Assistant",
                  href: "/dashboard/ai-doctor/general",
                  icon: <FileText className="size-4" />,
                },
                {
                  label: "Conversation History",
                  href: "/dashboard/ai-doctor/history",
                  icon: <History className="size-4" />,
                },
              ]}
            />

            <ProfessionalSidebarSection
              title="Lab tests and Screenings"
              items={[
                {
                  label: "Add new screening",
                  href: "/dashboard/lab-test-interpretation",
                  icon: <ClipboardPlus className="size-4" />,
                },
                {
                  label: "Previous Tests",
                  href: "/dashboard/lab-test-interpretation",
                  icon: <FileText className="size-4" />,
                },
                {
                  label: "Biomakers Overview",
                  href: "/dashboard/lab-test-interpretation",
                  icon: <FlaskConical className="size-4" />,
                },
              ]}
            />

            <ProfessionalSidebarSection
              items={[
                {
                  label: "Help and support",
                  href: "/dashboard",
                  icon: <CircleHelp className="size-4" />,
                },
              ]}
            />
          </aside>

          <main className="space-y-5">
            <div className="space-y-5 pt-6">
              <h1 className="text-[2.1rem] font-semibold tracking-tight text-foreground">
                👋 Hello {professionalName}!
              </h1>

              <div className="relative">
                <select
                  value={selectedPatient}
                  onChange={(event) => setSelectedPatient(event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-primary/12 bg-white px-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Select a patient or add new</option>
                  <option value={patientOption}>{patientOption}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfessionalDashboardCard
                title="AI Medical Assistant"
                href="/dashboard/ai-doctor"
                visual={<AssistantOrbVisual />}
              />
              <ProfessionalDashboardCard
                title="Lab Tests & Screening"
                href="/dashboard/lab-test-interpretation"
                visual={<LabSheetVisual />}
              />
              <ProfessionalDashboardCard
                title="Medical Notes"
                description="Coming Soon"
                href="#"
                muted
                visual={<NotesVisual />}
              />
              <ProfessionalDashboardCard
                title="Patients"
                href="/dashboard/profile"
                visual={<PatientsVisual />}
              />
            </div>
          </main>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function ProfessionalSidebarSection({
  title,
  items,
}: {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: ReactNode;
  }[];
}) {
  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      ) : null}
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2.5 text-[15px] font-medium text-foreground/90 transition-colors hover:text-primary"
          >
            <span className="text-primary/80">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
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
    <DashboardPanel className="min-h-44 overflow-hidden rounded-[1.2rem] border-primary/20 px-7 py-6 shadow-none">
      <div className="flex h-full items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="max-w-xs text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">
              {muted ? `○ ${description}` : description}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">{visual}</div>
      </div>
    </DashboardPanel>
  );

  if (href === "#") {
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
    <div className="relative flex size-28 items-center justify-center">
      <div className="absolute inset-3 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-[0_24px_80px_-38px_rgba(76,104,220,0.9)]">
        <div className="absolute inset-1 rounded-full bg-primary/6" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-inner">
          <Stethoscope className="size-7" />
        </div>
      </div>
    </div>
  );
}

function LabSheetVisual() {
  return (
    <div className="relative flex size-28 items-center justify-center">
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
    <div className="relative flex size-28 items-center justify-center">
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
    <div className="relative flex size-28 items-center justify-center">
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
  accent: "bot" | "lab" | "doctors";
  muted?: boolean;
  wide?: boolean;
}) {
  const cardContent = (
    <DashboardPanel
      className={cn(
        "group relative overflow-hidden px-6 py-5",
        wide && "min-h-32",
        !wide && "min-h-28",
      )}
    >
      <div className="relative z-10 flex min-h-24 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h2 className="max-w-xs text-xl font-semibold leading-tight">
            {title}
          </h2>
          {description ? (
            <p className="max-w-md text-sm text-muted-foreground">
              {muted ? `○ ${description}` : description}
            </p>
          ) : null}
        </div>
        <VisualAccent accent={accent} title={title} />
      </div>
    </DashboardPanel>
  );

  if (href === "#") return cardContent;

  return (
    <Link href={href} className="block transition-transform hover:-translate-y-px">
      {cardContent}
    </Link>
  );
}

function VisualAccent({ accent, title }: { accent: "bot" | "lab" | "doctors"; title: string }) {
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

  if (accent === "lab") {
    return (
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-3 rounded-full bg-primary/8 blur-2xl" />
        <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(76,104,220,0.7)]">
          <Image
            src="/lab_test.png"
            alt="Health reports icon"
            width={32}
            height={32}
            className="size-8 object-contain"
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
  const [editableProfile, setEditableProfile] = useState<DashboardProfile>(profile);
  const [editModalOpen, setEditModalOpen] = useState(false);

  function openEditModal() {
    setEditableProfile(profile);
    setEditModalOpen(true);
  }

  function handleProfileSave(nextProfile: DashboardProfile) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dashboardProfileStorageKey, JSON.stringify(nextProfile));
    }
    setEditableProfile(nextProfile);
    setEditModalOpen(false);
  }

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <DashboardBackTitle
              title="Health Profile"
              description="Complete your health profile to get valuable insights into your health."
            />
            <CompletionBar value={3} label="Completed" />
          </div>

          <DashboardPanel className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">General Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Health Profile</p>
              </div>
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
            <DashboardPanel className="flex items-center gap-4 px-6 py-5">
              <CompletionRing value={20} size="sm" />
              <h3 className="text-xl font-semibold">Main Health Information</h3>
            </DashboardPanel>
          </Link>

        </DashboardContainer>
      </DashboardPage>

      {editModalOpen ? (
        <EditGeneralInformationModal
          profile={editableProfile}
          onClose={() => setEditModalOpen(false)}
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
}: {
  profile: DashboardProfile;
  onClose: () => void;
  onSave: (profile: DashboardProfile) => void;
}) {
  const [draft, setDraft] = useState<DashboardProfile>(profile);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
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
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 px-5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MainHealthInformationPage() {
  const { data: config } = useDashboardConfig();
  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Main Health Information"
          description="Complete your main health information to personalize your AI Doctor, explore your health risks and get personal checkup plan."
        />

        <DashboardPanel className="px-6 py-4">
          {config.mainHealthInfoSections.map((section) => (
            <DashboardListRow key={section} title={section} />
          ))}
        </DashboardPanel>

        <div className="flex justify-center">
          <DashboardActionButton>Update Health Information</DashboardActionButton>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}
