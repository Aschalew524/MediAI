import { AdminEducationGate } from "@/components/admin/admin-education-gate";
import { AdminEducationCreatePage } from "@/components/admin/admin-education-create-page";

export default function AdminEducationNewPage() {
  return (
    <AdminEducationGate>
      <AdminEducationCreatePage />
    </AdminEducationGate>
  );
}
