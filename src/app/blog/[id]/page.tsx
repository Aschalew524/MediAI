import { notFound } from "next/navigation";

import { BlogArticlePage } from "@/components/landing/blog-article-page";
import { blogArticles, getBlogArticleById } from "@/lib/blog-content";

export function generateStaticParams() {
  return blogArticles.map((article) => ({ id: article.id }));
}

export default async function BlogArticleRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getBlogArticleById(id);

  if (!article) {
    notFound();
  }

  return (
    <BlogArticlePage
      title={article.title}
      category={article.category}
      author={article.author}
      date={article.date}
      readTime={article.readTime}
      imageSrc={article.imageSrc}
      intro={article.intro}
      sections={article.sections}
    />
  );
}

