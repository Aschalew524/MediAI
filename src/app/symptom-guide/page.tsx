import { buildEducationPageMetadata } from "@/lib/education-metadata";
import { renderEducationPublicPage } from "@/lib/education-public-page";

export const revalidate = 120;

const SLUG = "symptom-guide" as const;

export async function generateMetadata() {
  return buildEducationPageMetadata(SLUG);
}

export default async function SymptomGuidePage() {
  return renderEducationPublicPage(SLUG);
}
