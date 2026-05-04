import { PatientDetailPage } from "@/components/dashboard/patient-detail-page";

type RouteParams = { id: string };

export default async function PatientDetailRoute({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  return <PatientDetailPage patientId={id} />;
}
