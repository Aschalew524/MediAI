"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import Link from "next/link";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
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
  type DashboardProfile,
  type MeasurementSystem,
  type MedicalHistoryData,
  activityOptions,
  alcoholOptions,
  defaultMedicalHistory,
  dietOptions,
  getProfileName,
  getProfileSex,
  sleepOptions,
  smokingOptions,
  stressOptions,
} from "@/lib/dashboard-content";
import {
  type ApiPatientDetail,
  type PatchPatientProfileBody,
  patchProfessionalPatientProfile,
  putProfessionalPatientMedicalHistory,
} from "@/lib/services/professional-api";
import { cn } from "@/lib/utils";

import { ProfessionalDashboardShell } from "./professional-shell";

type DetailSectionId =
  | "patientHistory"
  | "familyHistory"
  | "currentMedications"
  | "pastMedications"
  | "surgicalHistory"
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
  currentMedications: "Current Medications",
  pastMedications: "Past Medications (last 6 months)",
  surgicalHistory: "Surgical History",
  allergies: "Allergies",
};

/**
 * Maps each accordion section to the medical-history fields it owns. Some
 * sections also display "context chips" (selections the patient ticked)
 * which the doctor doesn't edit through this UI.
 */
const sectionFields: Record<
  DetailSectionId,
  {
    detailsField: keyof MedicalHistoryData;
    chipsField?: keyof MedicalHistoryData;
  }
> = {
  patientHistory: {
    detailsField: "chronicDetails",
    chipsField: "chronicDiseases",
  },
  familyHistory: {
    detailsField: "familyHistoryDetails",
    chipsField: "familyHistory",
  },
  currentMedications: { detailsField: "currentMedications" },
  pastMedications: { detailsField: "pastMedications" },
  surgicalHistory: { detailsField: "surgicalHistory" },
  allergies: { detailsField: "allergyDetails", chipsField: "allergies" },
};

const SECTION_ORDER: DetailSectionId[] = [
  "patientHistory",
  "familyHistory",
  "allergies",
  "surgicalHistory",
  "currentMedications",
  "pastMedications",
];

/**
 * Renders the doctor-facing profile of one patient.
 *
 * `viewerProfile` is the *logged-in doctor* (used for the sidebar shell), and
 * `patient` + `patientId` describe the patient being viewed. Edits made
 * through the modals call the real `/professional/patients/:id/...` endpoints,
 * which writes to the patient's own `UserProfile` so they show up on the
 * patient side immediately on next load.
 *
 * `patientEmail` is shown verbatim instead of being synthesized from the
 * patient's name, which fixes the long-standing "all patients share the same
 * dummy email" bug.
 */
export function ProfessionalPatientProfilePage({
  viewerProfile,
  patient,
  patientId,
  patientEmail,
  medicalHistory: rawMedicalHistory,
  lastUpdatedAt,
  onPatientUpdated,
}: {
  viewerProfile: DashboardProfile;
  patient: DashboardProfile;
  patientId: string;
  patientEmail: string;
  medicalHistory: Record<string, unknown> | null;
  lastUpdatedAt: string;
  onPatientUpdated: (next: ApiPatientDetail) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submittingModal, setSubmittingModal] = useState<OpenModal>(null);
  const [expandedSection, setExpandedSection] = useState<DetailSectionId | null>(
    null,
  );

  // Merge with defaults so we always have every key present in the JSON
  // (existing patients who registered before the schema gained fields like
  // `surgicalHistory` would otherwise show `undefined` here).
  const medicalHistory: MedicalHistoryData = useMemo(
    () => ({ ...defaultMedicalHistory, ...(rawMedicalHistory ?? {}) }),
    [rawMedicalHistory],
  );

  const lifestyleItems = useMemo(() => {
    const fallback = (s: string) => (s.trim().length > 0 ? s : "—");
    return [
      {
        label: "Daily smoking intensity",
        value: fallback(medicalHistory.smokingIntensity),
      },
      {
        label: "Weekly alcohol intake",
        value: fallback(medicalHistory.alcoholIntake),
      },
      {
        label: "Dietary habits",
        value: fallback(medicalHistory.dietaryHabits),
      },
      {
        label: "Weekly activity level",
        value: fallback(medicalHistory.activityLevel),
      },
      {
        label: "Daily sleep pattern",
        value: fallback(medicalHistory.sleepPattern),
      },
      { label: "Stress level", value: fallback(medicalHistory.stressLevel) },
    ];
  }, [medicalHistory]);

  const vitalItems = [
    { label: "BMI", value: formatBodyMassIndex(patient) },
    { label: "Weight", value: formatWeightForVitals(patient) },
    { label: "Height", value: formatHeightForVitals(patient) },
  ];

  /**
   * Wraps an API call: pushes the returned `ApiPatientDetail` up to the
   * parent (which re-renders this component with the new props), surfaces
   * server errors, and toggles the per-modal "Saving…" state.
   */
  async function persistChange(
    modal: OpenModal,
    request: () => Promise<ApiPatientDetail>,
  ) {
    setSaveError(null);
    setSubmittingModal(modal);
    try {
      const next = await request();
      onPatientUpdated(next);
      setOpenModal(null);
    } catch (err: unknown) {
      console.error(err);
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ??
          err.message
        : err instanceof Error
          ? err.message
          : "Could not save changes. Please try again.";
      setSaveError(message);
    } finally {
      setSubmittingModal(null);
    }
  }

  function patchProfile(body: PatchPatientProfileBody) {
    return persistChange(openModal, () =>
      patchProfessionalPatientProfile(patientId, body),
    );
  }

  function putMedicalHistory(next: MedicalHistoryData) {
    return persistChange(openModal, () =>
      putProfessionalPatientMedicalHistory(patientId, next),
    );
  }

  const updatedDate = formatUpdatedDate(lastUpdatedAt);

  return (
    <>
      <ProfessionalDashboardShell profile={viewerProfile}>
        {saveError ? (
          <div
            className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-destructive/70 transition-colors hover:text-destructive"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            <span>Back to My patients</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            Home / My patients /{" "}
            <span className="font-semibold text-foreground">Patient profile</span>
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
                    <h1 className="text-3xl font-semibold leading-none text-foreground sm:text-4xl">
                      {getProfileName(patient)}
                    </h1>
                    <p className="text-sm text-foreground/80">
                      {getProfileSex(patient)}, {patient.age || "—"} years
                      {patient.region ? `, ${patient.region}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {patientEmail}
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
                  href={`/dashboard/patients/${patientId}/messages`}
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
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  AI Medical Assistant
                </h2>
                <Link
                  href={`/dashboard/ai-doctor/personal?patient=${patientId}`}
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
                    href={`/dashboard/ai-doctor/history?patient=${patientId}`}
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
              updatedDate={updatedDate}
            />

            <InfoListCard
              id="vitals-section"
              title="Vital Signs"
              actionLabel="Update"
              actionIcon={<RefreshCcw className="size-4" />}
              onAction={() => setOpenModal("vitals")}
              items={vitalItems}
              updatedDate={updatedDate}
            />
          </div>

          <div
            id="health-history-section"
            className="rounded-[1.35rem] border border-primary/15 bg-white shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]"
          >
            {SECTION_ORDER.map((sectionId) => {
              const isExpanded = expandedSection === sectionId;
              const fields = sectionFields[sectionId];
              const detailsValue = readString(medicalHistory, fields.detailsField);
              const chips = fields.chipsField
                ? readList(medicalHistory, fields.chipsField)
                : [];
              const hasContent = detailsValue.length > 0 || chips.length > 0;

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
                    <span className="text-base font-medium text-foreground">
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
                      <div className="space-y-4 rounded-[1.2rem] border border-primary/10 bg-background px-5 py-5">
                        <div className="flex items-center justify-between gap-3">
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

                        {chips.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {chips.map((chip) => (
                              <span
                                key={chip}
                                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {detailsValue ? (
                          <p className="text-sm leading-7 text-foreground/85">
                            {detailsValue}
                          </p>
                        ) : null}

                        {!hasContent ? (
                          <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                            <Database className="size-7" />
                            <span className="text-sm">No data</span>
                          </div>
                        ) : null}
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
          profile={patient}
          isSubmitting={submittingModal === "main-details"}
          onClose={() => {
            if (submittingModal === "main-details") return;
            setOpenModal(null);
          }}
          onSave={(nextMainDetails) => patchProfile(nextMainDetails)}
        />
      ) : null}

      {openModal === "action-history" ? (
        <ActionHistoryModal
          registeredAt={lastUpdatedAt}
          onClose={() => setOpenModal(null)}
        />
      ) : null}

      {openModal === "lifestyle" ? (
        <LifestyleHabitsModal
          medicalHistory={medicalHistory}
          isSubmitting={submittingModal === "lifestyle"}
          onClose={() => {
            if (submittingModal === "lifestyle") return;
            setOpenModal(null);
          }}
          onSave={(nextLifestyle) =>
            putMedicalHistory({ ...medicalHistory, ...nextLifestyle })
          }
        />
      ) : null}

      {openModal === "vitals" ? (
        <VitalSignsModal
          profile={patient}
          isSubmitting={submittingModal === "vitals"}
          onClose={() => {
            if (submittingModal === "vitals") return;
            setOpenModal(null);
          }}
          onSave={(nextVitals) => patchProfile(nextVitals)}
        />
      ) : null}

      {SECTION_ORDER.includes(openModal as DetailSectionId) ? (
        (() => {
          const sectionId = openModal as DetailSectionId;
          const fields = sectionFields[sectionId];
          return (
            <SectionEditorModal
              title={sectionLabels[sectionId]}
              value={readString(medicalHistory, fields.detailsField)}
              isSubmitting={submittingModal === sectionId}
              onClose={() => {
                if (submittingModal === sectionId) return;
                setOpenModal(null);
              }}
              onSave={(value) => {
                setExpandedSection(sectionId);
                return putMedicalHistory({
                  ...medicalHistory,
                  [fields.detailsField]: value,
                });
              }}
            />
          );
        })()
      ) : null}
    </>
  );
}

/**
 * Reads a string field from `medicalHistory` defensively. The JSON might
 * include legacy values written before the schema was tightened, so we coerce
 * to string and trim consistently with how the patient-side form stores it.
 */
function readString(
  history: MedicalHistoryData,
  key: keyof MedicalHistoryData,
): string {
  const v = history[key];
  return typeof v === "string" ? v.trim() : "";
}

function readList(
  history: MedicalHistoryData,
  key: keyof MedicalHistoryData,
): string[] {
  const v = history[key];
  return Array.isArray(v) ? (v as string[]).filter(Boolean) : [];
}

function formatUpdatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  updatedDate,
}: {
  id?: string;
  title: string;
  actionLabel: string;
  actionIcon?: ReactNode;
  onAction: () => void;
  items: { label: string; value: string }[];
  updatedDate: string;
}) {
  return (
    <div
      id={id}
      className="rounded-[1.35rem] border border-primary/15 bg-white px-5 py-5 shadow-[0_26px_70px_-56px_rgba(76,104,220,0.8)]"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
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
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
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
  isSubmitting,
  onClose,
  onSave,
}: {
  profile: DashboardProfile;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (
    nextProfile: Pick<DashboardProfile, "preferredName" | "age" | "sexAtBirth">,
  ) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState({
    preferredName: profile.preferredName,
    age: profile.age,
    sexAtBirth: profile.sexAtBirth ?? "male",
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
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
                    sexAtBirth: event.target.value as
                      | "male"
                      | "female"
                      | "other",
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

          <ModalActions
            onCancel={onClose}
            submitLabel={isSubmitting ? "Saving…" : "Save"}
            disabled={isSubmitting}
          />
        </form>
      </div>
    </ModalFrame>
  );
}

function ActionHistoryModal({
  registeredAt,
  onClose,
}: {
  registeredAt: string;
  onClose: () => void;
}) {
  const formatted = formatTimestamp(registeredAt);
  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="size-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Action History
          </h2>
        </div>

        <div className="relative px-6 py-4">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground sm:text-xl">
              Last update
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{formatted}</p>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type LifestylePatch = Pick<
  MedicalHistoryData,
  | "smokingIntensity"
  | "alcoholIntake"
  | "dietaryHabits"
  | "activityLevel"
  | "sleepPattern"
  | "stressLevel"
>;

function LifestyleHabitsModal({
  medicalHistory,
  isSubmitting,
  onClose,
  onSave,
}: {
  medicalHistory: MedicalHistoryData;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (next: LifestylePatch) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<LifestylePatch>({
    smokingIntensity: medicalHistory.smokingIntensity,
    alcoholIntake: medicalHistory.alcoholIntake,
    dietaryHabits: medicalHistory.dietaryHabits,
    activityLevel: medicalHistory.activityLevel,
    sleepPattern: medicalHistory.sleepPattern,
    stressLevel: medicalHistory.stressLevel,
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-5xl">
      <form onSubmit={submitForm} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Lifestyle and Habits
          </h2>
          <p className="text-sm text-muted-foreground">
            Updates here are written to the patient&rsquo;s medical history and
            appear on their dashboard.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <SelectFormField
            label="Daily Smoking Intensity"
            value={draft.smokingIntensity}
            onChange={(value) =>
              setDraft((current) => ({ ...current, smokingIntensity: value }))
            }
            options={[...smokingOptions]}
          />
          <SelectFormField
            label="Weekly alcohol intake"
            value={draft.alcoholIntake}
            onChange={(value) =>
              setDraft((current) => ({ ...current, alcoholIntake: value }))
            }
            options={[...alcoholOptions]}
          />
          <SelectFormField
            label="Weekly activity level"
            value={draft.activityLevel}
            onChange={(value) =>
              setDraft((current) => ({ ...current, activityLevel: value }))
            }
            options={[...activityOptions]}
          />
          <SelectFormField
            label="Dietary habits"
            value={draft.dietaryHabits}
            onChange={(value) =>
              setDraft((current) => ({ ...current, dietaryHabits: value }))
            }
            options={[...dietOptions]}
          />
          <SelectFormField
            label="Daily sleep pattern"
            value={draft.sleepPattern}
            onChange={(value) =>
              setDraft((current) => ({ ...current, sleepPattern: value }))
            }
            options={[...sleepOptions]}
          />
          <SelectFormField
            label="Stress level"
            value={draft.stressLevel}
            onChange={(value) =>
              setDraft((current) => ({ ...current, stressLevel: value }))
            }
            options={[...stressOptions]}
          />
        </div>

        <ModalActions
          onCancel={onClose}
          submitLabel={isSubmitting ? "Saving…" : "Save"}
          disabled={isSubmitting}
        />
      </form>
    </ModalFrame>
  );
}

function VitalSignsModal({
  profile,
  isSubmitting,
  onClose,
  onSave,
}: {
  profile: DashboardProfile;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (nextProfile: Pick<
    DashboardProfile,
    | "measurementSystem"
    | "heightFeet"
    | "heightInches"
    | "heightCm"
    | "weight"
  >) => void | Promise<void>;
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
    void onSave({
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
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
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

        <ModalActions
          onCancel={onClose}
          submitLabel={isSubmitting ? "Saving…" : "Save"}
          disabled={isSubmitting}
        />
      </form>
    </ModalFrame>
  );
}

function SectionEditorModal({
  title,
  value,
  isSubmitting,
  onClose,
  onSave,
}: {
  title: string;
  value: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (value: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(value);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(draft);
  }

  return (
    <ModalFrame onClose={onClose} maxWidthClassName="max-w-4xl">
      <form onSubmit={submitForm} className="space-y-5">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Edit
        </h2>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`write ${title.toLowerCase()} here...`}
          className="min-h-36 w-full rounded-xl border border-primary/15 px-4 py-4 text-sm outline-none transition-colors focus:border-primary"
        />
        <ModalActions
          onCancel={onClose}
          submitLabel={isSubmitting ? "Saving…" : "Save"}
          disabled={isSubmitting}
        />
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
  disabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/25 px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
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
