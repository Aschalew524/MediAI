import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BlogArticlePage } from "@/components/landing/blog-article-page";
import {
  getBlogArticleById,
  isValidBlogArticleUuid,
  listBlogArticles,
} from "@/lib/blog-api";

export const revalidate = 120;

export async function generateStaticParams() {
  try {
    const res = await listBlogArticles({ page: 1, pageSize: 50 });
    return res.items.map((a) => ({ id: a.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidBlogArticleUuid(id)) {
    return { title: "Article | MediAI Blog" };
  }
  try {
    const article = await getBlogArticleById(id);
    const description =
      article.intro.length > 160 ? `${article.intro.slice(0, 157)}…` : article.intro;
    const canonical = `/blog/${id}`;
    return {
      title: `${article.title} | MediAI Blog`,
      description,
      alternates: { canonical },
      openGraph: {
        title: article.title,
        description,
        type: "article",
      },
    };
  } catch {
    return { title: "Article | MediAI Blog" };
  }
}

export default async function BlogArticleRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidBlogArticleUuid(id)) {
    notFound();
  }

  try {
    const article = await getBlogArticleById(id);
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
  } catch {
    notFound();
  }
}
