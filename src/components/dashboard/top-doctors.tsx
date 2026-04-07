"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  Link2,
  SquareLibrary,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  doctorSpecialties,
  getTopDoctorById,
  topDoctors,
  type ConsultationType,
  type TopDoctor,
} from "@/lib/top-doctors-content";
import { cn } from "@/lib/utils";

import {
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

export function TopDoctorsPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  const doctors = useMemo(() => {
    if (selectedSpecialty === "all") return topDoctors;
    return topDoctors.filter((doctor) => doctor.specialty === selectedSpecialty);
  }, [selectedSpecialty]);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <div className="space-y-4">
          <DashboardBackTitle title="Choose Top Doctor" />
          <div className="relative max-w-md">
            <select
              value={selectedSpecialty}
              onChange={(event) => setSelectedSpecialty(event.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary"
              aria-label="Filter top doctors by specialty"
            >
              <option value="all">Enter specialty, sub-specialty or disease</option>
              {doctorSpecialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <TopDoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>

        {doctors.length === 0 ? (
          <DashboardPanel className="px-6 py-8">
            <p className="text-sm text-muted-foreground">
              No doctors found for this specialty.
            </p>
          </DashboardPanel>
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
        <p className="text-sm text-muted-foreground">Neurosurgery</p>
      </div>
    </Link>
  );
}

export function TopDoctorBiographyPage({ doctorId }: { doctorId: string }) {
  const doctor = getTopDoctorById(doctorId);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>("video");

  return (
    <>
      <DashboardPage>
        <DashboardContainer className="space-y-5">
          <div className="space-y-2">
            <Link
              href="/dashboard/top-doctors"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              <span className="text-lg">←</span>
              <span>Doctor&apos;s Biography</span>
            </Link>

            <div className="relative max-w-md">
              <select
                defaultValue="all"
                className="h-12 w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 pr-10 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary"
              >
                <option value="all">Enter specialty, sub-specialty or disease</option>
                {doctorSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
            <TopDoctorCard doctor={doctor} />

            <div className="space-y-8 py-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{doctor.name}</h1>
                <p className="text-lg text-foreground">{doctor.role}</p>
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
                  <span>Video consultation: ${doctor.consultationFees.video}</span>
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
                  <span>Written consultation: ${doctor.consultationFees.written}</span>
                </button>
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
              {doctor.biography.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-primary/15 bg-white p-6 shadow-[0_35px_120px_-50px_rgba(0,0,0,0.55)] md:p-8">
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
            Fill out the form below to book a consultation with the chosen medical
            expert. We will contact you for further steps.
          </p>
        </div>

        <form
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]"
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
        >
          <div className="rounded-2xl border border-primary/25 p-4 self-start">
            <DoctorImage
              src={doctor.heroImageUrl}
              alt={`${doctor.name} portrait`}
              className="aspect-[4/3] w-full rounded-xl"
            />

            <div className="space-y-1 px-2 pb-2 pt-4">
              <h3 className="text-2xl font-semibold tracking-tight">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">Neurosurgery</p>
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

            <ConsultationField>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                required
                type="tel"
                placeholder="Number"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                type="text"
                placeholder="City/Country"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <input
                type="text"
                placeholder="Diagnosis"
                className="h-12 w-full rounded-xl border border-primary/20 bg-white px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <ConsultationField>
              <textarea
                rows={4}
                placeholder="Disease Discription"
                className="w-full rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
              />
            </ConsultationField>

            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              Go to Payment
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

  if (failed) {
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

  return (
    <Image
      src={src}
      alt={alt}
      width={900}
      height={675}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
      priority={false}
    />
  );
}
