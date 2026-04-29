import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default function OnboardingPage() {
  return (
    <OnboardingGate>
      <OnboardingWizard />
    </OnboardingGate>
  );
}
