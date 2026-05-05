import type { Metadata } from "next";

import { getEducationResourceBySlug } from "@/lib/education-api";
import type { EducationSlug } from "@/lib/education-api";
import { getEducationFallback } from "@/lib/education-fallback";

const FALLBACK_TITLES: Record<EducationSlug, string> = {
  "symptom-guide": "Symptom Guide | MediAI",
  glossary: "Glossary | MediAI",
  "knowledge-base": "Knowledge Base | MediAI",
};

export async function buildEducationPageMetadata(slug: EducationSlug): Promise<Metadata> {
  try {
    const r = await getEducationResourceBySlug(slug);
    const description =
      r.description.length > 160 ? `${r.description.slice(0, 157)}…` : r.description;
    const path = `/${slug}`;
    return {
      title: `${r.title} | MediAI`,
      description,
      alternates: { canonical: path },
    };
  } catch {
    const fb = getEducationFallback(slug);
    const description =
      fb.description.length > 160 ? `${fb.description.slice(0, 157)}…` : fb.description;
    const path = `/${slug}`;
    return {
      title: FALLBACK_TITLES[slug],
      description,
      alternates: { canonical: path },
    };
  }
}

export async function buildResourcesIndexMetadata(): Promise<Metadata> {
  return {
    title: "Help resources | MediAI",
    description:
      "Symptom guide, glossary, and knowledge base articles to help you use MediAI with confidence.",
    alternates: { canonical: "/resources" },
  };
}
