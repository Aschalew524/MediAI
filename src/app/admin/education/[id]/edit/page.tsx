import { notFound } from "next/navigation";

import { AdminEducationGate } from "@/components/admin/admin-education-gate";
import { AdminEducationEditorPage } from "@/components/admin/admin-education-editor-page";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminEducationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_V4.test(id.trim())) {
    notFound();
  }
  return (
    <AdminEducationGate>
      <AdminEducationEditorPage resourceId={id} />
    </AdminEducationGate>
  );
}
