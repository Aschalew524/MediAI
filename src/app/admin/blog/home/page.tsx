import { AdminBlogGate } from "@/components/admin/blog-admin-gate";
import { AdminBlogHomePage } from "@/components/admin/blog-admin-home-page";

export default function AdminBlogHomeRoutePage() {
  return (
    <AdminBlogGate>
      <AdminBlogHomePage />
    </AdminBlogGate>
  );
}
