import { ResourcePageTemplate } from "@/components/landing/resource-page";

export default function KnowledgeBasePage() {
  return (
    <ResourcePageTemplate
      slug="knowledge-base"
      title="Knowledge Base"
      description="Browse foundational MediAI help content, feature explanations, and product guidance in one place."
      bullets={[
        "Understand how each MediAI workflow is designed to support patients and professionals.",
        "Find setup guidance for onboarding, AI Doctor, lab tests, and second opinions.",
        "Get quick answers about features, privacy expectations, and recommended usage.",
      ]}
    />
  );
}

