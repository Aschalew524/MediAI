import { ResourcePageTemplate } from "@/components/landing/resource-page";

export default function SymptomGuidePage() {
  return (
    <ResourcePageTemplate
      slug="symptom-guide"
      title="Symptom Guide"
      description="Use the MediAI symptom guide to understand common signs, prepare smarter questions, and know when to seek urgent care."
      bullets={[
        "Review common symptom patterns in clear, non-technical language.",
        "Prepare for care visits with focused questions and useful context.",
        "Understand which symptoms may need urgent clinical attention.",
      ]}
    />
  );
}

