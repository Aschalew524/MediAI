import { AdminEducationGate } from "@/components/admin/admin-education-gate";
import { AdminEducationListPage } from "@/components/admin/admin-education-list-page";

export default function AdminEducationIndexPage() {
  return (
    <AdminEducationGate>
      <AdminEducationListPage />
    </AdminEducationGate>
  );
}
