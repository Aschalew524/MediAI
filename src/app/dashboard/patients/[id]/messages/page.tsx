import { PatientMessagesPage } from "@/components/dashboard/patient-messages-page";

type RouteParams = { id: string };

export default async function PatientMessagesRoute({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  return <PatientMessagesPage patientId={id} />;
}
