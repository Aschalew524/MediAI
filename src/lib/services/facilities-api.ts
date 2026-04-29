import api from "@/lib/axios";
import type { FacilityType } from "@/lib/dashboard-content";

/**
 * A facility row as returned by the backend.
 *
 * Geo-aware calls populate `distanceKm`. OSM-sourced rows often lack
 * `phone`/`rating`/`openNow`, hence those are optional. `source` distinguishes
 * curated directory entries from live OpenStreetMap pulls so the UI can
 * render an appropriate badge / hide misleading fields.
 */
export type ApiFacility = {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone?: string;
  rating?: number;
  verified: boolean;
  latitude: number;
  longitude: number;
  openNow?: boolean;
  distanceKm?: number;
  source?: "directory" | "osm";
};

export type FacilityListResponse = {
  items: ApiFacility[];
  page: number;
  pageSize: number;
  total: number;
};

export type FacilityListParams = {
  type?: FacilityType;
  q?: string;
  /** When both `lat` and `lng` are set the API sorts by Haversine distance. */
  lat?: number;
  lng?: number;
  /** Search radius in km (clamped server-side to 0.5–100). */
  radiusKm?: number;
  page?: number;
  pageSize?: number;
};

export async function listHealthFacilities(
  params: FacilityListParams = {},
): Promise<FacilityListResponse> {
  const cleaned: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    cleaned[k] = v as string | number;
  }
  const { data } = await api.get<FacilityListResponse>("/health-facilities", {
    params: cleaned,
  });
  return data;
}
