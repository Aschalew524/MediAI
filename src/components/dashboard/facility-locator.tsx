"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Star,
  Stethoscope,
} from "lucide-react";

import Link from "next/link";
import { isCancel } from "axios";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import {
  HEALTH_FACILITIES_RADIUS_DEFAULT_KM,
  HEALTH_FACILITIES_RADIUS_OPTIONS_KM,
  listHealthFacilities,
  type FacilityType,
  type HealthcareFacilityDto,
} from "@/lib/health-facilities-api";
import { cn } from "@/lib/utils";

import {
  DashboardActionButton,
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

type FacilityFilter = "all" | FacilityType;

type GeoStatus = "unsupported" | "prompt" | "denied" | "granted" | "unavailable";

const LIST_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const RADIUS_DEBOUNCE_MS = 300;

export function FacilityLocatorPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [filter, setFilter] = useState<FacilityFilter>("all");
  const [selectedFacility, setSelectedFacility] =
    useState<HealthcareFacilityDto | null>(null);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<HealthcareFacilityDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("prompt");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoRequesting, setGeoRequesting] = useState(false);

  const [radiusKm, setRadiusKm] = useState(HEALTH_FACILITIES_RADIUS_DEFAULT_KM);
  const [debouncedRadiusKm, setDebouncedRadiusKm] = useState(
    HEALTH_FACILITIES_RADIUS_DEFAULT_KM,
  );

  const listReq = useRef(0);
  const coordsRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  // Prevents the auto-resolve-on-mount path (when the browser already has
  // permission granted) from racing against a manual "Use my location" tap.
  const geoRequestingRef = useRef(false);

  const geoGranted = geoStatus === "granted" && userLat != null && userLng != null;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
    }
  }, []);

  useEffect(() => {
    coordsRef.current = { lat: userLat, lng: userLng };
  }, [userLat, userLng]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
    const permissions = navigator.permissions;
    if (!permissions?.query) return;

    let cancelled = false;
    let statusObj: PermissionStatus | null = null;

    const syncFromPermission = () => {
      if (cancelled || !statusObj) return;
      if (statusObj.state === "denied") {
        setGeoStatus((g) => {
          const { lat, lng } = coordsRef.current;
          if (g === "granted" && lat != null && lng != null) return g;
          return "denied";
        });
        return;
      }
      if (statusObj.state === "prompt") {
        setGeoStatus((g) => {
          const { lat, lng } = coordsRef.current;
          if (g === "granted" && lat != null && lng != null) return g;
          return "prompt";
        });
        return;
      }
      if (statusObj.state === "granted") {
        // Permission was already granted in a previous visit. Auto-resolve
        // the user's coords so the map and distance-sorted list reflect
        // their *actual* location instead of forcing a fresh click on every
        // reload. We never bypass the OS prompt — that only ever happens
        // after the user explicitly granted permission earlier.
        const { lat, lng } = coordsRef.current;
        if (lat != null && lng != null) {
          setGeoStatus("granted");
          return;
        }
        if (
          typeof navigator !== "undefined" &&
          "geolocation" in navigator &&
          !geoRequestingRef.current
        ) {
          geoRequestingRef.current = true;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setUserLat(pos.coords.latitude);
              setUserLng(pos.coords.longitude);
              setGeoStatus("granted");
              geoRequestingRef.current = false;
            },
            () => {
              // Silent: a previously-granted permission can still fail
              // (no GPS signal, kill-switch, etc.). The user can retry via
              // the visible "Use my location" button.
              geoRequestingRef.current = false;
              if (!cancelled) setGeoStatus("prompt");
            },
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
          );
        }
      }
    };

    permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        statusObj = status;
        syncFromPermission();
        status.addEventListener("change", syncFromPermission);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      statusObj?.removeEventListener("change", syncFromPermission);
    };
  }, []);

  useEffect(() => {
    if (!geoGranted) {
      setDebouncedRadiusKm(HEALTH_FACILITIES_RADIUS_DEFAULT_KM);
      return;
    }
    const t = setTimeout(() => setDebouncedRadiusKm(radiusKm), RADIUS_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [geoGranted, radiusKm]);

  const listQuery = useMemo(
    () => ({
      pageSize: LIST_PAGE_SIZE,
      type: filter === "all" ? undefined : filter,
      q: debouncedQ || undefined,
      lat: geoGranted && userLat != null ? userLat : undefined,
      lng: geoGranted && userLng != null ? userLng : undefined,
      radiusKm: geoGranted ? debouncedRadiusKm : undefined,
    }),
    [debouncedQ, debouncedRadiusKm, filter, geoGranted, userLat, userLng],
  );

  useEffect(() => {
    const ac = new AbortController();

    const id = ++listReq.current;
    setLoading(true);
    setError(null);

    listHealthFacilities(
      {
        ...listQuery,
        page: 1,
      },
      { signal: ac.signal },
    )
      .then((res) => {
        if (id !== listReq.current) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
      })
      .catch((e: unknown) => {
        if (isCancel(e) || id !== listReq.current) return;
        setError(getFriendlyAxiosMessage(e, "Could not load facilities. Try again."));
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (id !== listReq.current) return;
        setLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [listQuery, retryNonce]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || items.length >= total) return;
    const snapshot = listReq.current;
    setLoadingMore(true);
    setError(null);
    try {
      const next = page + 1;
      const res = await listHealthFacilities({
        ...listQuery,
        page: next,
      });
      if (snapshot !== listReq.current) return;
      setPage(next);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e: unknown) {
      if (isCancel(e) || snapshot !== listReq.current) return;
      setError(getFriendlyAxiosMessage(e, "Could not load more. Try again."));
    } finally {
      if (snapshot === listReq.current) setLoadingMore(false);
    }
  }, [items.length, listQuery, loading, loadingMore, page, total]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoStatus("granted");
        setGeoRequesting(false);
      },
      (err) => {
        setUserLat(null);
        setUserLng(null);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("unavailable");
        }
        setGeoRequesting(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  }, []);

  // Map centring rules:
  //   1. A selected facility wins — show that pin.
  //   2. Else, if we have the user's coords, centre on them so the map
  //      matches the distance-sorted list below.
  //   3. Else fall back to a generic "hospitals and pharmacies near me" search
  //      so the embed at least has *something* to render. We deliberately do
  //      not name a specific city here — the previous hardcoded "Addis Ababa"
  //      misled users elsewhere in the world.
  const mapZoom = selectedFacility ? 15 : geoGranted ? 14 : 13;
  const mapQuery = selectedFacility
    ? encodeURIComponent(`${selectedFacility.name}, ${selectedFacility.address}`)
    : geoGranted && userLat != null && userLng != null
      ? `${userLat},${userLng}`
      : encodeURIComponent("hospitals and pharmacies near me");

  const hasMore = items.length < total;
  const showEmpty = !loading && !error && items.length === 0;
  const sortHint = geoGranted
    ? "Sorted by distance"
    : "Sorted by name";

  const retry = () => setRetryNonce((n) => n + 1);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="Healthcare Facility Locator"
          description="Find and navigate to the nearest verified hospitals, clinics, and pharmacies."
        />

        {geoStatus === "denied" ? (
          <DashboardPanel className="border-amber-200/50 bg-amber-50/40 px-5 py-3">
            <p className="text-sm font-medium text-foreground">Location access is blocked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Facilities are still listed; enable location in your browser settings to sort by
              distance.
            </p>
          </DashboardPanel>
        ) : null}
        {geoStatus === "unsupported" ? (
          <DashboardPanel className="px-5 py-3">
            <p className="text-sm font-medium text-foreground">Geolocation not available</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Browse the directory below; results use default ordering.
            </p>
          </DashboardPanel>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or address..."
              className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            {geoStatus !== "unsupported" ? (
              <button
                type="button"
                onClick={requestLocation}
                disabled={geoRequesting}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary/15 px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted disabled:opacity-60"
              >
                <Navigation className="size-3.5 shrink-0" />
                {geoRequesting ? "Locating…" : "Use my location"}
              </button>
            ) : null}
          </div>
        </div>

        {geoStatus === "denied" ? (
          <p className="text-xs text-muted-foreground">
            Location is off — results are not sorted by distance. You can enable location in your
            browser settings and tap &quot;Use my location&quot; again.
          </p>
        ) : null}
        {geoStatus === "unavailable" ? (
          <p className="text-xs text-muted-foreground">
            Could not determine your position. Try again or continue without location.
          </p>
        ) : null}

        {geoGranted ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="facility-radius-km" className="text-muted-foreground">
              Search radius
            </label>
            <select
              id="facility-radius-km"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="h-9 rounded-lg border border-primary/15 bg-white px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {HEALTH_FACILITIES_RADIUS_OPTIONS_KM.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
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

          <div className="space-y-3">
            <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-foreground">
                {loading && items.length === 0
                  ? "Loading…"
                  : `${total} ${total === 1 ? "facility" : "facilities"} found`}
              </p>
              <p className="text-xs text-muted-foreground">
                {sortHint}
                <span className="text-muted-foreground/70">
                  {" "}
                  ({geoGranted ? "nearest first" : "name A–Z"})
                </span>
              </p>
            </div>

            {error ? (
              <DashboardPanel className="space-y-3 px-6 py-6">
                <p className="text-sm text-destructive">{error}</p>
                <DashboardActionButton type="button" className="h-9 rounded-lg px-4 text-sm" onClick={retry}>
                  Retry
                </DashboardActionButton>
              </DashboardPanel>
            ) : null}

            <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
              {loading && items.length === 0 ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Loading facilities…</p>
                </DashboardPanel>
              ) : null}

              {showEmpty ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {geoGranted
                      ? "No facilities match your search within this area."
                      : "No facilities match your search."}
                  </p>
                </DashboardPanel>
              ) : null}

              {!loading || items.length > 0
                ? items.map((facility) => (
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
                : null}
            </div>

            {hasMore && !loading && items.length > 0 ? (
              <div className="flex justify-center pb-2">
                <DashboardActionButton
                  type="button"
                  className="h-10 rounded-lg px-8 text-sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </DashboardActionButton>
              </div>
            ) : null}
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
  facility: HealthcareFacilityDto;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
  const phoneRaw = facility.phone?.trim();
  const hasPhone = Boolean(phoneRaw);
  const rating = facility.rating;
  const openNow = facility.openNow;
  const distanceLine =
    facility.distanceKm != null
      ? `${facility.distanceKm.toFixed(1)} km away`
      : null;

  return (
    <DashboardPanel
      className={cn(
        "space-y-3 px-5 py-4 transition-all hover:-translate-y-px",
        isSelected && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex justify-end">
        <Link
          href={`/dashboard/facility-locator/${encodeURIComponent(facility.id)}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Details
        </Link>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="w-full cursor-pointer text-left"
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
                <MapPin className="size-3 shrink-0" />
                {facility.address}
              </p>
              {distanceLine ? (
                <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{distanceLine}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <FacilityTypeBadge type={facility.type} />
            {typeof facility.distanceKm === "number" ? (
              <span className="text-xs font-semibold text-primary">
                {formatDistance(facility.distanceKm)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-12 pt-1">
          {rating != null ? (
            <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
              <Star className="size-3 text-amber-500" />
              {rating.toFixed(1)}
            </span>
          ) : null}
          {hasPhone ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              {phoneRaw}
            </span>
          ) : null}
          {openNow === undefined ? (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              Hours unknown
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                openNow ? "text-emerald-600" : "text-red-500",
              )}
            >
              <Clock className="size-3" />
              {openNow ? "Open now" : "Closed"}
            </span>
          )}
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
          {phoneRaw ? (
            <a
              href={`tel:${phoneRaw.replace(/\s/g, "")}`}
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
