import { buildEducationPageMetadata } from "@/lib/education-metadata";
import { renderEducationPublicPage } from "@/lib/education-public-page";

export const revalidate = 120;

const SLUG = "glossary" as const;

export async function generateMetadata() {
  return buildEducationPageMetadata(SLUG);
}

export default async function GlossaryPage() {
  return renderEducationPublicPage(SLUG);
}
