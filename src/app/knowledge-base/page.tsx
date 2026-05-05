import { buildEducationPageMetadata } from "@/lib/education-metadata";
import { renderEducationPublicPage } from "@/lib/education-public-page";

export const revalidate = 120;

const SLUG = "knowledge-base" as const;

export async function generateMetadata() {
  return buildEducationPageMetadata(SLUG);
}

export default async function KnowledgeBasePage() {
  return renderEducationPublicPage(SLUG);
}
