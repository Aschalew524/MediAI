import { DashboardBlogList } from "@/components/dashboard/dashboard-blog-page";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { listBlogArticles } from "@/lib/blog-api";

export const revalidate = 120;

export default async function DashboardBlogRoute() {
  try {
    const initial = await listBlogArticles({ page: 1, pageSize: 24 });
    return <DashboardBlogList initial={initial} />;
  } catch (e: unknown) {
    return (
      <DashboardBlogList
        initial={null}
        error={getFriendlyAxiosMessage(
          e,
          "We could not load the blog. Check your connection and try again.",
        )}
      />
    );
  }
}
