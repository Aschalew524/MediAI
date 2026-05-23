"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  Link2,
  Loader2,
  MessageCircleMore,
  SquareLibrary,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import {
  getMyBilling,
  createConsultationBooking,
  initiateConsultationPayment,
  userFacingPaymentError,
  type BillingConsultation,
} from "@/lib/payments-api";
import { rememberPendingChapaTxRef } from "@/lib/chapa-pending-tx";
import {
  getTopDoctorById,
  getTopDoctorMatchOptions,
  getTopDoctorSpecialties,
  isBadRequestError,
  isNotFoundError,
  isValidTopDoctorId,
  listTopDoctors,
  type ConditionCategory,
  type EnumOption,
} from "@/lib/top-doctors-api";
import {
  listDoctorAvailabilitySlots,
  type AvailabilitySlot,
} from "@/lib/consultations-api";
import { type ConsultationType, type TopDoctor } from "@/lib/top-doctors-content";
import { startConversationWithDoctor } from "@/lib/services/messages-api";

import { useDashboardProfile } from "./use-dashboard-profile";
import {
  DashboardActionButton,
  DashboardBackLink,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

const LIST_PAGE_SIZE = 20;

/**
 * Phase 4 — render a friendly label for any `ConsultationType`. The legacy
 * `video`/`written` strings keep their classic single-word labels while the
 * Phase 4 additions get descriptive copy.
 */
function consultationKindLabel(value: string): string {
  switch (value) {
    case "video":
      return "Video";
    case "written":
      return "Written";
    case "in_person":
      return "In-person";
    case "hybrid":
      return "Hybrid";
    default:
      return value;
  }
}

export function TopDoctorsPage() {
  const dashboardProfile = useDashboardProfile();
  const savedConditions = useMemo(
    () => (dashboardProfile.primaryConditions ?? []) as ConditionCategory[],
    [dashboardProfile.primaryConditions],
  );

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [specialties, setSpecialties] = useState<string[] | null>(null);
  const [specialtiesErrorMessage, setSpecialtiesErrorMessage] = useState<string | null>(null);

  // Phase 5 — condition chips. Default to whatever the patient saved in
  // their profile (so the page is "smart" the first time they open it),
  // but always show the chip row so they can refine for the current
  // session without touching their profile.
  const [conditionOptions, setConditionOptions] = useState<
    EnumOption<ConditionCategory>[] | null
  >(null);
  const [selectedConditions, setSelectedConditions] = useState<ConditionCategory[]>(
    savedConditions,
  );
  // Reset to the saved set whenever the saved set changes (e.g. patient
  // updates concerns on the medical-history page).
  useEffect(() => {
    setSelectedConditions(savedConditions);
  }, [savedConditions]);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TopDoctor[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const listReq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    getTopDoctorSpecialties()
      .then((s) => {
        setSpecialties(s);
        setSpecialtiesErrorMessage(null);
      })
      .catch((e: unknown) => {
        setSpecialties([]);
        setSpecialtiesErrorMessage(
          getFriendlyAxiosMessage(e, "Specialty list could not be loaded."),
        );
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTopDoctorMatchOptions()
      .then((res) => {
        if (cancelled) return;
        setConditionOptions(res.conditionCategories);
      })
      .catch(() => {
        if (cancelled) return;
        // Soft-fail — the chip row just stays hidden.
        setConditionOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable key for the conditions array so effect deps don't fire on every
  // render (arrays are referentially unstable).
  const conditionsKey = useMemo(
    () => [...selectedConditions].sort().join(","),
    [selectedConditions],
  );

  useEffect(() => {
    const id = ++listReq.current;
    setListLoading(true);
    setListError(null);

    listTopDoctors({
      page: 1,
      pageSize: LIST_PAGE_SIZE,
      specialty: selectedSpecialty,
      q: debouncedQ || undefined,
      conditions: selectedConditions.length > 0 ? selectedConditions : undefined,
    })
      .then((res) => {
        if (id !== listReq.current) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
      })
      .catch((e: unknown) => {
        if (id !== listReq.current) return;
        setListError(
          getFriendlyAxiosMessage(e, "Could not load doctors. Check your connection and try again."),
        );
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (id !== listReq.current) return;
        setListLoading(false);
      });
    // `selectedConditions` ref changes on every render — use the stable key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, selectedSpecialty, conditionsKey]);

  const loadMore = useCallback(async () => {
    if (listLoading || moreLoading || items.length >= total) return;
    const snapshot = listReq.current;
    setMoreLoading(true);
    setListError(null);
    try {
      const next = page + 1;
      const res = await listTopDoctors({
        page: next,
        pageSize: LIST_PAGE_SIZE,
        specialty: selectedSpecialty,
        q: debouncedQ || undefined,
        conditions:
          selectedConditions.length > 0 ? selectedConditions : undefined,
      });
      if (snapshot !== listReq.current) return;
      setPage(next);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e: unknown) {
      if (snapshot !== listReq.current) return;
      setListError(getFriendlyAxiosMessage(e, "Could not load more. Try again."));
    } finally {
      if (snapshot === listReq.current) setMoreLoading(false);
    }
  }, [
    debouncedQ,
    items.length,
    listLoading,
    moreLoading,
    page,
    selectedSpecialty,
    selectedConditions,
    total,
  ]);

  const toggleCondition = useCallback((value: ConditionCategory) => {
    setSelectedConditions((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  }, []);

  const clearConditions = useCallback(() => {
    setSelectedConditions([]);
  }, []);

  const isUsingSavedConditions = useMemo(() => {
    if (savedConditions.length === 0 || selectedConditions.length === 0) {
      return false;
    }
    if (savedConditions.length !== selectedConditions.length) return false;
    const a = [...savedConditions].sort();
    const b = [...selectedConditions].sort();
    return a.every((v, i) => v === b[i]);
  }, [savedConditions, selectedConditions]);

  const hasMore = items.length < total;
  const showEmpty = !listLoading && !listError && items.length === 0;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <div className="space-y-4">
          <DashboardBackTitle title="Choose Top Doctor" />
          <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, specialty, or disease"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 pr-4 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground/80 focus:border-primary"
                aria-label="Search top doctors"
                maxLength={120}
                autoComplete="off"
              />
            </div>
            <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
              <select
                value={selectedSpecialty}
                onChange={(event) => setSelectedSpecialty(event.target.value)}
                disabled={specialties === null}
                className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary disabled:opacity-60"
                aria-label="Filter top doctors by specialty"
              >
                <option value="all">All specialties</option>
                {specialties?.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          {specialtiesErrorMessage ? (
            <p className="text-xs text-muted-foreground">
              {specialtiesErrorMessage} You can still search and browse all specialties.
            </p>
          ) : null}

          {/* Phase 5 — patient-facing condition chips. Hidden until the
              backend's match-options call returns so the row doesn't flash
              a tall layout shift on first render. */}
          {conditionOptions && conditionOptions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground/80">
                  Filter by your concerns
                </p>
                <div className="flex items-center gap-3 text-xs">
                  {savedConditions.length > 0 && !isUsingSavedConditions ? (
                    <button
                      type="button"
                      onClick={() => setSelectedConditions(savedConditions)}
                      className="font-medium text-primary hover:underline"
                    >
                      Use my saved concerns
                    </button>
                  ) : null}
                  {selectedConditions.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearConditions}
                      className="font-medium text-muted-foreground hover:underline"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((opt) => {
                  const selected = selectedConditions.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCondition(opt.value)}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/15 bg-background text-foreground/80 hover:border-primary",
                      )}
                      aria-pressed={selected}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {listError ? (
          <DashboardPanel className="px-6 py-6">
            <p className="text-sm text-destructive">{listError}</p>
          </DashboardPanel>
        ) : null}

        {listLoading && items.length === 0 ? (
          <DashboardPanel className="px-6 py-10">
            <p className="text-sm text-muted-foreground">Loading doctors…</p>
          </DashboardPanel>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((doctor) => (
            <TopDoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>

        {showEmpty ? (
          <DashboardPanel className="space-y-3 px-6 py-8">
            <p className="text-sm text-muted-foreground">
              {selectedConditions.length > 0
                ? "No verified doctors match your selected concerns yet. Try broadening or clearing the chips below."
                : "No doctors match your filters. Try a different search or clear the search box to see everyone."}
            </p>
            {selectedConditions.length > 0 ? (
              <button
                type="button"
                onClick={clearConditions}
                className="self-start text-sm font-medium text-primary hover:underline"
              >
                Show all doctors
              </button>
            ) : null}
          </DashboardPanel>
        ) : null}

        {hasMore && !listLoading && items.length > 0 ? (
          <div className="flex justify-center pb-2">
            <DashboardActionButton
              type="button"
              className="h-10 rounded-lg px-8 text-sm"
              onClick={loadMore}
              disabled={moreLoading}
            >
              {moreLoading ? "Loading…" : "Load more"}
            </DashboardActionButton>
          </div>
        ) : null}
      </DashboardContainer>
    </DashboardPage>
  );
}

function TopDoctorCard({ doctor }: { doctor: TopDoctor }) {
  const showMatchBadge = doctor.matchesConditions === true;
  const showRegionBadge = doctor.inRegion === true;
  return (
    <Link
      href={`/dashboard/top-doctors/${doctor.id}`}
      className="block rounded-[1.75rem] border border-primary/20 bg-white p-3 shadow-[0_16px_40px_-34px_rgba(76,104,220,0.6)] transition-all hover:-translate-y-px"
    >
      <div className="relative">
        <DoctorImage
          src={doctor.heroImageUrl}
          alt={`${doctor.name} portrait`}
          className="aspect-[4/3] w-full rounded-2xl"
        />
        {showMatchBadge || showRegionBadge ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {showMatchBadge ? (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                Matches you
              </span>
            ) : null}
            {showRegionBadge ? (
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                In your region
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-1 px-3 pb-3 pt-3">
        <h3 className="text-lg font-semibold tracking-tight">{doctor.name}</h3>
        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
        {doctor.region ? (
          <p className="text-xs text-muted-foreground">{doctor.region}</p>
        ) : null}
      </div>
    </Link>
  );
}

type BiographyState =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error"; message: string }
  | { kind: "ok"; doctor: TopDoctor };

export function TopDoctorBiographyPage({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const dashboardProfile = useDashboardProfile();
  const isPatientAccount = !dashboardProfile.professionalProfile;
  const [state, setState] = useState<BiographyState>({ kind: "loading" });
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>("video");
  const [recentConsultation, setRecentConsultation] = useState<BillingConsultation | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isStartingMessage, setIsStartingMessage] = useState(false);
  const invalidDoctorId = !isValidTopDoctorId(doctorId);

  async function handleMessageDoctor() {
    if (state.kind !== "ok") return;
    setMessageError(null);
    setIsStartingMessage(true);
    try {
      const { threadId } = await startConversationWithDoctor(state.doctor.id);
      router.push(`/dashboard/messages/${encodeURIComponent(threadId)}`);
    } catch (err: unknown) {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      if (code === 403) {
        setMessageError("Only patient accounts can message doctors.");
      } else if (code === 404) {
        setMessageError("This doctor is not available for messaging.");
      } else if (code === 401) {
        setMessageError("Please sign in to message this doctor.");
      } else {
        setMessageError(
          getFriendlyAxiosMessage(err, "Could not start the conversation. Try again."),
        );
      }
    } finally {
      setIsStartingMessage(false);
    }
  }

  useEffect(() => {
    if (invalidDoctorId) {
      return;
    }
    getTopDoctorById(doctorId)
      .then((doctor) => {
        setState({ kind: "ok", doctor });
      })
      .catch((e: unknown) => {
        if (isNotFoundError(e) || isBadRequestError(e)) {
          setState({ kind: "notFound" });
        } else {
          setState({
            kind: "error",
            message: getFriendlyAxiosMessage(
              e,
              "Something went wrong loading this profile. Try again later.",
            ),
          });
        }
      });
  }, [doctorId, invalidDoctorId]);

  useEffect(() => {
    if (invalidDoctorId) {
      return;
    }
    let cancelled = false;
    void getMyBilling()
      .then((billing) => {
        if (cancelled) return;
        setRecentConsultation(
          billing.recentConsultations.find((item) => item.topDoctorId === doctorId) ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setRecentConsultation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [doctorId, invalidDoctorId]);

  if (invalidDoctorId || state.kind === "loading" || state.kind === "error" || state.kind === "notFound") {
    return (
      <DashboardPage>
        <DashboardContainer className="space-y-5">
          <DashboardBackLink
            href="/dashboard/top-doctors"
            ariaLabel="Back to top doctors"
          />
          {state.kind === "loading" ? (
            <DashboardPanel className="px-6 py-10">
              <p className="text-sm text-muted-foreground">Loading profile…</p>
            </DashboardPanel>
          ) : null}
          {invalidDoctorId ? (
            <DashboardPanel className="px-6 py-8">
              <p className="text-sm text-foreground">
                This link does not look like a valid doctor id. Return to the directory to pick a
                doctor.
              </p>
            </DashboardPanel>
          ) : null}
          {state.kind === "notFound" ? (
            <DashboardPanel className="px-6 py-8">
              <p className="text-sm text-foreground">We could not find this doctor, or the profile is no longer published.</p>
            </DashboardPanel>
          ) : null}
          {state.kind === "error" ? (
            <DashboardPanel className="px-6 py-8">
              <p className="text-sm text-destructive">{state.message}</p>
            </DashboardPanel>
          ) : null}
        </DashboardContainer>
      </DashboardPage>
    );
  }

  const doctor = state.doctor;

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-5">
          <div className="space-y-2">
            <DashboardBackLink
              href="/dashboard/top-doctors"
              ariaLabel="Back to top doctors"
            />

            <div className="max-w-md text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Specialty:</span> {doctor.specialty}
                {doctor.subSpecialty ? (
                  <span>
                    <span className="text-foreground/40"> · </span>
                    {doctor.subSpecialty}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
            <TopDoctorCard doctor={doctor} />

            <div className="space-y-6 py-1 sm:py-2">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{doctor.name}</h1>
                <p className="text-base text-foreground sm:text-lg">{doctor.role}</p>
                <p className="text-sm text-muted-foreground">
                  {doctor.yearsOfExperience} Years of Experiance
                </p>
              </div>

              <div className="space-y-3">
                {isPatientAccount ? (
                  <div className="space-y-2 rounded-2xl border border-primary/15 bg-primary/[0.03] px-4 py-4">
                    <h2 className="text-lg font-semibold">Contact</h2>
                    <p className="text-sm text-muted-foreground">
                      Review this profile, then message the doctor when you are ready.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleMessageDoctor()}
                      disabled={isStartingMessage}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-60"
                    >
                      {isStartingMessage ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MessageCircleMore className="size-4" />
                      )}
                      Message doctor
                    </button>
                    {messageError ? (
                      <p className="text-sm text-destructive" role="alert">
                        {messageError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <h2 className="text-lg font-semibold">Consultation Fees</h2>
                <button
                  type="button"
                  onClick={() => {
                    setConsultationType("video");
                    setConsultationModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-base text-primary underline-offset-4 hover:underline"
                >
                  <Video className="size-4" />
                  <span>Video consultation: ETB {doctor.consultationFees.video}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsultationType("written");
                    setConsultationModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-base text-primary underline-offset-4 hover:underline"
                >
                  <SquareLibrary className="size-4" />
                  <span>Written consultation: ETB {doctor.consultationFees.written}</span>
                </button>
                {recentConsultation ? (
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">
                      Latest booking status: {recentConsultation.status.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {consultationKindLabel(recentConsultation.consultationType)} consultation
                      at {recentConsultation.consultationFeeDisplay}
                    </p>
                    {recentConsultation.meetingLink ? (
                      <a
                        href={recentConsultation.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Open meeting link
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <BiographyInfoCard
            icon={SquareLibrary}
            title="Area of Expertise"
            sections={[
              { label: "Specialty", value: doctor.specialty },
              { label: "Subspecialty", value: doctor.subSpecialty },
              { label: "Diseases", value: doctor.diseases.join(", ") },
            ]}
          />

          <BiographyInfoCard
            icon={BriefcaseBusiness}
            title="Experience"
            sections={[
              { label: "Specialty", value: doctor.specialty },
              { label: "Subspecialty", value: doctor.subSpecialty },
              { label: "Diseases", value: doctor.diseases.join(", ") },
            ]}
          />

          <TimelineCard icon={BriefcaseBusiness} title="Experience" items={doctor.experience} />

          <DashboardPanel className="space-y-4 border-primary/20 px-6 py-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Education</h2>
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium">{doctor.education.degree}</p>
              <p className="text-sm text-muted-foreground">{doctor.education.year}</p>
            </div>
          </DashboardPanel>

          <DashboardPanel className="space-y-4 border-primary/20 px-6 py-5">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Biography</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/95">
              {doctor.biography.map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </DashboardPanel>

          <TimelineCard icon={Link2} title="Affiliations" items={doctor.affiliations} />

          <DashboardPanel className="space-y-4 border-primary/20 px-6 py-5">
            <div className="flex items-center gap-2">
              <SquareLibrary className="size-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Publications</h2>
            </div>
            <p className="text-sm font-medium text-foreground/90">
              {doctor.publicationsSummary}
            </p>
          </DashboardPanel>

          <div className="flex justify-center pb-2 pt-1">
            <DashboardActionButton
              className="h-10 rounded-lg px-8 text-sm"
              onClick={() => {
                setConsultationType("video");
                setConsultationModalOpen(true);
              }}
            >
              Choose for Consultation
            </DashboardActionButton>
          </div>
        </DashboardContainer>
      </DashboardPage>

      {consultationModalOpen ? (
        <VideoConsultationModal
          doctor={doctor}
          consultationType={consultationType}
          onClose={() => setConsultationModalOpen(false)}
        />
      ) : null}
    </>
  );
}

function BiographyInfoCard({
  icon: Icon,
  title,
  sections,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  sections: { label: string; value: string }[];
}) {
  return (
    <DashboardPanel className="space-y-4 border-primary/20 px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="text-sm font-semibold">{section.label}</p>
            <p className="text-sm text-muted-foreground">{section.value}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function TimelineCard({
  icon: Icon,
  title,
  items,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  items: { title: string; subtitle: string }[];
}) {
  return (
    <DashboardPanel className="space-y-4 border-primary/20 px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.title + index} className="space-y-0.5">
            <p className="text-sm font-medium leading-snug">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function VideoConsultationModal({
  doctor,
  consultationType,
  onClose,
}: {
  doctor: TopDoctor;
  consultationType: ConsultationType;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<ConsultationType>(consultationType);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    setPaymentError(null);
    setSelectedSlot(null);
  }, [selectedType]);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    void listDoctorAvailabilitySlots(doctor.id)
      .then((items) => {
        if (!cancelled) setSlots(items);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor.id]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/25 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-modal-title"
    >
      <div className="mx-auto flex min-h-full w-full max-w-4xl items-start justify-center py-2 sm:items-center sm:py-4">
        <div className="relative max-h-[min(92dvh,calc(100vh-2rem))] w-full overflow-y-auto overscroll-contain rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_35px_120px_-50px_rgba(0,0,0,0.55)] sm:p-6 md:p-8">
          <div className="sticky top-0 z-10 -mr-1 flex justify-end bg-white/95 pb-2 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Close consultation modal"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

        <div className="space-y-2 text-center">
          <h2 id="consultation-modal-title" className="text-2xl font-bold tracking-tight">
            Book a consultation
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick an open time slot, then submit your request. The doctor will confirm from their dashboard.
          </p>
        </div>

        <form
          className="mt-6 grid gap-6 pb-2 lg:mt-8 lg:grid-cols-[1fr_1fr]"
          onSubmit={async (event) => {
            event.preventDefault();
            setPaymentError(null);
            if (!selectedSlot) {
              setPaymentError("Choose an available time slot.");
              return;
            }
            setSubmitting(true);
            try {
              const formData = new FormData(event.currentTarget);
              const details = [
                `Full name: ${String(formData.get("fullName") ?? "").trim()}`,
                `Phone: ${String(formData.get("phone") ?? "").trim()}`,
                `Location: ${String(formData.get("location") ?? "").trim()}`,
                `Diagnosis: ${String(formData.get("diagnosis") ?? "").trim()}`,
                `Notes: ${String(formData.get("notes") ?? "").trim()}`,
              ]
                .filter((item) => !item.endsWith(":"))
                .join("\n");
              // Step 1 — create the pending booking row. This locks in the
              // slot and stamps `status: "pending_payment"` server-side.
              const booking = await createConsultationBooking({
                topDoctorId: doctor.id,
                consultationType: selectedType,
                startsAt: selectedSlot,
                patientNotes: details || undefined,
              });
              const payment = await initiateConsultationPayment(booking.id);
              rememberPendingChapaTxRef(payment.txRef);
              window.location.assign(payment.checkoutUrl);
            } catch (error: unknown) {
              setPaymentError(
                userFacingPaymentError(
                  error,
                  "We could not start this consultation payment. Please try again.",
                ),
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="self-start rounded-2xl border border-primary/25 p-4">
            <DoctorImage
              src={doctor.heroImageUrl}
              alt={`${doctor.name} portrait`}
              className="aspect-[4/3] w-full rounded-xl"
            />

            <div className="space-y-1 px-2 pb-2 pt-4">
              <h3 className="text-2xl font-semibold tracking-tight">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>

          <div className="space-y-4">
            <ConsultationField>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as ConsultationType)}
                className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary"
              >
                <option value="video">Video consultation</option>
                <option value="written">Written consultation</option>
                <option value="in_person">In-person visit</option>
                <option value="hybrid">Hybrid (video + in-person follow-up)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </ConsultationField>

            <div className="space-y-2">
              <p className="text-sm font-medium">Available time slots</p>
              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
                  This doctor has not published availability yet. Ask them to set hours under
                  Dashboard → Availability.
                </p>
              ) : (
                <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                  {slots.map((slot) => {
                    const label = new Date(slot.startsAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    const active = selectedSlot === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startsAt)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-primary/20 hover:border-primary/40",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {booked ? (
              <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
                Slot reserved. Redirecting you to secure payment — once payment
                clears, your request will appear on the doctor&apos;s booking
                requests page for approval.
              </p>
            ) : null}

            <ConsultationField>
              <input
                required
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                required
                type="tel"
                name="phone"
                placeholder="Number"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                type="text"
                name="location"
                placeholder="City/Country"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                type="text"
                name="diagnosis"
                placeholder="Diagnosis"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <textarea
                rows={4}
                name="notes"
                placeholder="Disease Discription"
                className="w-full rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            {paymentError ? (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {paymentError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || booked || slots.length === 0}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Reserving slot…
                </>
              ) : booked ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Redirecting to payment…
                </>
              ) : (
                "Continue to payment"
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function ConsultationField({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>;
}

function DoctorImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? "";
  const isRemote = /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:");
  // `next/image` only accepts (a) absolute http(s)/data URLs or (b) paths
  // rooted at "/" (served from /public). Anything else — relative paths
  // like "uploads/foo.png", bare filenames, protocol-relative "//cdn/x"
  // strings — makes the component throw `Failed to construct 'URL': Invalid
  // URL` at render time, which crashes the whole route. Treat those as
  // remote-ish and let the plain <img> tag deal with them (it just 404s
  // gracefully instead of throwing).
  const isPublicAsset = trimmed.startsWith("/");

  if (!trimmed || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[linear-gradient(160deg,rgba(95,118,236,0.18),rgba(255,255,255,1))]",
          className,
        )}
      >
        <UserRound className="size-24 text-primary/45" />
      </div>
    );
  }

  if (isRemote || !isPublicAsset) {
    return (
      <img
        src={trimmed}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      width={900}
      height={675}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
      priority={false}
    />
  );
}
