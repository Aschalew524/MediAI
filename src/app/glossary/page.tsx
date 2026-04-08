import { ResourcePageTemplate } from "@/components/landing/resource-page";

export default function GlossaryPage() {
  return (
    <ResourcePageTemplate
      slug="glossary"
      title="Glossary"
      description="Look up common healthcare, lab, and AI terms used across MediAI so the product stays easy to understand."
      bullets={[
        "Learn the meaning of common lab, symptom, and treatment terms.",
        "Understand AI and medical language that appears in explanations and summaries.",
        "Build confidence before appointments, result reviews, and follow-up questions.",
      ]}
    />
  );
}

