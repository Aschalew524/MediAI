import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Bot,
  BrainCircuit,
  ChevronDown,
  FlaskConical,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Languages,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundSearch,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

export type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ShowcaseKey =
  | "insights"
  | "labs"
  | "symptoms"
  | "opinions";

export type ShowcaseItem = {
  key: ShowcaseKey;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  reverse?: boolean;
};

export type SecurityItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export const navItems: NavItem[] = [
  { label: "Solutions", href: "#solutions", icon: ChevronDown },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources", icon: ChevronDown },
  { label: "For Labs", href: "#labs" },
];

export const benefitItems: BenefitItem[] = [
  {
    title: "Personalized Health Insights",
    description:
      "Get AI-powered virtual health assistance tailored to your medical history, symptoms, and lab results.",
    icon: HeartPulse,
  },
  {
    title: "Expert Second Opinions",
    description:
      "Validate your health insights with top US and European doctors to make more confident health decisions.",
    icon: Globe2,
  },
  {
    title: "24/7 Accessibility",
    description:
      "Access your AI health assistant anytime, anywhere, and in your native language.",
    icon: Languages,
  },
];

export const showcaseItems: ShowcaseItem[] = [
  {
    key: "insights",
    title: "Personalized Health Insights",
    description:
      "Get AI-powered virtual health assistance tailored to your medical history, symptoms, and lab results.",
    ctaLabel: "Chat With AI Doctor",
    href: "#hero",
  },
  {
    key: "labs",
    title: "Lab Test Interpretation",
    description:
      "Upload your blood, urine, or other lab results and receive AI-powered analysis, biomarker explanations, and personalized interpretation reports.",
    ctaLabel: "Interpret Lab Results",
    href: "#labs",
    reverse: true,
  },
  {
    key: "symptoms",
    title: "AI Symptom Checker",
    description:
      "Describe your symptoms in everyday language and get instant AI-powered insights into possible conditions, plus personalized recommendations on what to do next.",
    ctaLabel: "Check My Symptoms",
    href: "#symptoms",
  },
  {
    key: "opinions",
    title: "Expert Second Opinions",
    description:
      "Get the confidence to move forward with your local doctor by validating your diagnosis or treatment strategy with a top medical expert from the US or Europe.",
    ctaLabel: "Get Second Opinion",
    href: "#opinions",
    reverse: true,
  },
];

export const securityItems: SecurityItem[] = [
  {
    title: "Personally identifiable information is optional",
    description:
      "You can use the platform without sharing unnecessary personal details, which helps patients stay in control of their privacy.",
    icon: UserRoundSearch,
  },
  {
    title: "Protected by enterprise-grade security",
    description:
      "All data is protected by advanced security controls and aligned with HIPAA, GDPR, and SOC 2 expectations.",
    icon: ShieldCheck,
  },
  {
    title: "Guidance, not a replacement for clinicians",
    description:
      "The platform is designed to support informed decisions, not replace professional diagnosis, treatment, or emergency care.",
    icon: Stethoscope,
  },
];

export const testimonialItems: Testimonial[] = [
  {
    quote:
      "Dealing with health anxiety used to send me into a spiral. MediAI gives me concise guidance, explains my results clearly, and helps me know when to seek professional help.",
    name: "Alex T.",
    role: "Patient",
  },
  {
    quote:
      "The symptom summaries are easy to understand and the lab explanations make follow-up visits more productive. It feels like having a calm assistant before every appointment.",
    name: "Meron A.",
    role: "Parent",
  },
  {
    quote:
      "What stands out most is the clarity. I can upload my results, ask questions in simple language, and get responses that actually help me prepare for the next step.",
    name: "Samuel K.",
    role: "User",
  },
];

export const faqItems: FAQItem[] = [
  {
    question:
      "Can I use this app before going to a health center or hospital?",
    answer:
      "Yes. MediAI can help you organize symptoms, understand possible next steps, and prepare better questions before you see a clinician.",
  },
  {
    question:
      "Is this app a replacement for a doctor or only for guidance?",
    answer:
      "It is for guidance only. The platform supports patients with education and triage-like insights, but it does not replace licensed medical care.",
  },
  {
    question: "Who can use this platform, patients only or also clinicians?",
    answer:
      "The landing page is designed primarily for patients, but parts of the platform can also support clinicians, labs, and care teams.",
  },
  {
    question:
      "Can this system explain lab results from Ethiopian hospitals and clinics?",
    answer:
      "Yes. Lab explanations can be adapted to uploaded reports and reference ranges, while still encouraging confirmation with local clinicians.",
  },
  {
    question:
      "Are the normal ranges based on Ethiopian laboratory standards?",
    answer:
      "Reference intervals can vary by lab, equipment, and population. The platform should always present interpretation as contextual and not absolute.",
  },
  {
    question: "What does “out of range” mean in my blood test results?",
    answer:
      "It means a marker sits outside the reference interval listed by the lab. That does not always indicate disease, but it is a strong signal to review context and discuss it with a clinician.",
  },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Patient Product",
    links: [
      { label: "AI Health Assistant", href: "#hero" },
      { label: "AI Doctor", href: "#solutions" },
      { label: "Lab Test Interpretation", href: "#labs" },
      { label: "Symptom Checker", href: "#symptoms" },
      { label: "Second Opinion", href: "#opinions" },
    ],
  },
  {
    title: "Professional Solutions",
    links: [
      { label: "Lab Software", href: "#labs" },
      { label: "Doctor Platform", href: "#opinions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#resources" },
      { label: "Knowledge Base", href: "#resources" },
      { label: "Symptoms Guide", href: "#resources" },
      { label: "Glossary", href: "#resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Pricing", href: "#pricing" },
      { label: "Contact", href: "#contact" },
      { label: "Glossary", href: "#resources" },
    ],
  },
];

export const heroHighlights = [
  {
    icon: BrainCircuit,
    label: "AI symptom guidance",
  },
  {
    icon: FlaskConical,
    label: "Lab interpretation",
  },
  {
    icon: HeartHandshake,
    label: "Second opinions",
  },
];

export const socialIcons = [Sparkles, Activity, BookOpenText, ArrowRight, Bot, BadgeCheck, MessageCircleHeart];
