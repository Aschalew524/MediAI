import { AdminBlogGate } from "@/components/admin/blog-admin-gate";
import { AdminBlogListPage } from "@/components/admin/blog-admin-list-page";

export default function AdminBlogIndexPage() {
  return (
    <AdminBlogGate>
      <AdminBlogListPage />
    </AdminBlogGate>
  );
}
