import { FacilityLocatorDetailPage } from "@/components/dashboard/facility-locator-detail";

export default async function FacilityLocatorDetailRoute({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const { facilityId } = await params;

  return <FacilityLocatorDetailPage facilityId={facilityId} />;
}
