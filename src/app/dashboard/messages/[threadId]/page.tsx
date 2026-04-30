import { PatientDoctorThreadPage } from "@/components/dashboard/patient-doctor-messages";

export default async function MessageThreadRoute({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <PatientDoctorThreadPage threadId={threadId} />;
}
