import { EducationResourcePage } from "@/components/landing/resource-page";
import {
  getEducationResourceBySlug,
  isEducationNotFound,
} from "@/lib/education-api";
import type { EducationSlug } from "@/lib/education-api";

const OFFLINE_FALLBACK =
  "We couldn’t load live content from the server. Showing static copy below. If you’re developing locally, run `npx prisma db seed` in MediAI_backend and ensure `NEXT_PUBLIC_API_URL` points at the API.";

const NOT_PUBLISHED_FALLBACK =
  "No published version was found for this page (it may be unpublished or missing from the database). Showing static copy below. In local dev, run `npx prisma db seed` in MediAI_backend.";

/** Server entry for `/symptom-guide`, `/glossary`, `/knowledge-base`: never returns Next’s generic 404 for API 404. */
export async function renderEducationPublicPage(slug: EducationSlug) {
  try {
    const resource = await getEducationResourceBySlug(slug);
    return <EducationResourcePage slug={slug} resource={resource} />;
  } catch (e) {
    const message = isEducationNotFound(e) ? NOT_PUBLISHED_FALLBACK : OFFLINE_FALLBACK;
    return <EducationResourcePage slug={slug} fallbackMessage={message} />;
  }
}
