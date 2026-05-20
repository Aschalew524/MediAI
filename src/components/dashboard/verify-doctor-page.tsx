"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  Stethoscope,
  XCircle,
} from "lucide-react";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { useDashboardMe } from "./dashboard-me-provider";
import {
  patchMeProfile,
  submitProfessionalVerification,
  userFacingMeError,
  dispatchMeRefresh,
} from "@/lib/me-api";
import type { ProfessionalProfile } from "@/lib/dashboard-content";
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
    return missing;
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
          className="space-y-6 rounded-3xl border border-primary/15 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(76,104,220,0.4)] sm:p-8"
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
              <input
                id="yearsOfExperience"
                type="number"
                min={0}
                step={1}
                value={form.yearsOfExperience}
                onChange={(e) => setField("yearsOfExperience", e.target.value)}
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
              <input
                id="educationYear"
                value={form.educationYear}
                onChange={(e) => setField("educationYear", e.target.value)}
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
              <input
                id="videoConsultationFee"
                type="number"
                min={0}
                step={1}
                value={form.videoConsultationFee}
                onChange={(e) =>
                  setField("videoConsultationFee", e.target.value)
                }
                className={inputClass}
                placeholder="e.g. 80"
              />
            </Field>
            <Field
              label="Written consultation fee (USD)"
              htmlFor="writtenConsultationFee"
            >
              <input
                id="writtenConsultationFee"
                type="number"
                min={0}
                step={1}
                value={form.writtenConsultationFee}
                onChange={(e) =>
                  setField("writtenConsultationFee", e.target.value)
                }
                className={inputClass}
                placeholder="e.g. 30"
              />
            </Field>
            <Field
              label="Profile photo URL"
              htmlFor="heroImageUrl"
              hint="Hosted image (https). Leave blank for now if you don't have one."
            >
              <input
                id="heroImageUrl"
                value={form.heroImageUrl}
                onChange={(e) => setField("heroImageUrl", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </Field>
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

function Header({
  status,
  submittedAt,
  reviewedAt,
  onSignOut,
}: {
  status: "pending" | "verified" | "rejected";
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
  status: "pending" | "verified" | "rejected";
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
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
        <XCircle className="size-3.5" />
        Action needed{reviewedAt ? "" : ""}
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

function RejectedBanner({
  notes,
  reviewedAt,
}: {
  notes: string | null;
  reviewedAt: string | null;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-rose-900">
        <XCircle className="size-5" /> Verification not approved
      </h2>
      <p className="mt-1 text-sm text-rose-900/90">
        An admin reviewed your packet
        {reviewedAt ? ` ${formatRelativeIso(reviewedAt)}` : ""} and asked for
        changes. Please update the fields below and resubmit.
      </p>
      {notes ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-900">
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
