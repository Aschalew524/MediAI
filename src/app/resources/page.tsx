import { HelpResourcesIndexPage } from "@/components/landing/help-resources-page";
import { getEducationResources } from "@/lib/education-api";
import { buildResourcesIndexMetadata } from "@/lib/education-metadata";

export const revalidate = 120;

export async function generateMetadata() {
  return buildResourcesIndexMetadata();
}

export default async function ResourcesIndexPage() {
  try {
    const { items } = await getEducationResources();
    return <HelpResourcesIndexPage items={items} />;
  } catch {
    return <HelpResourcesIndexPage items={[]} loadError />;
  }
}
