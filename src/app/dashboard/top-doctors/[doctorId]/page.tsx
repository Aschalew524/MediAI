import { TopDoctorBiographyPage } from "@/components/dashboard/top-doctors";

export default async function TopDoctorBiographyRoute({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;

  return <TopDoctorBiographyPage doctorId={doctorId} />;
}
