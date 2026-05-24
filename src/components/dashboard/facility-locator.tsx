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

type GeoStatus =
  | "unsupported"
  | "insecure"
  | "prompt"
  | "denied"
  | "granted"
  | "unavailable"
  | "timeout";

const LIST_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const RADIUS_DEBOUNCE_MS = 300;

/**
 * Detect whether geolocation can realistically succeed. Browsers require a
 * secure context — meaning HTTPS or `localhost` — so when the dev server is
 * exposed on a LAN IP (`http://192.168.x.x:3000`) the geolocation API exists
 * but every `getCurrentPosition` call fails silently. The button click would
 * appear to do nothing. We surface this up-front instead.
 */
function isGeolocationUsable(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined" || !("geolocation" in navigator))
    return false;
  // `isSecureContext` is true on HTTPS *and* on localhost/127.0.0.1; false
  // otherwise. The fallback check covers very old browsers without the flag.
  if (typeof window.isSecureContext === "boolean") return window.isSecureContext;
  const host = window.location.hostname;
  return (
    window.location.protocol === "https:" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]"
  );
}

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
  const [geoErrorDetail, setGeoErrorDetail] = useState<string | null>(null);

  const [radiusKm, setRadiusKm] = useState(HEALTH_FACILITIES_RADIUS_DEFAULT_KM);
  const [debouncedRadiusKm, setDebouncedRadiusKm] = useState(
    HEALTH_FACILITIES_RADIUS_DEFAULT_KM,
  );

  const listReq = useRef(0);
  const coordsRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  // True only while a user-initiated `requestLocation` is in flight. The
  // permission-change listener watches this so it never re-enters
  // `getCurrentPosition` (or worse, clobbers a successful grant back to
  // `"prompt"` because its own follow-up request happened to time out
  // milliseconds after the button-triggered one succeeded). This was the
  // root cause of "I click Use my location and nothing changes".
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
      return;
    }
    // Catch the "served from a LAN IP" case eagerly so the user gets a clear
    // diagnostic instead of clicking a button that silently fails.
    if (!isGeolocationUsable()) {
      setGeoStatus("insecure");
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
      // The user just clicked "Use my location" and `requestLocation` is
      // mid-flight. Whatever the listener thinks the permission state is,
      // wait — the in-flight call will set the authoritative state when it
      // resolves. This is what eliminates the race that previously made
      // the button look broken on first grant.
      if (geoRequestingRef.current) return;

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
        // reload.
        const { lat, lng } = coordsRef.current;
        if (lat != null && lng != null) {
          setGeoStatus("granted");
          return;
        }
        if (
          typeof navigator !== "undefined" &&
          "geolocation" in navigator
        ) {
          geoRequestingRef.current = true;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setUserLat(pos.coords.latitude);
              setUserLng(pos.coords.longitude);
              setGeoStatus("granted");
              setGeoErrorDetail(null);
              geoRequestingRef.current = false;
            },
            () => {
              // A previously-granted permission can still fail (no GPS
              // signal, kill-switch, etc.). Don't downgrade `geoStatus`
              // to `"prompt"` here — that used to undo the user's intent.
              // The visible button + error panel handle the retry.
              geoRequestingRef.current = false;
              if (cancelled) return;
              setGeoStatus((g) =>
                g === "granted" && coordsRef.current.lat != null
                  ? g
                  : "unavailable",
              );
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
    // Without a geolocation fix the backend has nothing meaningful to return
    // for "nearby" — it would fall back to a tiny curated demo list seeded
    // around one city (Addis Ababa), which was confusing for users outside
    // Ethiopia. Skip the request entirely and let the empty state prompt
    // the user to share their location.
    if (!geoGranted) {
      ++listReq.current;
      setItems([]);
      setTotal(0);
      setPage(1);
      setLoading(false);
      setError(null);
      return;
    }

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
  }, [geoGranted, listQuery, retryNonce]);

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
    if (!isGeolocationUsable()) {
      // Browsers silently refuse geolocation on insecure origins (anything
      // that isn't HTTPS / localhost). Without this guard the click does
      // nothing visible — the user just sees the same dummy Addis Ababa
      // results forever.
      setGeoStatus("insecure");
      setGeoErrorDetail(
        "Your browser only shares location on secure (HTTPS) origins. Open MediAI on localhost or HTTPS.",
      );
      return;
    }
    setGeoRequesting(true);
    geoRequestingRef.current = true;
    setGeoErrorDetail(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoStatus("granted");
        setGeoErrorDetail(null);
        setGeoRequesting(false);
        geoRequestingRef.current = false;
        // Even if the new fix happens to match the old one exactly (e.g.
        // hitting the button twice in a row), bump `retryNonce` so the
        // list `useEffect` still re-fires. This is the only safety net
        // that catches the "I overrode my location in DevTools but the
        // results never changed" case — the memoised `listQuery` stays
        // identical when lat/lng don't change, so without this nudge
        // the effect would just sit on the stale data.
        setRetryNonce((n) => n + 1);
      },
      (err) => {
        // Don't blank existing coords on retry failure — if the user had
        // a fix on a previous visit we'd rather keep it than yank them
        // back to a generic "unavailable" state.
        if (coordsRef.current.lat == null) {
          setUserLat(null);
          setUserLng(null);
        }
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoErrorDetail(
            "Location access was denied. Allow location in your browser settings, then tap “Use my location” again.",
          );
        } else if (err.code === err.TIMEOUT) {
          setGeoStatus("timeout");
          setGeoErrorDetail(
            "We waited 15 seconds but didn't get a fix. Move somewhere with better signal and try again.",
          );
        } else {
          setGeoStatus("unavailable");
          setGeoErrorDetail(
            err.message ||
              "We couldn't determine your position. Check that location services are on for this browser.",
          );
        }
        setGeoRequesting(false);
        geoRequestingRef.current = false;
      },
      // `maximumAge: 0` *forces* the browser to fetch a brand new fix rather
      // than handing back a position cached up to a minute ago. Without
      // this, flipping the Chrome DevTools "Sensors → Location" override
      // from one city to another wouldn't take effect until the browser
      // re-evaluated cache — which could leave the user on stale coords
      // for up to 60 s after the change, looking exactly like "your fix
      // didn't work".
      { enableHighAccuracy: false, maximumAge: 0, timeout: 15_000 },
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
  const showLocationCta = !geoGranted && geoStatus !== "unsupported";
  const showEmpty = !loading && !error && items.length === 0 && geoGranted;

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
              {geoErrorDetail ??
                "Enable location for this site in your browser settings, then tap “Use my location” again to see facilities near you."}
            </p>
          </DashboardPanel>
        ) : null}
        {geoStatus === "insecure" ? (
          <DashboardPanel className="border-amber-200/50 bg-amber-50/40 px-5 py-3">
            <p className="text-sm font-medium text-foreground">
              Location only works on HTTPS or localhost
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {geoErrorDetail ??
                "Your browser is blocking geolocation because this page isn't on a secure origin. Open the app via HTTPS or `http://localhost` to enable nearby search."}
            </p>
          </DashboardPanel>
        ) : null}
        {geoStatus === "unavailable" ? (
          <DashboardPanel className="border-amber-200/50 bg-amber-50/40 px-5 py-3">
            <p className="text-sm font-medium text-foreground">Couldn&apos;t get your position</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {geoErrorDetail ??
                "We couldn't determine your position. Check that location services are on, then tap “Use my location” to try again."}
            </p>
          </DashboardPanel>
        ) : null}
        {geoStatus === "timeout" ? (
          <DashboardPanel className="border-amber-200/50 bg-amber-50/40 px-5 py-3">
            <p className="text-sm font-medium text-foreground">Location request timed out</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {geoErrorDetail ??
                "We waited 15 seconds but didn't get a fix. Try again from somewhere with better signal."}
            </p>
          </DashboardPanel>
        ) : null}
        {geoStatus === "unsupported" ? (
          <DashboardPanel className="px-5 py-3">
            <p className="text-sm font-medium text-foreground">Geolocation not available</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This browser doesn&apos;t expose location to web apps, so we can&apos;t find facilities near
              you automatically.
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

        {geoGranted ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
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
            {userLat != null && userLng != null ? (
              // Surface the exact lat/lng we're querying with so the user
              // (and especially anyone testing via DevTools "Sensors →
              // Location") can tell at a glance whether the override took
              // effect. Previously the page showed Bole-area facilities
              // and gave no clue that the browser was still reporting old
              // coords, which made the override look broken.
              <p className="text-xs text-muted-foreground">
                Using coords{" "}
                <span className="font-mono text-foreground/90">
                  {userLat.toFixed(4)}, {userLng.toFixed(4)}
                </span>
              </p>
            ) : null}
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
                {!geoGranted
                  ? "Share your location to begin"
                  : loading && items.length === 0
                    ? "Loading…"
                    : `${total} ${total === 1 ? "facility" : "facilities"} found`}
              </p>
              {geoGranted ? (
                <p className="text-xs text-muted-foreground">
                  Sorted by distance
                  <span className="text-muted-foreground/70"> (nearest first)</span>
                </p>
              ) : null}
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
              {showLocationCta ? (
                <DashboardPanel className="space-y-4 px-6 py-8 text-center">
                  <Navigation className="mx-auto size-8 text-primary/70" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      Find facilities near you
                    </p>
                    <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                      MediAI pulls live hospital, clinic, and pharmacy data from
                      OpenStreetMap based on where you are. Share your location to
                      see results tailored to your neighbourhood.
                    </p>
                  </div>
                  <DashboardActionButton
                    type="button"
                    className="mx-auto h-10 rounded-lg px-6 text-sm"
                    onClick={requestLocation}
                    disabled={geoRequesting}
                  >
                    <Navigation className="size-3.5" />
                    {geoRequesting ? "Locating…" : "Use my location"}
                  </DashboardActionButton>
                </DashboardPanel>
              ) : null}

              {loading && items.length === 0 && geoGranted ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Loading facilities…</p>
                </DashboardPanel>
              ) : null}

              {showEmpty ? (
                <DashboardPanel className="px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No facilities match your search within this area. Try widening
                    the radius or changing the filter.
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
  // Only the curated directory ("fac-...") has a backend detail page. OSM
  // results stream straight from Overpass and have synthetic ids
  // ("osm-node-...") that the public `/health-facilities/:id` endpoint
  // rejects, so we just hide the link for them.
  const hasDetailPage = facility.id.startsWith("fac-");

  return (
    <DashboardPanel
      className={cn(
        "space-y-3 px-5 py-4 transition-all hover:-translate-y-px",
        isSelected && "ring-2 ring-primary/30",
      )}
    >
      {hasDetailPage ? (
        <div className="flex justify-end">
          <Link
            href={`/dashboard/facility-locator/${encodeURIComponent(facility.id)}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Details
          </Link>
        </div>
      ) : null}
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
