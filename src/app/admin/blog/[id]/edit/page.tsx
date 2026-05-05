import { AdminBlogGate } from "@/components/admin/blog-admin-gate";
import { AdminBlogEditorPage } from "@/components/admin/blog-admin-editor-page";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminBlogGate>
      <AdminBlogEditorPage articleId={id} />
    </AdminBlogGate>
  );
}
