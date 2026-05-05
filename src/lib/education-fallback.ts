import type { EducationResourceDto, EducationSlug } from "@/lib/education-api";

/** Static copy when the API is unreachable (aligned with `prisma/seed.ts`). */
export function getEducationFallback(slug: EducationSlug): EducationResourceDto {
  switch (slug) {
    case "symptom-guide":
      return {
        slug,
        title: "Symptom Guide",
        description:
          "Use the MediAI symptom guide to understand common signs, prepare smarter questions, and know when to seek urgent care.",
        bullets: [
          "Review common symptom patterns in clear, non-technical language.",
          "Prepare for care visits with focused questions and useful context.",
          "Understand which symptoms may need urgent clinical attention.",
        ],
        iconKey: slug,
      };
    case "glossary":
      return {
        slug,
        title: "Glossary",
        description:
          "Look up common healthcare, lab, and AI terms used across MediAI so the product stays easy to understand.",
        bullets: [
          "Learn the meaning of common lab, symptom, and treatment terms.",
          "Understand AI and medical language that appears in explanations and summaries.",
          "Build confidence before appointments, result reviews, and follow-up questions.",
        ],
        iconKey: slug,
      };
    case "knowledge-base":
      return {
        slug,
        title: "Knowledge Base",
        description:
          "Browse foundational MediAI help content, feature explanations, and product guidance in one place.",
        bullets: [
          "Understand how each MediAI workflow is designed to support patients and professionals.",
          "Find setup guidance for onboarding, AI Doctor, nearby facilities, and second opinions.",
          "Get quick answers about features, privacy expectations, and recommended usage.",
        ],
        iconKey: slug,
      };
  }
}
