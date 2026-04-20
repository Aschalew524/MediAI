"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  Clock,
  ExternalLink,
  Hospital,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Star,
  Stethoscope,
} from "lucide-react";

import {
  healthcareFacilities,
  type FacilityType,
  type HealthcareFacility,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import {
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

type FacilityFilter = "all" | FacilityType;

export function FacilityLocatorPage() {
  const [filter, setFilter] = useState<FacilityFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] =
    useState<HealthcareFacility | null>(null);

  const facilities = useMemo(() => {
    let result = healthcareFacilities;
    if (filter !== "all") {
      result = result.filter((f) => f.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q),
      );
    }
    return result;
  }, [filter, search]);

  const mapCenter = selectedFacility
    ? { lat: selectedFacility.latitude, lng: selectedFacility.longitude }
    : { lat: 9.0192, lng: 38.7525 };

  const mapZoom = selectedFacility ? 15 : 13;

  const mapQuery = selectedFacility
    ? encodeURIComponent(selectedFacility.name + ", " + selectedFacility.address)
    : encodeURIComponent("hospitals and pharmacies in Addis Ababa");

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Healthcare Facility Locator"
          description="Find and navigate to the nearest verified hospitals, clinics, and pharmacies."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or address..."
              className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            {(
              [
                { value: "all", label: "All" },
                { value: "hospital", label: "Hospitals" },
                { value: "pharmacy", label: "Pharmacies" },
                { value: "clinic", label: "Clinics" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-colors",
                  filter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-primary/15 text-foreground/80 hover:bg-muted",
                )}
              >
                <FacilityIcon type={tab.value === "all" ? "hospital" : tab.value} size="sm" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Map */}
          <DashboardPanel className="overflow-hidden p-0">
            <div className="relative aspect-4/3 w-full xl:aspect-auto xl:h-full xl:min-h-[520px]">
              <iframe
                title="Healthcare facilities map"
                className="absolute inset-0 size-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${mapQuery}&z=${mapZoom}&output=embed`}
              />
            </div>
          </DashboardPanel>

          {/* Facility list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-foreground">
                {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
              </p>
              <div className="relative">
                <select
                  className="h-9 appearance-none rounded-lg border border-primary/15 bg-white px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
                  defaultValue="nearest"
                >
                  <option value="nearest">Nearest first</option>
                  <option value="rating">Highest rated</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {facilities.length === 0 ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No facilities match your search.
                  </p>
                </DashboardPanel>
              ) : (
                facilities.map((facility) => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    isSelected={selectedFacility?.id === facility.id}
                    onSelect={() =>
                      setSelectedFacility(
                        selectedFacility?.id === facility.id ? null : facility,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}

function FacilityCard({
  facility,
  isSelected,
  onSelect,
}: {
  facility: HealthcareFacility;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;

  return (
    <DashboardPanel
      className={cn(
        "cursor-pointer space-y-3 px-5 py-4 transition-all hover:-translate-y-px",
        isSelected && "ring-2 ring-primary/30",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <FacilityIcon type={facility.type} size="md" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {facility.name}
                </h3>
                {facility.verified ? (
                  <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                ) : null}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {facility.address}
              </p>
            </div>
          </div>

          <FacilityTypeBadge type={facility.type} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-12 pt-1">
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
            <Star className="size-3 text-amber-500" />
            {facility.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" />
            {facility.phone}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              facility.openNow ? "text-emerald-600" : "text-red-500",
            )}
          >
            <Clock className="size-3" />
            {facility.openNow ? "Open now" : "Closed"}
          </span>
        </div>
      </button>

      {isSelected ? (
        <div className="flex items-center gap-2 border-t border-primary/8 pl-12 pt-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            <Navigation className="size-3" />
            Get Directions
          </a>
          <a
            href={`tel:${facility.phone.replace(/\s/g, "")}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Phone className="size-3" />
            Call
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + " " + facility.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="size-3" />
            View on Maps
          </a>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

function FacilityTypeBadge({ type }: { type: FacilityType }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        type === "hospital" && "bg-primary/10 text-primary",
        type === "pharmacy" && "bg-emerald-50 text-emerald-600",
        type === "clinic" && "bg-amber-50 text-amber-600",
      )}
    >
      {type}
    </span>
  );
}

function FacilityIcon({
  type,
  size = "md",
}: {
  type: FacilityType;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "size-3.5" : "size-4";
  switch (type) {
    case "hospital":
      return <Hospital className={cls} />;
    case "pharmacy":
      return <Pill className={cls} />;
    case "clinic":
      return <Stethoscope className={cls} />;
  }
}
