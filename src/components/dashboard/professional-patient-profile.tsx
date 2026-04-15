"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Database,
  History,
  MessageCircleMore,
  MoreHorizontal,
  PencilLine,
  RefreshCcw,
  X,
} from "lucide-react";

import {
  dashboardProfileStorageKey,
  type DashboardProfile,
  type MeasurementSystem,
  type ProfessionalProfile,
  getProfileName,
  getProfileSex,
} from "@/lib/dashboard-content";
import { useOnboardingConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  getProfessionalPatient,
  ProfessionalDashboardShell,
} from "./professional-shell";

type DetailSectionId =
  | "patientHistory"
  | "familyHistory"
  | "medicationsHistory"
  | "allergies";

type OpenModal =
  | null
  | "main-details"
  | "action-history"
  | "lifestyle"
  | "vitals"
  | DetailSectionId;

const sectionLabels: Record<DetailSectionId, string> = {
  patientHistory: "Chronic Conditions and Past Medical History",
  familyHistory: "Family Medical History",
  medicationsHistory: "Medication History",
  allergies: "Allergies",
};

const updatedDate = "05 Apr, 2026";

export function ProfessionalPatientProfilePage({
  profile,
}: {
  profile: DashboardProfile;
}) {
  const { data: onboardingConfig } = useOnboardingConfig();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [expandedSection, setExpandedSection] = useState<DetailSectionId | null>(
    null,
  );

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  const patient = getProfessionalPatient(currentProfile, null);
  const professionalProfile = currentProfile.professionalProfile ?? {
    title: "dr",
    fullName: "",
    specialty: "",
    region: currentProfile.region,
  };

  const lifestyleItems = useMemo(
    () => [
      {
        label: "Daily smoking intensity",
        value: professionalProfile.smokingIntensity || "Non-smoker",
      },
      {
        label: "Weekly alcohol intake",
        value: professionalProfile.alcoholIntake || "Occasionally",
      },
      {
        label: "Dietary habits",
        value: professionalProfile.dietaryHabits || "Balanced meals",
      },
      {
        label: "Weekly physical activity level",
        value: professionalProfile.physicalActivity || "Lightly active",
      },
      {
        label: "Daily sleep pattern",
        value: professionalProfile.sleepPattern || "Less than 6 hours",
      },
      {
        label: "Stress level",
        value: professionalProfile.stressLevel || "Rarely stressed",
      },
    ],
    [professionalProfile],
  );

  const vitalItems = [
    {
      label: "BMI",
      value: formatBodyMassIndex(currentProfile),
    },
    {
      label: "Weight",
      value: formatWeightForVitals(currentProfile),
    },
    {
      label: "Height",
      value: formatHeightForVitals(currentProfile),
    },
  ];

  function persistProfile(nextProfile: DashboardProfile) {
    window.localStorage.setItem(
      dashboardProfileStorageKey,
      JSON.stringify(nextProfile),
    );
    setCurrentProfile(nextProfile);
  }

  function updateProfessionalProfile(
    updater: (current: ProfessionalProfile) => ProfessionalProfile,
  ) {
    const nextProfessional = updater(
      currentProfile.professionalProfile ?? {
        title: "dr",
        fullName: "",
        specialty: "",
        region: currentProfile.region,
      },
    );

    persistProfile({
      ...currentProfile,
      professionalProfile: nextProfessional,
    });
  }

  return (
    <>
      <ProfessionalDashboardShell profile={currentProfile}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <span className="text-lg">←</span>
            <span>Go to All Patients</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            Home / Patients /{" "}
            <span className="font-semibold text-foreground">Patient Profile</span>
          </p>
        </div>

        <section className="space-y-4">
          <div className="rounded-[1.45rem] border border-primary/15 bg-white px-6 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="inline-flex size-18 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CircleUserRound className="size-11" />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-1">
                    <h1 className="text-[2rem] font-semibold leading-none text-foreground">
                      {getProfileName(currentProfile)}
                    </h1>
                    <p className="text-sm text-foreground/80">
                      {getProfileSex(currentProfile)}, {currentProfile.age} years ,
                      {" "}
                      {currentProfile.region || "Ethiopian"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {professionalProfile.patientEmail ||
                        `${patient.name.toLowerCase()}@gmail.com`}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <HeaderShortcut
                      title="Health History"
                      onClick={() => scrollToSection("health-history-section")}
                    />
                    <HeaderShortcut
                      title="Lifestyle & Habits"
                      onClick={() => scrollToSection("lifestyle-section")}
                    />
                    <HeaderShortcut
                      title="Vital Signs"
                      onClick={() => scrollToSection("vitals-section")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start">
                <Link
                  href={`/dashboard/ai-doctor/personal?patient=${patient.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
                >
                  <MessageCircleMore className="size-4" />
                  Message
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/6 text-primary transition-colors hover:bg-primary/10"
                    aria-label="Open patient actions"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>

                  {menuOpen ? (
                    <ProfileOptionsMenu
                      onEditMainDetails={() => {
                        setMenuOpen(false);
                        setOpenModal("main-details");
                      }}
                      onActionHistory={() => {
                        setMenuOpen(false);
                        setOpenModal("action-history");
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
            <div className="rounded-[1.35rem] border border-primary/15 bg-white px-5 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[1.7rem] font-semibold text-foreground">
                  AI Medical Assistant
                </h2>
                <Link
                  href={`/dashboard/ai-doctor/personal?patient=${patient.id}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
                >
                  + New Chat
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Conversations
                </p>
                <div className="border-t border-primary/12 pt-4">
                  <p className="text-xl font-semibold text-foreground">General</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last Message : 14, 2026
                  </p>
                </div>
                <div className="border-t border-primary/12 pt-4">
                  <Link
                    href={`/dashboard/ai-doctor/history?patient=${patient.id}`}
                    className="text-sm font-medium text-primary transition-colors hover:underline"
                  >
                    All Conversations
                  </Link>
                </div>
              </div>
            </div>

            <NoDataCard title="Notes" />
          </div>

          <NoDataCard
            title="Biomarkers"
            actionLabel="+ Update"
            onAction={() => {}}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <InfoListCard
              id="lifestyle-section"
              title="Lifestyle & Habit"
              actionLabel="Update"
              actionIcon={<RefreshCcw className="size-4" />}
              onAction={() => setOpenModal("lifestyle")}
              items={lifestyleItems}
            />

            <InfoListCard
              id="vitals-section"
              title="Vital Signs"
              actionLabel="Update"
              actionIcon={<RefreshCcw className="size-4" />}
              onAction={() => setOpenModal("vitals")}
              items={vitalItems}
            />
          </div>

          <div
            id="health-history-section"
            className="rounded-[1.35rem] border border-primary/15 bg-white shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]"
          >
            {(Object.keys(sectionLabels) as DetailSectionId[]).map((sectionId) => {
              const isExpanded = expandedSection === sectionId;
              const value =
                professionalProfile[sectionId] && professionalProfile[sectionId]?.trim()
                  ? professionalProfile[sectionId]?.trim()
                  : "";

              return (
                <div
                  key={sectionId}
                  className="border-b border-primary/10 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSection((current) =>
                        current === sectionId ? null : sectionId,
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  >
                    <span className="text-[1.05rem] font-medium text-foreground">
                      {sectionLabels[sectionId]}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded ? (
                    <div className="px-5 pb-5">
                      <div className="rounded-[1.2rem] border border-primary/10 bg-background px-5 py-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            {sectionLabels[sectionId]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOpenModal(sectionId)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:underline"
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </button>
                        </div>

                        {value ? (
                          <p className="text-sm leading-7 text-foreground/85">
                            {value}
                          </p>
                        ) : (
                          <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                            <Database className="size-7" />
                            <span className="text-sm">No data</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </ProfessionalDashboardShell>

      {openModal === "main-details" ? (
        <EditMainDetailsModal
          profile={currentProfile}
          onClose={() => setOpenModal(null)}
          onSave={(nextMainDetails) => {
            persistProfile({
              ...currentProfile,
              ...nextMainDetails,
            });
            setOpenModal(null);
          }}
        />
      ) : null}

      {openModal === "action-history" ? (
        <ActionHistoryModal onClose={() => setOpenModal(null)} />
      ) : null}

      {openModal === "lifestyle" ? (
        <LifestyleHabitsModal
          profile={professionalProfile}
          smokingIntensityOptions={onboardingConfig.smokingIntensityOptions}
          alcoholIntakeOptions={onboardingConfig.alcoholIntakeOptions}
          physicalActivityOptions={onboardingConfig.physicalActivityOptions}
          dietaryHabitsOptions={onboardingConfig.dietaryHabitOptions}
          sleepPatternOptions={onboardingConfig.sleepPatternOptions}
          stressLevelOptions={onboardingConfig.stressLevelOptions}
          onClose={() => setOpenModal(null)}
          onSave={(nextLifestyle) => {
            updateProfessionalProfile((current) => ({
              ...current,
              ...nextLifestyle,
            }));
            setOpenModal(null);
          }}
        />
      ) : null}

      {openModal === "vitals" ? (
        <VitalSignsModal
          profile={currentProfile}
          onClose={() => setOpenModal(null)}
          onSave={(nextVitals) => {
            persistProfile({
              ...currentProfile,
              ...nextVitals,
            });
            setOpenModal(null);
          }}
        />
      ) : null}

      {(Object.keys(sectionLabels) as DetailSectionId[]).includes(
        openModal as DetailSectionId,
      ) ? (
        <SectionEditorModal
          title={sectionLabels[openModal as DetailSectionId]}
          value={
            professionalProfile[openModal as DetailSectionId]?.trim() || ""
          }
          onClose={() => setOpenModal(null)}
          onSave={(value) => {
            updateProfessionalProfile((current) => ({
              ...current,
              [openModal as DetailSectionId]: value,
            }));
            setExpandedSection(openModal as DetailSectionId);
            setOpenModal(null);
          }}
        />
      ) : null}
    </>
  );
}

function HeaderShortcut({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <div className="border-l border-primary/15 pl-4 first:border-l-0 first:pl-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-2 text-sm font-medium text-primary transition-colors hover:underline"
      >
        View
      </button>
    </div>
  );
}

function ProfileOptionsMenu({
  onEditMainDetails,
  onActionHistory,
}: {
  onEditMainDetails: () => void;
  onActionHistory: () => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-20 w-64 rounded-[1.2rem] border border-primary/15 bg-white p-2 shadow-[0_24px_70px_-40px_rgba(73,96,188,0.8)]">
      <button
        type="button"
        onClick={onEditMainDetails}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <PencilLine className="size-4 text-primary" />
        Edit Main Details
      </button>
      <button
        type="button"
        onClick={onActionHistory}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <History className="size-4 text-primary" />
        Action History
      </button>
    </div>
  );
}

function InfoListCard({
  id,
  title,
  actionLabel,
  actionIcon,
  onAction,
  items,
}: {
  id?: string;
  title: string;
  actionLabel: string;
  actionIcon?: ReactNode;
  onAction: () => void;
  items: { label: string; value: string }[];
}) {
  return (
    <div
      id={id}
      className="rounded-[1.35rem] border border-primary/15 bg-white px-5 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[1.7rem] font-semibold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
        >
          {actionIcon}
          {actionLabel}
        </button>
      </div>

      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-6 border-t border-primary/12 py-5 first:border-t"
          >
            <div>
              <p className="text-lg font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Updated: {updatedDate}
              </p>
            </div>
            <p className="text-lg font-medium text-foreground/70">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoDataCard({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-primary/15 bg-white px-5 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[1.7rem] font-semibold text-foreground">{title}</h2>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Database className="size-9" />
        <span className="text-sm">No data</span>
        {title === "Notes" ? (
          <span className="text-sm">Coming Soon</span>
        ) : null}
      </div>
    </div>
  );
}

function EditMainDetailsModal({
  profile,
  onClose,
  onSave,
}: {
  profile: DashboardProfile;
  onClose: () => void;
  onSave: (nextProfile: Pick<DashboardProfile, "preferredName" | "age" | "sexAtBirth">) => void;
}) {
  const [draft, setDraft] = useState({
    preferredName: profile.preferredName,
    age: profile.age,
    sexAtBirth: profile.sexAtBirth ?? "male",
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[2rem] font-semibold text-foreground">
            Edit Main Details
          </h2>
        </div>

        <form onSubmit={submitForm} className="space-y-5">
          <FormField label="Name *">
            <input
              value={draft.preferredName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  preferredName: event.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-primary/15 px-4 text-sm outline-none transition-colors focus:border-primary"
              required
            />
          </FormField>

          <FormField label="Age">
            <input
              value={draft.age}
              onChange={(event) =>
                setDraft((current) => ({ ...current, age: event.target.value }))
              }
              className="h-12 w-full rounded-xl border border-primary/15 px-4 text-sm outline-none transition-colors focus:border-primary"
              inputMode="numeric"
            />
          </FormField>

          <FormField label="Biological Sex">
            <div className="relative">
              <select
                value={draft.sexAtBirth ?? "male"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sexAtBirth: event.target.value as DashboardProfile["sexAtBirth"],
                  }))
                }
                className="h-12 w-full appearance-none rounded-xl border border-primary/15 bg-white px-4 pr-10 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </FormField>

          <ModalActions onCancel={onClose} submitLabel="Save" />
        </form>
      </div>
    </ModalFrame>
  );
}

function ActionHistoryModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <History className="size-5 text-primary" />
          <h2 className="text-[1.9rem] font-semibold text-foreground">
            Action History
          </h2>
        </div>

        <div className="relative px-6 py-4">
          <div className="absolute left-1/2 top-6 h-20 w-px -translate-x-1/2 bg-primary/30" />
          <div className="grid gap-10 md:grid-cols-2">
            <div className="text-center">
              <p className="text-[1.6rem] font-medium text-foreground">Invited</p>
              <p className="mt-1 text-sm text-muted-foreground">
                05 Apr, 2026, 04:05 PM
              </p>
            </div>
            <div className="text-center">
              <p className="text-[1.6rem] font-medium text-foreground">Created</p>
              <p className="mt-1 text-sm text-muted-foreground">
                05 Apr, 04:37 PM
              </p>
            </div>
          </div>
          <div className="absolute left-1/2 top-[2.15rem] size-3 -translate-x-1/2 rounded-full border border-primary bg-white" />
          <div className="absolute left-1/2 top-[4.7rem] size-3 -translate-x-1/2 rounded-full border border-primary bg-white" />
        </div>
      </div>
    </ModalFrame>
  );
}

function LifestyleHabitsModal({
  profile,
  smokingIntensityOptions,
  alcoholIntakeOptions,
  physicalActivityOptions,
  dietaryHabitsOptions,
  sleepPatternOptions,
  stressLevelOptions,
  onClose,
  onSave,
}: {
  profile: ProfessionalProfile;
  smokingIntensityOptions: string[];
  alcoholIntakeOptions: string[];
  physicalActivityOptions: string[];
  dietaryHabitsOptions: string[];
  sleepPatternOptions: string[];
  stressLevelOptions: string[];
  onClose: () => void;
  onSave: (nextProfile: Pick<
    ProfessionalProfile,
    | "smokingIntensity"
    | "alcoholIntake"
    | "physicalActivity"
    | "dietaryHabits"
    | "sleepPattern"
    | "stressLevel"
  >) => void;
}) {
  const [draft, setDraft] = useState({
    smokingIntensity: profile.smokingIntensity || "",
    alcoholIntake: profile.alcoholIntake || "",
    physicalActivity: profile.physicalActivity || "",
    dietaryHabits: profile.dietaryHabits || "",
    sleepPattern: profile.sleepPattern || "",
    stressLevel: profile.stressLevel || "",
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-5xl">
      <form onSubmit={submitForm} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[1.9rem] font-semibold text-foreground">
            Lifestyle and Habits
          </h2>
          <p className="text-sm font-medium text-foreground">BMI Information</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <SelectFormField
            label="Daily Smoking Intensity (optional)"
            value={draft.smokingIntensity}
            onChange={(value) =>
              setDraft((current) => ({ ...current, smokingIntensity: value }))
            }
            options={smokingIntensityOptions}
          />
          <SelectFormField
            label="Weekly alcohol intake (optional)"
            value={draft.alcoholIntake}
            onChange={(value) =>
              setDraft((current) => ({ ...current, alcoholIntake: value }))
            }
            options={alcoholIntakeOptions}
          />
          <SelectFormField
            label="Weekly physical activity level (optional)"
            value={draft.physicalActivity}
            onChange={(value) =>
              setDraft((current) => ({ ...current, physicalActivity: value }))
            }
            options={physicalActivityOptions}
          />
          <SelectFormField
            label="Dietary habits (optional)"
            value={draft.dietaryHabits}
            onChange={(value) =>
              setDraft((current) => ({ ...current, dietaryHabits: value }))
            }
            options={dietaryHabitsOptions}
          />
          <SelectFormField
            label="Daily sleep pattern (optional)"
            value={draft.sleepPattern}
            onChange={(value) =>
              setDraft((current) => ({ ...current, sleepPattern: value }))
            }
            options={sleepPatternOptions}
          />
          <SelectFormField
            label="Stress level (optional)"
            value={draft.stressLevel}
            onChange={(value) =>
              setDraft((current) => ({ ...current, stressLevel: value }))
            }
            options={stressLevelOptions}
          />
        </div>

        <ModalActions onCancel={onClose} submitLabel="Save" />
      </form>
    </ModalFrame>
  );
}

function VitalSignsModal({
  profile,
  onClose,
  onSave,
}: {
  profile: DashboardProfile;
  onClose: () => void;
  onSave: (nextProfile: Pick<
    DashboardProfile,
    | "measurementSystem"
    | "heightFeet"
    | "heightInches"
    | "heightCm"
    | "weight"
  >) => void;
}) {
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>(
    profile.measurementSystem || "imperial",
  );
  const [heightFeet, setHeightFeet] = useState(profile.heightFeet);
  const [heightInches, setHeightInches] = useState(profile.heightInches);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weight, setWeight] = useState(profile.weight);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      measurementSystem,
      heightFeet: measurementSystem === "imperial" ? heightFeet : "",
      heightInches: measurementSystem === "imperial" ? heightInches : "",
      heightCm: measurementSystem === "metric" ? heightCm : "",
      weight,
    });
  }

  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-5xl">
      <form onSubmit={submitForm} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[1.9rem] font-semibold text-foreground">
            BMI Information
          </h2>
          <p className="text-sm font-medium text-foreground">Unit</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <UnitButton
            selected={measurementSystem === "imperial"}
            onClick={() => setMeasurementSystem("imperial")}
          >
            lbs/ft/in
          </UnitButton>
          <UnitButton
            selected={measurementSystem === "metric"}
            onClick={() => setMeasurementSystem("metric")}
          >
            kg/cm
          </UnitButton>
        </div>

        {measurementSystem === "imperial" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Height">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <input
                    value={heightFeet}
                    onChange={(event) => setHeightFeet(event.target.value)}
                    placeholder="e.g. 5"
                    className="h-12 w-full rounded-xl border border-primary/15 px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <input
                    value={heightInches}
                    onChange={(event) => setHeightInches(event.target.value)}
                    placeholder="e.g. 6"
                    className="h-12 w-full rounded-xl border border-primary/15 px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    in
                  </span>
                </div>
              </div>
            </FormField>
            <FormField label="Weight">
              <div className="relative">
                <input
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder="e.g. 155"
                  className="h-12 w-full rounded-xl border border-primary/15 px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  lb
                </span>
              </div>
            </FormField>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Height">
              <div className="relative">
                <input
                  value={heightCm}
                  onChange={(event) => setHeightCm(event.target.value)}
                  placeholder="e.g. 170"
                  className="h-12 w-full rounded-xl border border-primary/15 px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  cm
                </span>
              </div>
            </FormField>
            <FormField label="Weight">
              <div className="relative">
                <input
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder="e.g. 70"
                  className="h-12 w-full rounded-xl border border-primary/15 px-4 pr-12 text-sm outline-none transition-colors focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </FormField>
          </div>
        )}

        <ModalActions onCancel={onClose} submitLabel="Save" />
      </form>
    </ModalFrame>
  );
}

function SectionEditorModal({
  title,
  value,
  onClose,
  onSave,
}: {
  title: string;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-4xl">
      <form onSubmit={submitForm} className="space-y-5">
        <h2 className="text-[1.75rem] font-semibold text-foreground">
          Edit
        </h2>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`write ${title.toLowerCase()} here...`}
          className="min-h-36 w-full rounded-xl border border-primary/15 px-4 py-4 text-sm outline-none transition-colors focus:border-primary"
        />
        <ModalActions onCancel={onClose} submitLabel="Save" />
      </form>
    </ModalFrame>
  );
}

function ModalFrame({
  children,
  onClose,
  maxWidthClassName = "max-w-3xl",
}: {
  children: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full rounded-[1.35rem] bg-white p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.55)]",
          maxWidthClassName,
        )}
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function SelectFormField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <FormField label={label}>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-primary/15 bg-white px-4 pr-10 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </FormField>
  );
}

function UnitButton({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-14 items-center justify-center rounded-2xl border text-base font-medium transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
          : "border-primary/15 bg-primary/90 text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ModalActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/25 px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function formatBodyMassIndex(profile: DashboardProfile) {
  const bmi = calculateBodyMassIndex(profile);
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return "—";
  }

  return bmi.toFixed(2);
}

function calculateBodyMassIndex(profile: DashboardProfile) {
  const weight = Number(profile.weight) || 0;
  if (weight <= 0) return 0;

  if (profile.measurementSystem === "metric") {
    const heightCm = Number(profile.heightCm) || 0;
    if (heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
  }

  const feet = Number(profile.heightFeet) || 0;
  const inches = Number(profile.heightInches) || 0;
  const totalInches = feet * 12 + inches;
  if (totalInches <= 0) return 0;
  return (703 * weight) / (totalInches * totalInches);
}

function formatWeightForVitals(profile: DashboardProfile) {
  if (!profile.weight) return "—";
  return profile.measurementSystem === "metric"
    ? `${profile.weight} kg`
    : `${profile.weight} lb`;
}

function formatHeightForVitals(profile: DashboardProfile) {
  if (profile.measurementSystem === "metric") {
    return profile.heightCm ? `${profile.heightCm} cm` : "—";
  }

  if (!profile.heightFeet && !profile.heightInches) return "—";
  return `${profile.heightFeet || "0"}' ${profile.heightInches || "0"}"`;
}
