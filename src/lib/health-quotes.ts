export type HealthQuote = {
  text: string;
  author?: string;
};

/** Rotated on the dashboard home — health, wellness, and motivation. */
export const HEALTH_MOTIVATION_QUOTES: readonly HealthQuote[] = [
  {
    text: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn",
  },
  {
    text: "Health is not valued till sickness comes.",
    author: "Thomas Fuller",
  },
  {
    text: "The greatest wealth is health.",
    author: "Virgil",
  },
  {
    text: "Your body hears everything your mind says. Stay positive.",
  },
  {
    text: "Small steps every day lead to big changes in your health.",
  },
  {
    text: "Rest when you're weary. Refresh and renew yourself. Then get back to work.",
    author: "Ralph Marston",
  },
  {
    text: "He who has health has hope; and he who has hope has everything.",
    author: "Thomas Carlyle",
  },
  {
    text: "Wellness is the complete integration of body, mind, and spirit.",
    author: "Greg Anderson",
  },
  {
    text: "Every human being is the author of their own health or disease.",
    author: "Buddha",
  },
  {
    text: "A healthy outside starts from the inside.",
    author: "Robert Urich",
  },
  {
    text: "Self-care is not selfish. You cannot serve from an empty vessel.",
    author: "Eleanor Brown",
  },
  {
    text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.",
    author: "Carol Welch",
  },
  {
    text: "Sleep is the best meditation.",
    author: "Dalai Lama",
  },
  {
    text: "Let food be thy medicine and medicine be thy food.",
    author: "Hippocrates",
  },
  {
    text: "Water is life. Stay hydrated and stay sharp.",
  },
  {
    text: "Prevention is better than cure.",
    author: "Desiderius Erasmus",
  },
  {
    text: "Your health account, your bank account: they're the same thing. The more you put in, the more you can take out.",
    author: "Jack LaLanne",
  },
  {
    text: "Happiness is the highest form of health.",
    author: "Dalai Lama",
  },
  {
    text: "Take time to do what makes your soul happy — it heals the body too.",
  },
  {
    text: "Breathe deeply. Calm your mind. Your nervous system will thank you.",
  },
  {
    text: "One small positive thought in the morning can change your whole day.",
  },
  {
    text: "You don't have to be perfect to be healthy. You just have to be consistent.",
  },
  {
    text: "Walking is man's best medicine.",
    author: "Hippocrates",
  },
  {
    text: "The mind and body are not separate. What affects one, affects the other.",
  },
  {
    text: "Nourish your body with whole foods, clear water, and kind thoughts.",
  },
  {
    text: "Stress is not what happens to us. It's our response to what happens. Response is something we can choose.",
    author: "Hans Selye",
  },
  {
    text: "An ounce of prevention is worth a pound of cure.",
    author: "Benjamin Franklin",
  },
  {
    text: "Health is a state of complete harmony of the body, mind, and spirit.",
    author: "B.K.S. Iyengar",
  },
  {
    text: "Listen to your body when it whispers so you don't have to hear it scream.",
  },
  {
    text: "Progress, not perfection, is what sustainable health looks like.",
  },
  {
    text: "Sunlight, fresh air, and a short walk can reset more than you think.",
  },
  {
    text: "Gratitude improves sleep, mood, and immunity — science agrees.",
  },
  {
    text: "Your future self will thank you for the healthy choice you make today.",
  },
  {
    text: "Strength does not come from physical capacity. It comes from an indomitable will.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Care for your mind as diligently as you care for your body.",
  },
  {
    text: "A good laugh and a long sleep are the two best cures for anything.",
    author: "Irish proverb",
  },
  {
    text: "Healing takes time, and asking for help is a courageous part of the process.",
  },
  {
    text: "You are allowed to be both a masterpiece and a work in progress.",
  },
  {
    text: "Healthy habits are built one decision at a time, not all at once.",
  },
  {
    text: "When you recover or discover something that nourishes your soul, care for it.",
    author: "Audre Lorde",
  },
  {
    text: "The part can never be well unless the whole is well.",
    author: "Plato",
  },
];

/** How long each quote stays visible before transitioning (ms). */
export const HEALTH_QUOTE_ROTATE_MS = 4 * 60 * 1000;
