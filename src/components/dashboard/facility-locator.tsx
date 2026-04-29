"use client";

import { useEffect, useMemo, useReducer, useState } from "react";

import {
  BadgeCheck,
  ChevronDown,
  Clock,
  ExternalLink,
  Hospital,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Star,
  Stethoscope,
} from "lucide-react";

import {
  type FacilityType,
  type HealthcareFacility,
} from "@/lib/dashboard-content";
import {
  listHealthFacilities,
  type ApiFacility,
} from "@/lib/services/facilities-api";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { cn } from "@/lib/utils";

import {
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

type FacilityFilter = "all" | FacilityType;
type SortKey = "nearest" | "rating" | "name";

const ADDIS_ABABA_FALLBACK = { lat: 9.0192, lng: 38.7525 };
const SEARCH_DEBOUNCE_MS = 300;
const PRIMARY_RADIUS_KM = 5;
const FALLBACK_RADIUS_KM = 25;
const LOW_ACCURACY_THRESHOLD_M = 5_000;

type FetchState = {
  isLoading: boolean;
  error: string | null;
  facilities: ApiFacility[];
  selectedId: string | null;
  /** True when the result set was assembled by dropping the radius cap. */
  expandedFromRadius: boolean;
};

type FetchAction =
  | { type: "load:start" }
  | {
      type: "load:success";
      items: ApiFacility[];
      expandedFromRadius: boolean;
    }
  | { type: "load:error"; message: string }
  | { type: "select"; id: string | null };

const initialFetchState: FetchState = {
  isLoading: true,
  error: null,
  facilities: [],
  selectedId: null,
  expandedFromRadius: false,
};

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "load:start":
      return { ...state, isLoading: true, error: null };
    case "load:success": {
      // Drop the selection if the new result set no longer contains it.
      const stillSelected =
        state.selectedId != null &&
        action.items.some((f) => f.id === state.selectedId);
      return {
        isLoading: false,
        error: null,
        facilities: action.items,
        selectedId: stillSelected ? state.selectedId : null,
        expandedFromRadius: action.expandedFromRadius,
      };
    }
    case "load:error":
      return {
        isLoading: false,
        error: action.message,
        facilities: [],
        selectedId: null,
        expandedFromRadius: false,
      };
    case "select":
      return { ...state, selectedId: action.id };
    default:
      return state;
  }
}

export function FacilityLocatorPage() {
  const loc = useUserLocation({ auto: true });

  const [filter, setFilter] = useState<FacilityFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("nearest");

  const [state, dispatch] = useReducer(fetchReducer, initialFetchState);
  const { isLoading, error, facilities, selectedId, expandedFromRadius } =
    state;

  // Debounce the search field so we don't hammer the API on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(id);
  }, [search]);

  // Fetch whenever the inputs the API actually consumes change. When a
  // location is available we first try a geo-bounded query; if that returns
  // nothing we automatically retry without the radius cap so the user always
  // sees the closest results from the directory rather than an empty screen.
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "load:start" });

    const baseParams = {
      type: filter === "all" ? undefined : filter,
      q: debouncedSearch || undefined,
      pageSize: 50,
    };

    const hasGeo =
      loc.status === "ready" && loc.lat != null && loc.lng != null;
    const geo = hasGeo
      ? { lat: loc.lat as number, lng: loc.lng as number }
      : null;

    const primary = geo
      ? { ...baseParams, ...geo, radiusKm: PRIMARY_RADIUS_KM }
      : baseParams;

    listHealthFacilities(primary)
      .then(async (res) => {
        if (cancelled) return res;
        // No geo, or we got results at the primary radius? Use as-is.
        if (!geo || res.items.length > 0) {
          dispatch({
            type: "load:success",
            items: res.items,
            expandedFromRadius: false,
          });
          return res;
        }
        // Geo + empty: widen the search radius before giving up so the user
        // sees something useful instead of an empty screen.
        const fallback = await listHealthFacilities({
          ...baseParams,
          ...geo,
          radiusKm: FALLBACK_RADIUS_KM,
        });
        if (cancelled) return res;
        dispatch({
          type: "load:success",
          items: fallback.items,
          expandedFromRadius: fallback.items.length > 0,
        });
        return fallback;
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({
          type: "load:error",
          message: "We couldn't load nearby facilities. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [filter, debouncedSearch, loc.status, loc.lat, loc.lng]);

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedId) ?? null,
    [facilities, selectedId],
  );

  // Apply client-side sort on top of the server result.
  const sortedFacilities = useMemo(() => {
    const list = [...facilities];
    if (sortBy === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    // "nearest" keeps the server order (which is already by distance when geo is on).
    return list;
  }, [facilities, sortBy]);

  // Map center: selected facility → user location → Addis Ababa fallback.
  const mapCenter = selectedFacility
    ? { lat: selectedFacility.latitude, lng: selectedFacility.longitude }
    : loc.status === "ready" && loc.lat != null && loc.lng != null
      ? { lat: loc.lat, lng: loc.lng }
      : ADDIS_ABABA_FALLBACK;
  const mapZoom = selectedFacility ? 15 : loc.status === "ready" ? 14 : 13;
  const mapQuery = selectedFacility
    ? encodeURIComponent(
        selectedFacility.name + ", " + selectedFacility.address,
      )
    : `${mapCenter.lat},${mapCenter.lng}`;

  const usingGeo =
    loc.status === "ready" && loc.lat != null && loc.lng != null;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Healthcare Facility Locator"
          description="Find and navigate to the nearest verified hospitals, clinics, and pharmacies."
        />

        <LocationBanner
          status={loc.status}
          accuracyM={loc.accuracyM}
          errorMessage={loc.errorMessage}
          onRequest={loc.request}
        />

        {expandedFromRadius && usingGeo ? (
          <DashboardPanel className="border-amber-200/50 bg-amber-50/40 px-5 py-3 text-xs text-foreground/80">
            No facilities found within{" "}
            <span className="font-semibold">{PRIMARY_RADIUS_KM} km</span> of
            your location. Showing results from a wider{" "}
            <span className="font-semibold">{FALLBACK_RADIUS_KM} km</span>{" "}
            radius, sorted by distance.
          </DashboardPanel>
        ) : null}

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
                <FacilityIcon
                  type={tab.value === "all" ? "hospital" : tab.value}
                  size="sm"
                />
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
                {isLoading
                  ? "Searching nearby facilities..."
                  : `${sortedFacilities.length} ${
                      sortedFacilities.length === 1 ? "facility" : "facilities"
                    } found${usingGeo ? " near you" : ""}`}
              </p>
              <div className="relative">
                <select
                  className="h-9 appearance-none rounded-lg border border-primary/15 bg-white px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="nearest">
                    {usingGeo ? "Nearest first" : "Default order"}
                  </option>
                  <option value="rating">Highest rated</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {error ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-destructive">{error}</p>
                </DashboardPanel>
              ) : isLoading ? (
                <DashboardPanel className="flex items-center justify-center px-6 py-10">
                  <LoaderCircle className="size-6 animate-spin text-primary" />
                </DashboardPanel>
              ) : sortedFacilities.length === 0 ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {usingGeo
                      ? "No facilities match your search within this area."
                      : "No facilities match your search."}
                  </p>
                </DashboardPanel>
              ) : (
                sortedFacilities.map((facility) => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    isSelected={selectedId === facility.id}
                    onSelect={() =>
                      dispatch({
                        type: "select",
                        id: selectedId === facility.id ? null : facility.id,
                      })
                    }
                    userLat={usingGeo ? loc.lat : undefined}
                    userLng={usingGeo ? loc.lng : undefined}
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

function LocationBanner({
  status,
  accuracyM,
  errorMessage,
  onRequest,
}: {
  status: ReturnType<typeof useUserLocation>["status"];
  accuracyM?: number;
  errorMessage?: string;
  onRequest: () => void;
}) {
  if (status === "ready") {
    const lowAccuracy =
      accuracyM != null && accuracyM > LOW_ACCURACY_THRESHOLD_M;
    return (
      <DashboardPanel
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3",
          lowAccuracy
            ? "border-amber-200/50 bg-amber-50/40"
            : "border-emerald-200/40 bg-emerald-50/40",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl",
              lowAccuracy
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700",
            )}
          >
            <LocateFixed className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {lowAccuracy
                ? "Showing facilities near a rough estimate of your location"
                : "Showing facilities near your current location"}
            </p>
            <p className="text-xs text-muted-foreground">
              {accuracyM != null
                ? `Accuracy ~${formatAccuracy(accuracyM)}. `
                : ""}
              {lowAccuracy
                ? "Distances may be off. Allow precise location in your browser, or move closer to a window for a better fix, then click Refresh."
                : "We don't store your coordinates."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRequest}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Refresh
        </button>
      </DashboardPanel>
    );
  }

  if (status === "requesting") {
    return (
      <DashboardPanel className="flex items-center gap-3 px-5 py-3">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Asking your browser for permission to read your location...
        </p>
      </DashboardPanel>
    );
  }

  if (status === "denied") {
    return (
      <DashboardPanel className="flex flex-col gap-1 border-amber-200/50 bg-amber-50/40 px-5 py-3">
        <p className="text-sm font-semibold text-foreground">
          Location access is blocked
        </p>
        <p className="text-xs text-muted-foreground">
          We can still show verified facilities — they&apos;re just not sorted
          by distance. To sort by distance, allow location access in your
          browser&apos;s site settings, then refresh this page.
        </p>
      </DashboardPanel>
    );
  }

  if (status === "unsupported") {
    return (
      <DashboardPanel className="flex flex-col gap-1 px-5 py-3">
        <p className="text-sm font-semibold text-foreground">
          Your browser doesn&apos;t support geolocation
        </p>
        <p className="text-xs text-muted-foreground">
          You can still browse the directory below; results aren&apos;t sorted
          by distance.
        </p>
      </DashboardPanel>
    );
  }

  if (status === "error") {
    return (
      <DashboardPanel className="flex items-center justify-between gap-4 border-amber-200/50 bg-amber-50/40 px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            We couldn&apos;t read your location
          </p>
          <p className="text-xs text-muted-foreground">
            {errorMessage ?? "Try again or browse the full directory below."}
          </p>
        </div>
        <button
          type="button"
          onClick={onRequest}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
        >
          <LocateFixed className="size-3.5" />
          Try again
        </button>
      </DashboardPanel>
    );
  }

  // status === "idle"
  return (
    <DashboardPanel className="flex flex-col items-start justify-between gap-3 px-5 py-3 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Use my location to find the closest facilities
        </p>
        <p className="text-xs text-muted-foreground">
          Granting access lets us sort the directory by real distance from
          where you are.
        </p>
      </div>
      <button
        type="button"
        onClick={onRequest}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
      >
        <LocateFixed className="size-4" />
        Use my location
      </button>
    </DashboardPanel>
  );
}

function FacilityCard({
  facility,
  isSelected,
  onSelect,
  userLat,
  userLng,
}: {
  facility: ApiFacility;
  isSelected: boolean;
  onSelect: () => void;
  userLat?: number;
  userLng?: number;
}) {
  const directionsUrl =
    userLat != null && userLng != null
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${facility.latitude},${facility.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;

  const phone = facility.phone?.trim();
  const hasPhone = !!phone;
  const hasRating =
    typeof facility.rating === "number" && facility.rating > 0;

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

          <div className="flex shrink-0 flex-col items-end gap-1">
            <FacilityTypeBadge type={facility.type} />
            {typeof facility.distanceKm === "number" ? (
              <span className="text-[11px] font-semibold text-primary">
                {formatDistance(facility.distanceKm)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-12 pt-1">
          {hasRating ? (
            <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
              <Star className="size-3 text-amber-500" />
              {facility.rating!.toFixed(1)}
            </span>
          ) : null}
          {hasPhone ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              {phone}
            </span>
          ) : null}
          {typeof facility.openNow === "boolean" ? (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                facility.openNow ? "text-emerald-600" : "text-red-500",
              )}
            >
              <Clock className="size-3" />
              {facility.openNow ? "Open now" : "Closed"}
            </span>
          ) : null}
          {facility.source === "osm" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              From OpenStreetMap
            </span>
          ) : null}
        </div>
      </button>

      {isSelected ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-primary/8 pl-12 pt-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-95"
          >
            <Navigation className="size-3" />
            Get Directions
          </a>
          {hasPhone ? (
            <a
              href={`tel:${phone!.replace(/\s/g, "")}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Phone className="size-3" />
              Call
            </a>
          ) : null}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              facility.name + " " + facility.address,
            )}`}
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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

function formatAccuracy(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  if (m < 10_000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000)} km`;
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
  type: HealthcareFacility["type"];
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
