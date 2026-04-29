"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export type UserLocation = {
  status: UserLocationStatus;
  /** Available when `status === "ready"` */
  lat?: number;
  /** Available when `status === "ready"` */
  lng?: number;
  /** Reported accuracy radius in metres (browser-supplied, not always accurate). */
  accuracyM?: number;
  /** Populated for `status === "error"`. */
  errorMessage?: string;
};

export type UseUserLocationOptions = {
  /** Request the user's location automatically on first mount. */
  auto?: boolean;
  /** Pass through to the Geolocation API (defaults are conservative). */
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  /** How long a cached fix may be reused (default 5 minutes). */
  maximumAgeMs?: number;
};

const SUPPORTS_GEOLOCATION =
  typeof navigator !== "undefined" && Boolean(navigator.geolocation);

/**
 * Browser geolocation hook with a clear status machine.
 *
 * Notes:
 * - Browsers require HTTPS for `navigator.geolocation` outside of `localhost`.
 * - The first call surfaces a permission prompt; subsequent calls inside the
 *   `maximumAgeMs` window may be served from cache.
 * - Always render a fallback for `denied` / `unsupported` so the page works
 *   without a GPS fix.
 */
export function useUserLocation(opts: UseUserLocationOptions = {}) {
  const {
    auto = false,
    // Default to false: on desktops without GPS this gives a faster *and*
    // tighter fix (browsers fall back to WiFi/IP, which is roughly city-level).
    // Setting it to `true` on a desktop typically returns a multi-hundred-km
    // accuracy circle because the GPS request fails and the browser surfaces
    // the worst of its fallbacks. Mobile callers can opt in.
    enableHighAccuracy = false,
    timeoutMs = 10_000,
    maximumAgeMs = 5 * 60_000,
  } = opts;

  const [state, setState] = useState<UserLocation>({
    status: SUPPORTS_GEOLOCATION ? "idle" : "unsupported",
  });

  // Latest options without re-creating the request callback.
  const optsRef = useRef({ enableHighAccuracy, timeoutMs, maximumAgeMs });
  useEffect(() => {
    optsRef.current = { enableHighAccuracy, timeoutMs, maximumAgeMs };
  }, [enableHighAccuracy, timeoutMs, maximumAgeMs]);

  const request = useCallback(() => {
    if (!SUPPORTS_GEOLOCATION) {
      setState({ status: "unsupported" });
      return;
    }
    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: "denied" });
          return;
        }
        setState({
          status: "error",
          errorMessage:
            err.code === err.TIMEOUT
              ? "Location request timed out. Try again or pick a city."
              : err.message ||
                "We couldn't read your location. Try again or pick a city.",
        });
      },
      {
        enableHighAccuracy: optsRef.current.enableHighAccuracy,
        timeout: optsRef.current.timeoutMs,
        maximumAge: optsRef.current.maximumAgeMs,
      },
    );
  }, []);

  useEffect(() => {
    if (auto) request();
  }, [auto, request]);

  return { ...state, request };
}
