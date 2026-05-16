"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  Link2,
  Loader2,
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
import {
  getTopDoctorById,
  getTopDoctorSpecialties,
  isBadRequestError,
  isNotFoundError,
  isValidTopDoctorId,
  listTopDoctors,
} from "@/lib/top-doctors-api";
import { type ConsultationType, type TopDoctor } from "@/lib/top-doctors-content";

import {
  DashboardActionButton,
  DashboardBackLink,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

const LIST_PAGE_SIZE = 20;

export function TopDoctorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [specialties, setSpecialties] = useState<string[] | null>(null);
  const [specialtiesErrorMessage, setSpecialtiesErrorMessage] = useState<string | null>(null);

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
    const id = ++listReq.current;
    setListLoading(true);
    setListError(null);

    listTopDoctors({
      page: 1,
      pageSize: LIST_PAGE_SIZE,
      specialty: selectedSpecialty,
      q: debouncedQ || undefined,
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
  }, [debouncedQ, selectedSpecialty]);

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
  }, [debouncedQ, items.length, listLoading, moreLoading, page, selectedSpecialty, total]);

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
          <DashboardPanel className="px-6 py-8">
            <p className="text-sm text-muted-foreground">
              No doctors match your filters. Try a different search or clear the search box to see
              everyone.
            </p>
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
  return (
    <Link
      href={`/dashboard/top-doctors/${doctor.id}`}
      className="block rounded-[1.75rem] border border-primary/20 bg-white p-3 shadow-[0_16px_40px_-34px_rgba(76,104,220,0.6)] transition-all hover:-translate-y-px"
    >
      <DoctorImage
        src={doctor.heroImageUrl}
        alt={`${doctor.name} portrait`}
        className="aspect-[4/3] w-full rounded-2xl"
      />

      <div className="space-y-1 px-3 pb-3 pt-3">
        <h3 className="text-lg font-semibold tracking-tight">{doctor.name}</h3>
        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
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
  const [state, setState] = useState<BiographyState>({ kind: "loading" });
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>("video");
  const [recentConsultation, setRecentConsultation] = useState<BillingConsultation | null>(null);
  const invalidDoctorId = !isValidTopDoctorId(doctorId);

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
                      {recentConsultation.consultationType === "video" ? "Video" : "Written"} consultation
                      at {recentConsultation.consultationFeeDisplay}
                    </p>
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

  const feeForSelectedType =
    selectedType === "video"
      ? doctor.consultationFees.video
      : doctor.consultationFees.written;
  const canPaySelected = feeForSelectedType > 0;

  useEffect(() => {
    setPaymentError(null);
  }, [selectedType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_35px_120px_-50px_rgba(0,0,0,0.55)] sm:p-6 md:p-8">
        <button
          type="button"
          aria-label="Close consultation modal"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-2 pt-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Choose for consultation</h2>
          <p className="text-sm text-muted-foreground">
            Create a consultation request, then continue to Chapa checkout to confirm payment.
          </p>
        </div>

        <form
          className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_1fr]"
          onSubmit={async (event) => {
            event.preventDefault();
            setPaymentError(null);
            if (!canPaySelected) {
              setPaymentError(
                selectedType === "video"
                  ? "This doctor has not set a video consultation fee (ETB) yet. They can add it under Dashboard → Doctor verification → Edit profile (?edit=1)."
                  : "This doctor has not set a written consultation fee (ETB) yet. They can add it under Dashboard → Doctor verification → Edit profile (?edit=1).",
              );
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
              const booking = await createConsultationBooking({
                topDoctorId: doctor.id,
                consultationType: selectedType,
                patientNotes: details || undefined,
              });
              const payment = await initiateConsultationPayment(booking.id);
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
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </ConsultationField>

            {!canPaySelected ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
                Paid checkout is unavailable for this consultation type until the doctor publishes a positive fee (whole ETB) on their public profile.
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
              disabled={submitting || !canPaySelected}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Redirecting to payment…
                </>
              ) : (
                "Go to payment"
              )}
            </button>
          </div>
        </form>
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

  if (isRemote) {
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
