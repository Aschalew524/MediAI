import { AdminBlogGate } from "@/components/admin/blog-admin-gate";
import { AdminBlogEditorPage } from "@/components/admin/blog-admin-editor-page";

export default function AdminBlogNewPage() {
  return (
    <AdminBlogGate>
      <AdminBlogEditorPage />
    </AdminBlogGate>
  );
}
