import { isAxiosError } from "axios";

import api from "@/lib/axios";
import type { TopDoctor } from "@/lib/top-doctors-content";

export type TopDoctorsListResponse = {
  items: TopDoctor[];
  page: number;
  pageSize: number;
  total: number;
};

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidTopDoctorId(id: string): boolean {
  return UUID_V4_RE.test(id);
}

function listQueryParams(params: {
  page?: number;
  pageSize?: number;
  specialty?: string;
  q?: string;
}): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };
  if (params.specialty && params.specialty !== "all") {
    out.specialty = params.specialty;
  }
  if (params.q?.trim()) {
    out.q = params.q.trim().slice(0, 120);
  }
  return out;
}

export async function getTopDoctorSpecialties(): Promise<string[]> {
  const { data } = await api.get<{ specialties: string[] }>("/top-doctors/specialties");
  return data.specialties;
}

export async function listTopDoctors(params: {
  page?: number;
  pageSize?: number;
  specialty?: string;
  q?: string;
}): Promise<TopDoctorsListResponse> {
  const { data } = await api.get<TopDoctorsListResponse>("/top-doctors", {
    params: listQueryParams(params),
  });
  return data;
}

export async function getTopDoctorById(id: string): Promise<TopDoctor> {
  const { data } = await api.get<TopDoctor>(`/top-doctors/${id}`);
  return data;
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function isBadRequestError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 400;
}
