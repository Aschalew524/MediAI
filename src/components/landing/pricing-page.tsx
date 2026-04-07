"use client";

import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { PricingSection } from "./pricing-section";
import { SiteFooter, SiteHeader } from "./sections";

export function PricingPage() {
  const { data } = useLandingConfig();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />
      <main>
        <PricingSection />
      </main>
      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}
