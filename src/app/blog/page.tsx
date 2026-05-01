import { BlogPage } from "@/components/landing/blog-page";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import {
  collectArticleIdsFromHome,
  fetchArticlesByIds,
  getBlogHome,
  listBlogArticles,
} from "@/lib/blog-api";

export const revalidate = 120;

export default async function BlogRoute() {
  try {
    const home = await getBlogHome();
    const ids = collectArticleIdsFromHome(home);
    const articlesById = await fetchArticlesByIds(ids);
    const exploreInitial = await listBlogArticles({ page: 1, pageSize: 12 });

    return (
      <BlogPage
        variant="ok"
        home={home}
        articlesById={articlesById}
        exploreInitial={exploreInitial}
      />
    );
  } catch (e: unknown) {
    return (
      <BlogPage
        variant="error"
        message={getFriendlyAxiosMessage(
          e,
          "We could not load the blog. Check that the API is running and try again.",
        )}
      />
    );
  }
}
