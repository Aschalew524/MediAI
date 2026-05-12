"use client";

import { useEffect, useState } from "react";

import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Hospital,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Star,
  Stethoscope,
} from "lucide-react";

import { isAxiosError, isCancel } from "axios";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import {
  getHealthFacilityById,
  isValidHealthFacilityId,
  type FacilityType,
  type HealthcareFacilityDto,
} from "@/lib/health-facilities-api";
import { cn } from "@/lib/utils";

import {
  DashboardBackLink,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

type DetailState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "notFound"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ok"; facility: HealthcareFacilityDto };

export function FacilityLocatorDetailPage({ facilityId }: { facilityId: string }) {
  const [state, setState] = useState<DetailState>({ kind: "loading" });

  useEffect(() => {
    if (!isValidHealthFacilityId(facilityId)) {
      setState({ kind: "invalid" });
      return;
    }

    const ac = new AbortController();
    setState({ kind: "loading" });

    getHealthFacilityById(facilityId, { signal: ac.signal })
      .then((facility) => {
        setState({ kind: "ok", facility });
      })
      .catch((e: unknown) => {
        if (isCancel(e)) return;
        if (isAxiosError(e) && e.response?.status === 404) {
          setState({
            kind: "notFound",
            message: getFriendlyAxiosMessage(
              e,
              "Nothing was found for this request. The facility may have been removed or is not published.",
            ),
          });
          return;
        }
        if (isAxiosError(e) && e.response?.status === 400) {
          setState({
            kind: "error",
            message: getFriendlyAxiosMessage(e, "This facility link is not valid."),
          });
          return;
        }
        setState({
          kind: "error",
          message: getFriendlyAxiosMessage(e, "Something went wrong loading this facility."),
        });
      });

    return () => {
      ac.abort();
    };
  }, [facilityId]);

  if (state.kind === "loading" || state.kind === "invalid" || state.kind === "notFound" || state.kind === "error") {
    return (
      <DashboardPage>
        <DashboardContainer className="space-y-5">
          <DashboardBackLink
            href="/dashboard/facility-locator"
            ariaLabel="Back to facility locator"
          />

          {state.kind === "loading" ? (
            <DashboardPanel className="px-6 py-10">
              <p className="text-sm text-muted-foreground">Loading facility…</p>
            </DashboardPanel>
          ) : null}

          {state.kind === "invalid" ? (
            <DashboardPanel className="px-6 py-8">
              <p className="text-sm text-foreground">
                This link does not look like a valid facility id (for example{" "}
                <span className="font-mono text-xs">fac-001</span>). Return to the locator to pick a
                facility.
              </p>
            </DashboardPanel>
          ) : null}

          {state.kind === "notFound" ? (
            <DashboardPanel className="px-6 py-8">
              <p className="text-sm text-foreground">{state.message}</p>
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

  const facility = state.facility;
  const phoneRaw = facility.phone?.trim();
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(facility.name + ", " + facility.address)}&z=15&output=embed`;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Facility details"
          backHref="/dashboard/facility-locator"
          backAriaLabel="Back to facility locator"
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <DashboardPanel className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <FacilityIcon type={facility.type} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                      {facility.name}
                    </h1>
                    {facility.verified ? (
                      <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {facility.address}
                  </p>
                </div>
              </div>
              <FacilityTypeBadge type={facility.type} />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {facility.rating != null ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                  <Star className="size-4 text-amber-500" />
                  {facility.rating.toFixed(1)}
                </span>
              ) : null}
              {phoneRaw ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  {phoneRaw}
                </span>
              ) : null}
              {facility.openNow === undefined ? (
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Clock className="size-4" />
                  Hours unknown
                </span>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5 font-medium",
                    facility.openNow ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  <Clock className="size-4" />
                  {facility.openNow ? "Open now" : "Closed"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
              >
                <Navigation className="size-3.5" />
                Get directions
              </a>
              {phoneRaw ? (
                <a
                  href={`tel:${phoneRaw.replace(/\s/g, "")}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <Phone className="size-3.5" />
                  Call
                </a>
              ) : null}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + " " + facility.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-3.5" />
                View on Maps
              </a>
            </div>
          </DashboardPanel>

          <DashboardPanel className="overflow-hidden p-0">
            <div className="relative aspect-4/3 w-full min-h-[240px] lg:aspect-auto lg:min-h-[320px]">
              <iframe
                title="Facility location map"
                className="absolute inset-0 size-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapEmbed}
              />
            </div>
          </DashboardPanel>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function FacilityTypeBadge({ type }: { type: FacilityType }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase leading-none tracking-wide sm:text-xs",
        type === "hospital" && "bg-primary/10 text-primary",
        type === "pharmacy" && "bg-emerald-50 text-emerald-600",
        type === "clinic" && "bg-amber-50 text-amber-600",
      )}
    >
      {type}
    </span>
  );
}

function FacilityIcon({ type }: { type: FacilityType }) {
  const cls = "size-5";
  switch (type) {
    case "hospital":
      return <Hospital className={cls} />;
    case "pharmacy":
      return <Pill className={cls} />;
    case "clinic":
      return <Stethoscope className={cls} />;
  }
}
