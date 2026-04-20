export type ChatMode = "personal" | "general";

export type DoctorTypeOption = {
  id: ChatMode;
  title: string;
  shortLabel: string;
  description: string;
};

export type HistoryItem = {
  title: string;
  createdAt: string;
  lastMessageAt: string;
  summary: string;
  type: ChatMode;
};

export const doctorTypeOptions: DoctorTypeOption[] = [
  {
    id: "personal",
    title: "Joe's AI Doctor",
    shortLabel: "Personal AI Doctor",
    description:
      "Your health details are utilized to offer more personalized advice and insights",
  },
  {
    id: "general",
    title: "General Chat",
    shortLabel: "General Chat",
    description:
      "General chat doesn't use any saved health details or previous conversations",
  },
];

export const chatHistoryItems: HistoryItem[] = [
  {
    title: "Headache symptoms explanation",
    createdAt: "02 Apr, 9:55 AM",
    lastMessageAt: "02 Apr, 9:55 AM",
    summary: "Not generated",
    type: "personal",
  },
  {
    title: "Headache symptoms explanation",
    createdAt: "02 Apr, 9:55 AM",
    lastMessageAt: "02 Apr, 9:55 AM",
    summary: "Not generated",
    type: "general",
  },
  {
    title: "Headache symptoms explanation",
    createdAt: "02 Apr, 9:55 AM",
    lastMessageAt: "02 Apr, 9:55 AM",
    summary: "Not generated",
    type: "personal",
  },
];

export const seededPersonalConversation = [
  {
    role: "user" as const,
    author: "Joe",
    content: "I'm having a headache",
  },
  {
    role: "assistant" as const,
    author: "AI Doctor",
    content:
      "Can you describe the characteristics of your headache? Specifically, where is it located, how intense is it, how long does it last, and are there any associated symptoms like nausea or visual disturbances? Have you noticed any recent changes in your lifestyle, stress levels, or sleep patterns that might be contributing to the headache? Do you have a history of migraines or other types of headaches? Are there any known triggers, such as certain foods, lack of hydration, or exposure to bright lights? Have you taken any medications or tried any remedies to alleviate the headache, and were they effective?",
  },
] as const;

export function getAssistantPrompt(mode: ChatMode) {
  if (mode === "personal") {
    return "I'm here to support with any health-related questions based on your personal profile.";
  }

  return "I'm here to support with any general health-related questions.";
}

export function getReplyForMode(mode: ChatMode, message: string) {
  if (mode === "personal") {
    return `I can help with that. Based on your profile, tell me more about "${message}" including when it started, what makes it better or worse, and whether you have any related symptoms.`;
  }

  return `I can help with your question about "${message}". Please share more detail about the symptom, duration, and any related concerns so I can give general guidance.`;
}
