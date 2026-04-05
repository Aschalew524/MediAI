import { NextResponse } from "next/server";

import {
  benefitItems,
  faqItems,
  footerColumns,
  heroHighlights,
  navItems,
  securityItems,
  showcaseItems,
  testimonialItems,
} from "@/lib/landing-content";

export async function GET() {
  return NextResponse.json({
    navItems,
    heroHighlights,
    benefitItems,
    showcaseItems,
    securityItems,
    testimonialItems,
    faqItems,
    footerColumns,
  });
}
