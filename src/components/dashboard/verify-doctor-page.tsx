"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldAlert,
  Stethoscope,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { useDashboardMe } from "./dashboard-me-provider";
import {
  listVerificationDocuments,
  patchMeProfile,
  submitProfessionalVerification,
  uploadProfessionalProfilePhoto,
  uploadVerificationDocument,
  userFacingMeError,
  dispatchMeRefresh,
  type VerificationDocumentKind,
  type VerificationDocumentSummary,
} from "@/lib/me-api";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { ProfessionalProfile } from "@/lib/dashboard-content";
import type {
  DoctorVerificationStatus,
  ProfessionalProfile,
} from "@/lib/dashboard-content";
import {
  getTopDoctorMatchOptions,
  type EnumOption,
  type MedicalSpecialty,
} from "@/lib/top-doctors-api";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Form state                                                                 */
/* -------------------------------------------------------------------------- */

type FormState = {
  // Required-at-submit
  fullName: string;
  specialty: string;
  licenseNumber: string;
  yearsOfExperience: string;
  bio: string;

  // Optional public-profile fields
  title: string;
  region: string;
  subSpecialty: string;
  hospitalAffiliation: string;
  licenseAuthority: string;
  educationDegree: string;
  educationYear: string;
  publicationsSummary: string;
  diseases: string; // comma-separated
  videoConsultationFee: string;
  writtenConsultationFee: string;
  heroImageUrl: string;
  experienceItems: { title: string; subtitle: string }[];
  affiliationItems: { title: string; subtitle: string }[];
};

const EMPTY_EXP = { title: "", subtitle: "" };

function profileToFormState(p: ProfessionalProfile | undefined): FormState {
  return {
    fullName: p?.fullName ?? "",
    specialty: p?.specialty ?? "",
    licenseNumber: p?.licenseNumber ?? "",
    yearsOfExperience:
      typeof p?.yearsOfExperience === "number"
        ? String(p.yearsOfExperience)
        : "",
    bio: p?.bio ?? "",
    title: p?.title ?? "dr",
    region: p?.region ?? "",
    subSpecialty: p?.subSpecialty ?? "",
    hospitalAffiliation: p?.hospitalAffiliation ?? "",
    licenseAuthority: p?.licenseAuthority ?? "",
    educationDegree: p?.educationDegree ?? "",
    educationYear: p?.educationYear ?? "",
    publicationsSummary: p?.publicationsSummary ?? "",
    diseases: (p?.diseases ?? []).join(", "),
    videoConsultationFee:
      typeof p?.videoConsultationFee === "number"
        ? String(p.videoConsultationFee)
        : "",
    writtenConsultationFee:
      typeof p?.writtenConsultationFee === "number"
        ? String(p.writtenConsultationFee)
        : "",
    heroImageUrl: p?.heroImageUrl ?? "",
    experienceItems:
      Array.isArray(p?.experienceItems) && p.experienceItems.length > 0
        ? p.experienceItems.map((it) => ({ ...it }))
        : [{ ...EMPTY_EXP }],
    affiliationItems:
      Array.isArray(p?.affiliationItems) && p.affiliationItems.length > 0
        ? p.affiliationItems.map((it) => ({ ...it }))
        : [{ ...EMPTY_EXP }],
  };
}

function formStateToProfessionalProfilePatch(
  s: FormState,
): Record<string, unknown> {
  const yrs = parseInt(s.yearsOfExperience, 10);
  const videoFee = parseInt(s.videoConsultationFee, 10);
  const writtenFee = parseInt(s.writtenConsultationFee, 10);
  return {
    title: s.title.trim() || undefined,
    fullName: s.fullName.trim() || undefined,
    specialty: s.specialty.trim() || undefined,
    region: s.region.trim() || undefined,
    licenseNumber: s.licenseNumber.trim() || undefined,
    yearsOfExperience: Number.isFinite(yrs) && yrs >= 0 ? yrs : undefined,
    bio: s.bio.trim() || undefined,
    subSpecialty: s.subSpecialty.trim() || undefined,
    hospitalAffiliation: s.hospitalAffiliation.trim() || undefined,
    licenseAuthority: s.licenseAuthority.trim() || undefined,
    educationDegree: s.educationDegree.trim() || undefined,
    educationYear: s.educationYear.trim() || undefined,
    publicationsSummary: s.publicationsSummary.trim() || undefined,
    diseases: s.diseases
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0),
    videoConsultationFee:
      Number.isFinite(videoFee) && videoFee >= 0 ? videoFee : undefined,
    writtenConsultationFee:
      Number.isFinite(writtenFee) && writtenFee >= 0 ? writtenFee : undefined,
    heroImageUrl: s.heroImageUrl.trim() || undefined,
    experienceItems: s.experienceItems
      .map((i) => ({ title: i.title.trim(), subtitle: i.subtitle.trim() }))
      .filter((i) => i.title || i.subtitle),
    affiliationItems: s.affiliationItems
      .map((i) => ({ title: i.title.trim(), subtitle: i.subtitle.trim() }))
      .filter((i) => i.title || i.subtitle),
  };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export function VerifyDoctorPage() {
  const { logout } = useDashboardAuth();
  const { profile, isMeLoading, refreshMe } = useDashboardMe();
  const router = useRouter();
  const searchParams = useSearchParams();

  const verification = profile.verification;
  const status = verification?.status ?? "pending";
  const submittedAt = verification?.submittedAt ?? null;
  const reviewedAt = verification?.reviewedAt ?? null;
  const notes = verification?.notes ?? null;

  // When the doctor is auto-redirected here while still unverified, we want to
  // bounce them to /dashboard the moment the admin approves. The user can
  // explicitly visit this page after verification (via the "Public profile"
  // link) — in that case `?edit=1` is set and we stay on the page so they can
  // update their info.
  const isExplicitEditMode = (searchParams?.get("edit") ?? "") === "1";
  useEffect(() => {
    if (status !== "verified") return;
    if (isExplicitEditMode) return;
    router.replace("/dashboard");
  }, [status, isExplicitEditMode, router]);

  // Until status === "verified", the doctor is on this page. We let them edit
  // the form even while "awaiting review" so they can correct typos, but the
  // submit button is disabled until they meaningfully change something to
  // discourage spamming the queue.
  const initial = useMemo(
    () => profileToFormState(profile.professionalProfile),
    [profile.professionalProfile],
  );

  const [form, setForm] = useState<FormState>(initial);
  // Reset form when the server state loads or refreshes underneath us.
  const lastInitialRef = useRef<FormState | null>(null);
  useEffect(() => {
    if (!lastInitialRef.current || isMeLoading) {
      lastInitialRef.current = initial;
      setForm(initial);
    }
  }, [initial, isMeLoading]);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Phase 5 — canonical specialty (separate from the free-text one above).
  // We track this independently so existing form-state plumbing stays
  // simple, and pre-fill from the server's `profile.medicalSpecialty`.
  const [medicalSpecialty, setMedicalSpecialtyLocal] = useState<string>(
    profile?.medicalSpecialty ?? "",
  );
  const [specialtyOptions, setSpecialtyOptions] = useState<
    EnumOption<MedicalSpecialty>[] | null
  >(null);
  useEffect(() => {
    let cancelled = false;
    getTopDoctorMatchOptions()
      .then((res) => {
        if (cancelled) return;
        setSpecialtyOptions(res.medicalSpecialties);
      })
      .catch(() => {
        if (cancelled) return;
        // Non-fatal — the dropdown just hides.
        setSpecialtyOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    // Re-sync when the parent profile refreshes (e.g. after a save).
    setMedicalSpecialtyLocal(profile?.medicalSpecialty ?? "");
  }, [profile?.medicalSpecialty]);

  // Auto-poll while awaiting review so the page flips to verified the moment
  // the admin approves (without requiring a manual refresh).
  useEffect(() => {
    if (status === "verified") return;
    if (!submittedAt || status !== "pending") return;
    const t = window.setInterval(() => {
      void refreshMe();
    }, 15_000);
    return () => window.clearInterval(t);
  }, [status, submittedAt, refreshMe]);

  const isAwaitingReview = status === "pending" && !!submittedAt;
  const isRejected = status === "rejected";
  const isBlocked = status === "blocked";
  const formLocked = isBlocked;
  const canUploadDocuments = status !== "verified" && !isBlocked;

  const [documents, setDocuments] = useState<VerificationDocumentSummary[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploadingKind, setUploadingKind] =
    useState<VerificationDocumentKind | null>(null);

  const refreshDocuments = useCallback(async () => {
    try {
      const items = await listVerificationDocuments();
      setDocuments(items);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const docByKind = useCallback(
    (kind: VerificationDocumentKind) =>
      documents.find((d) => d.kind === kind),
    [documents],
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setExpItem(
    bucket: "experienceItems" | "affiliationItems",
    idx: number,
    field: "title" | "subtitle",
    value: string,
  ) {
    setForm((prev) => {
      const next = [...prev[bucket]];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, [bucket]: next };
    });
  }

  function addExpItem(bucket: "experienceItems" | "affiliationItems") {
    setForm((prev) => ({ ...prev, [bucket]: [...prev[bucket], { ...EMPTY_EXP }] }));
  }

  function removeExpItem(
    bucket: "experienceItems" | "affiliationItems",
    idx: number,
  ) {
    setForm((prev) => ({
      ...prev,
      [bucket]: prev[bucket].length > 1
        ? prev[bucket].filter((_, i) => i !== idx)
        : prev[bucket],
    }));
  }

  // Required-at-submit validation. We mirror the server-side rules so the
  // doctor sees the gap before the round-trip.
  function validateRequired(): string[] {
    const missing: string[] = [];
    if (!form.fullName.trim()) missing.push("Full name");
    if (!form.specialty.trim()) missing.push("Specialty");
    if (!form.licenseNumber.trim()) missing.push("License number");
    if (!form.bio.trim()) missing.push("Professional bio");
    const yrs = parseInt(form.yearsOfExperience, 10);
    if (!Number.isFinite(yrs) || yrs < 0) missing.push("Years of experience");
    if (!docByKind("medical_license")) missing.push("Medical license document");
    if (!docByKind("degree")) missing.push("Degree / diploma document");
    return missing;
  }

  async function handleDocumentUpload(
    kind: VerificationDocumentKind,
    file: File,
  ) {
    setError(null);
    setUploadingKind(kind);
    try {
      await uploadVerificationDocument(kind, file);
      await refreshDocuments();
      setSuccess(
        kind === "medical_license"
          ? "License document uploaded."
          : "Degree document uploaded.",
      );
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(userFacingMeError(err, "Could not upload document."));
    } finally {
      setUploadingKind(null);
    }
  }

  async function saveDraft(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await patchMeProfile({
        professionalProfile: formStateToProfessionalProfilePatch(form),
        // Phase 5 — only send when the doctor actually picked something;
        // null/empty leaves the server column as-is (backend ignores
        // empty strings via its enum validation).
        medicalSpecialty: medicalSpecialty || undefined,
      });
      dispatchMeRefresh();
      setSuccess("Saved.");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(userFacingMeError(err, "Could not save your information."));
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview(e?: FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);
    const missing = validateRequired();
    if (missing.length > 0) {
      setError(`Please fill: ${missing.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    try {
      // Save current edits first so the verification packet on the server is
      // up-to-date before we flip the status flag.
      await patchMeProfile({
        professionalProfile: formStateToProfessionalProfilePatch(form),
        medicalSpecialty: medicalSpecialty || undefined,
      });
      await submitProfessionalVerification();
      dispatchMeRefresh();
      setSuccess("Submitted for verification. We'll notify you once approved.");
    } catch (err) {
      setError(
        userFacingMeError(
          err,
          "Could not submit your verification packet. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-background px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Header
          status={status}
          submittedAt={submittedAt}
          reviewedAt={reviewedAt}
          onSignOut={() => {
            logout();
          }}
        />

        {isAwaitingReview ? (
          <AwaitingReviewBanner submittedAt={submittedAt} />
        ) : isBlocked ? (
          <BlockedBanner notes={notes} reviewedAt={reviewedAt} />
        ) : isRejected ? (
          <RejectedBanner notes={notes} reviewedAt={reviewedAt} />
        ) : (
          <DraftIntroBanner />
        )}

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}
        {success ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-300/50 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {success}
          </div>
        ) : null}

        <form
          onSubmit={submitForReview}
          className={cn(
            "space-y-6 rounded-3xl border border-primary/15 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(76,104,220,0.4)] sm:p-8",
            formLocked && "pointer-events-none opacity-60",
          )}
        >
          <SectionHeader
            icon={<Stethoscope className="size-5" />}
            title="Required information"
            description="The bare minimum we need to verify your professional credentials."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" htmlFor="fullName">
              <input
                id="fullName"
                value={form.fullName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setField("fullName", e.target.value)
                }
                className={inputClass}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Title" htmlFor="title">
              <select
                id="title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className={inputClass}
              >
                <option value="dr">Dr.</option>
                <option value="prof">Prof.</option>
                <option value="mr">Mr.</option>
                <option value="ms">Ms.</option>
              </select>
            </Field>
            <Field label="Primary specialty *" htmlFor="specialty">
              <input
                id="specialty"
                value={form.specialty}
                onChange={(e) => setField("specialty", e.target.value)}
                className={inputClass}
                placeholder="e.g. Cardiology"
                required
              />
            </Field>
            <Field
              label="Match category"
              htmlFor="medicalSpecialty"
              hint="We use this to surface you to patients who selected related concerns. Pick the closest match — if you leave it blank we'll guess from your specialty above."
            >
              <select
                id="medicalSpecialty"
                value={medicalSpecialty}
                onChange={(e) => setMedicalSpecialtyLocal(e.target.value)}
                className={inputClass}
                disabled={specialtyOptions === null}
              >
                <option value="">— Auto-detect from specialty —</option>
                {(specialtyOptions ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Years of experience *" htmlFor="yearsOfExperience">
              <DigitsOnlyInput
                id="yearsOfExperience"
                value={form.yearsOfExperience}
                onChange={(v) => setField("yearsOfExperience", v)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="License number *" htmlFor="licenseNumber">
              <input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) => setField("licenseNumber", e.target.value)}
                className={inputClass}
                placeholder="The id printed on your professional license"
                required
              />
            </Field>
            <Field label="Region" htmlFor="region">
              <input
                id="region"
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                className={inputClass}
                placeholder="Where you primarily practice"
              />
            </Field>
          </div>

          <Field label="Professional bio *" htmlFor="bio">
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              className={cn(inputClass, "min-h-[140px]")}
              placeholder="A short summary of your background, what you treat, and how patients can expect to work with you. Use blank lines between paragraphs."
              required
            />
          </Field>

          <SectionHeader
            icon={<FileText className="size-5 opacity-70" />}
            title="Verification documents (required)"
            description="Upload a clear photo or PDF of your medical license and your medical degree. Max 5 MB each (PDF, JPG, or PNG)."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <VerificationDocumentUploadCard
              label="Medical license"
              hint="Must match the license number above."
              kind="medical_license"
              document={docByKind("medical_license")}
              loading={docsLoading}
              uploading={uploadingKind === "medical_license"}
              disabled={!canUploadDocuments}
              onUpload={(file) => void handleDocumentUpload("medical_license", file)}
            />
            <VerificationDocumentUploadCard
              label="Degree / diploma"
              hint="Medical degree or equivalent qualification."
              kind="degree"
              document={docByKind("degree")}
              loading={docsLoading}
              uploading={uploadingKind === "degree"}
              disabled={!canUploadDocuments}
              onUpload={(file) => void handleDocumentUpload("degree", file)}
            />
          </div>

          <SectionHeader
            icon={<Stethoscope className="size-5 opacity-70" />}
            title="Public profile (optional)"
            description="What patients see on your Top Doctors page. You can fill these later — only the section above is required to submit for verification."
            muted
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sub-specialty" htmlFor="subSpecialty">
              <input
                id="subSpecialty"
                value={form.subSpecialty}
                onChange={(e) => setField("subSpecialty", e.target.value)}
                className={inputClass}
                placeholder="e.g. Pediatric Cardiology"
              />
            </Field>
            <Field label="Hospital / clinic affiliation" htmlFor="hospitalAffiliation">
              <input
                id="hospitalAffiliation"
                value={form.hospitalAffiliation}
                onChange={(e) =>
                  setField("hospitalAffiliation", e.target.value)
                }
                className={inputClass}
                placeholder="e.g. St. Paul's Hospital Millennium Medical College"
              />
            </Field>
            <Field label="License authority" htmlFor="licenseAuthority">
              <input
                id="licenseAuthority"
                value={form.licenseAuthority}
                onChange={(e) => setField("licenseAuthority", e.target.value)}
                className={inputClass}
                placeholder="e.g. Ethiopian FMHACA"
              />
            </Field>
            <Field label="Education degree" htmlFor="educationDegree">
              <input
                id="educationDegree"
                value={form.educationDegree}
                onChange={(e) => setField("educationDegree", e.target.value)}
                className={inputClass}
                placeholder="e.g. MD, MBBS, PhD"
              />
            </Field>
            <Field label="Education year" htmlFor="educationYear">
              <DigitsOnlyInput
                id="educationYear"
                value={form.educationYear}
                onChange={(v) => setField("educationYear", v)}
                className={inputClass}
                placeholder="e.g. 2014"
              />
            </Field>
            <Field
              label="Diseases / conditions you treat"
              htmlFor="diseases"
              hint="Comma-separated. Shown as tags on your profile."
            >
              <input
                id="diseases"
                value={form.diseases}
                onChange={(e) => setField("diseases", e.target.value)}
                className={inputClass}
                placeholder="Hypertension, Heart failure, Arrhythmia"
              />
            </Field>
            <Field
              label="Video consultation fee (USD)"
              htmlFor="videoConsultationFee"
            >
              <DigitsOnlyInput
                id="videoConsultationFee"
                value={form.videoConsultationFee}
                onChange={(v) => setField("videoConsultationFee", v)}
                className={inputClass}
                placeholder="e.g. 80"
              />
            </Field>
            <Field
              label="Written consultation fee (USD)"
              htmlFor="writtenConsultationFee"
            >
              <DigitsOnlyInput
                id="writtenConsultationFee"
                value={form.writtenConsultationFee}
                onChange={(v) => setField("writtenConsultationFee", v)}
                className={inputClass}
                placeholder="e.g. 30"
              />
            </Field>
            <ProfilePhotoUploadField
              heroImageUrl={form.heroImageUrl}
              previewUrl={photoPreview}
              uploading={photoUploading}
              inputRef={photoInputRef}
              onPick={() => photoInputRef.current?.click()}
              onFile={async (file) => {
                setError(null);
                setSuccess(null);
                const local = URL.createObjectURL(file);
                setPhotoPreview(local);
                setPhotoUploading(true);
                try {
                  const { heroImageUrl } =
                    await uploadProfessionalProfilePhoto(file);
                  setField("heroImageUrl", heroImageUrl);
                  setPhotoPreview(null);
                  setSuccess("Profile photo uploaded.");
                  dispatchMeRefresh();
                } catch (err) {
                  setPhotoPreview(null);
                  setError(
                    userFacingMeError(err, "Could not upload profile photo."),
                  );
                } finally {
                  setPhotoUploading(false);
                  URL.revokeObjectURL(local);
                }
              }}
            />
          </div>

          <ExperienceListEditor
            label="Professional experience"
            description="Past roles, residencies, fellowships, hospitals where you've practiced."
            items={form.experienceItems}
            onChange={(idx, f, v) => setExpItem("experienceItems", idx, f, v)}
            onAdd={() => addExpItem("experienceItems")}
            onRemove={(idx) => removeExpItem("experienceItems", idx)}
          />

          <ExperienceListEditor
            label="Affiliations"
            description="Boards, professional societies, hospitals you're currently affiliated with."
            items={form.affiliationItems}
            onChange={(idx, f, v) => setExpItem("affiliationItems", idx, f, v)}
            onAdd={() => addExpItem("affiliationItems")}
            onRemove={(idx) => removeExpItem("affiliationItems", idx)}
          />

          <Field label="Publications summary" htmlFor="publicationsSummary">
            <textarea
              id="publicationsSummary"
              value={form.publicationsSummary}
              onChange={(e) =>
                setField("publicationsSummary", e.target.value)
              }
              className={cn(inputClass, "min-h-[120px]")}
              placeholder="Short summary of your publications, talks, etc. (optional)"
            />
          </Field>

          {!formLocked ? (
          <div className="flex flex-col-reverse gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Save draft
            </button>
            <button
              type="submit"
              disabled={submitting || saving}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {isAwaitingReview
                ? "Update & resubmit"
                : isRejected
                ? "Resubmit for verification"
                : "Submit for verification"}
            </button>
          </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bits                                                                       */
/* -------------------------------------------------------------------------- */

const inputClass =
  "block w-full rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-hidden transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function DigitsOnlyInput({
  id,
  value,
  onChange,
  className,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      required={required}
      className={className}
      onChange={(e) => onChange(digitsOnly(e.target.value))}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text");
        onChange(digitsOnly(text));
      }}
    />
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function VerificationDocumentUploadCard({
  label,
  hint,
  kind,
  document,
  loading,
  uploading,
  disabled,
  onUpload,
}: {
  label: string;
  hint: string;
  kind: VerificationDocumentKind;
  document: VerificationDocumentSummary | undefined;
  loading: boolean;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  const inputId = `verification-doc-${kind}`;

  return (
    <div className="rounded-xl border border-primary/15 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading…
        </p>
      ) : document ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span className="font-medium">
              {document.originalName} ({formatBytes(document.byteSize)})
            </span>
          </div>
          {!disabled ? (
            <label
              htmlFor={inputId}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Replace file
              <input
                id={inputId}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onUpload(file);
                }}
              />
            </label>
          ) : null}
        </div>
      ) : (
        <label
          htmlFor={disabled ? undefined : inputId}
          className={cn(
            "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/25 bg-primary/3 px-4 py-6 text-center text-xs text-muted-foreground transition hover:bg-primary/5",
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <Upload className="size-5 text-primary" />
          )}
          {uploading ? "Uploading…" : "Choose file"}
          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUpload(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

function Header({
  status,
  submittedAt,
  reviewedAt,
  onSignOut,
}: {
  status: DoctorVerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  onSignOut: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Stethoscope className="size-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Doctor verification
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to MediAI
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill
          status={status}
          submittedAt={submittedAt}
          reviewedAt={reviewedAt}
        />
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-primary/20 bg-white px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function StatusPill({
  status,
  submittedAt,
  reviewedAt,
}: {
  status: DoctorVerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
}) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="size-3.5" />
        Verified
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
        <XCircle className="size-3.5" />
        Blocked
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
        <XCircle className="size-3.5" />
        Action needed
      </span>
    );
  }
  if (submittedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        <Clock className="size-3.5" />
        Awaiting review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      <ShieldAlert className="size-3.5" />
      Verification needed
    </span>
  );
}

function DraftIntroBanner() {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
      <h2 className="text-base font-semibold text-foreground">
        We need to verify you before you can use MediAI
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in your professional details below and click <strong>Submit for verification</strong>. An admin will review your packet and you'll get
        full access as soon as you're approved. Until then, the rest of the
        dashboard is hidden.
      </p>
    </div>
  );
}

function AwaitingReviewBanner({ submittedAt }: { submittedAt: string | null }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-amber-900">
        <Clock className="size-5" /> Waiting for admin verification
      </h2>
      <p className="mt-1 text-sm text-amber-800/90">
        Thanks — your packet is in review. We'll send you to your dashboard the
        moment you're approved (this page checks every 15 seconds).{" "}
        {submittedAt ? (
          <>
            <span className="text-amber-700/80">
              Submitted {formatRelativeIso(submittedAt)}.
            </span>
          </>
        ) : null}{" "}
        You can edit the fields below if you spotted a mistake — re-submitting
        will move your packet back to the front of the queue.
      </p>
    </div>
  );
}

function BlockedBanner({
  notes,
  reviewedAt,
}: {
  notes: string | null;
  reviewedAt: string | null;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-rose-900">
        <XCircle className="size-5" /> Account blocked
      </h2>
      <p className="mt-1 text-sm text-rose-900/90">
        An administrator blocked your account
        {reviewedAt ? ` ${formatRelativeIso(reviewedAt)}` : ""}. You cannot use
        the dashboard or appear on Top Doctors until an admin unblocks you.
        Contact support if you believe this is a mistake.
      </p>
      {notes ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-900">
          <strong className="font-semibold">Message:</strong>{" "}
          <span className="whitespace-pre-line">{notes}</span>
        </p>
      ) : null}
    </div>
  );
}

function RejectedBanner({
  notes,
  reviewedAt,
}: {
  notes: string | null;
  reviewedAt: string | null;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-amber-950">
        <XCircle className="size-5" /> Verification not approved
      </h2>
      <p className="mt-1 text-sm text-amber-900/90">
        An admin reviewed your packet
        {reviewedAt ? ` ${formatRelativeIso(reviewedAt)}` : ""} and asked for
        changes. Please update the fields below and resubmit.
      </p>
      {notes ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950">
          <strong className="font-semibold">Admin note:</strong>{" "}
          <span className="whitespace-pre-line">{notes}</span>
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  muted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex size-9 items-center justify-center rounded-xl",
          muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ProfilePhotoUploadField({
  heroImageUrl,
  previewUrl,
  uploading,
  inputRef,
  onPick,
  onFile,
}: {
  heroImageUrl: string;
  previewUrl: string | null;
  uploading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFile: (file: File) => void | Promise<void>;
}) {
  const displaySrc =
    previewUrl ?? (heroImageUrl.trim() ? resolveMediaUrl(heroImageUrl) : "");

  return (
    <div className="block space-y-1.5 text-sm sm:col-span-2">
      <span className="font-medium text-foreground">Profile photo</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.04]">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt="Profile preview"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-primary/40">
              <UserRound className="size-12" />
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onFile(file);
            }}
          />
          <button
            type="button"
            onClick={onPick}
            disabled={uploading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] px-5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 disabled:opacity-60"
          >
            <Upload className="size-4 text-primary" />
            {heroImageUrl.trim() ? "Replace photo" : "Upload profile photo"}
          </button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF — max 5 MB. Shown on your public doctor card
            after verification.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function ExperienceListEditor({
  label,
  description,
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  description: string;
  items: { title: string; subtitle: string }[];
  onChange: (idx: number, field: "title" | "subtitle", value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/3 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-xl border border-primary/10 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
          >
            <input
              value={it.title}
              onChange={(e) => onChange(i, "title", e.target.value)}
              className={inputClass}
              placeholder={`${label.toLowerCase()} title`}
            />
            <input
              value={it.subtitle}
              onChange={(e) => onChange(i, "subtitle", e.target.value)}
              className={inputClass}
              placeholder="Year(s) or sub-detail"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={items.length <= 1}
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium text-muted-foreground transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 sm:px-4"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
      >
        + Add another
      </button>
    </div>
  );
}

function formatRelativeIso(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}
