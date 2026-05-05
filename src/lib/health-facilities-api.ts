import api from "@/lib/axios";

export type FacilityType = "hospital" | "pharmacy" | "clinic";

/** Mirrors Nest `ParseHealthFacilityIdPipe` + `HEALTH_FACILITY_ID_MAX_LENGTH`. */
const HEALTH_FACILITY_ID_MAX_LENGTH = 64;
const HEALTH_FACILITY_ID_PATTERN = /^fac-[A-Za-z0-9-]+$/;

export function isValidHealthFacilityId(id: string): boolean {
  const t = id.trim();
  if (!t || t.length > HEALTH_FACILITY_ID_MAX_LENGTH) return false;
  return HEALTH_FACILITY_ID_PATTERN.test(t);
}

/** Backend `HealthFacilitiesQueryDto` radius bounds when `lat`/`lng` are set. */
export const HEALTH_FACILITIES_RADIUS_MIN_KM = 0.5;
export const HEALTH_FACILITIES_RADIUS_MAX_KM = 100;
export const HEALTH_FACILITIES_RADIUS_DEFAULT_KM = 10;

export const HEALTH_FACILITIES_RADIUS_OPTIONS_KM = [1, 2, 5, 10, 15, 25, 50, 100] as const;

/** Public list row — matches backend `HealthcareFacilityDto`. */
export type HealthcareFacilityDto = {
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
  source?: "directory" | "osm";
  distanceKm?: number;
};

export type HealthFacilitiesListResponse = {
  items: HealthcareFacilityDto[];
  page: number;
  pageSize: number;
  total: number;
};

const Q_MAX = 120;

function listQueryParams(params: {
  page?: number;
  pageSize?: number;
  type?: FacilityType;
  q?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };
  if (params.type) {
    out.type = params.type;
  }
  if (params.q?.trim()) {
    out.q = params.q.trim().slice(0, Q_MAX);
  }
  if (params.lat != null && params.lng != null) {
    out.lat = params.lat;
    out.lng = params.lng;
    if (params.radiusKm != null) {
      const r = Math.min(
        HEALTH_FACILITIES_RADIUS_MAX_KM,
        Math.max(HEALTH_FACILITIES_RADIUS_MIN_KM, params.radiusKm),
      );
      out.radiusKm = r;
    }
  }
  return out;
}

export async function listHealthFacilities(
  params: {
    page?: number;
    pageSize?: number;
    type?: FacilityType;
    q?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  },
  options?: { signal?: AbortSignal },
): Promise<HealthFacilitiesListResponse> {
  const { data } = await api.get<HealthFacilitiesListResponse>("/health-facilities", {
    params: listQueryParams(params),
    signal: options?.signal,
  });
  return data;
}

export async function getHealthFacilityById(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<HealthcareFacilityDto> {
  const { data } = await api.get<HealthcareFacilityDto>(
    `/health-facilities/${encodeURIComponent(id.trim())}`,
    { signal: options?.signal },
  );
  return data;
}
