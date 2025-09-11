import type { HabitTemplate } from '@/types/habit-stacking';

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Productivity Habits
  {
    id: 'prod-1',
    title: 'Set 3 Daily Priorities',
    description: 'Write down the 3 most important tasks for the day',
    category: 'productivity',
    estimatedDuration: 2,
    difficulty: 'easy',
    tags: ['planning', 'focus', 'priorities'],
    icon: '🎯'
  },
  {
    id: 'prod-2',
    title: 'Clear Digital Desktop',
    description: 'Organize files and close unnecessary browser tabs',
    category: 'productivity',
    estimatedDuration: 3,
    difficulty: 'easy',
    tags: ['organization', 'digital', 'cleanup'],
    icon: '🖥️'
  },
  {
    id: 'prod-3',
    title: 'Review Day Accomplishments',
    description: 'Reflect on what was completed and what went well',
    category: 'productivity',
    estimatedDuration: 5,
    difficulty: 'easy',
    tags: ['reflection', 'review', 'accomplishments'],
    icon: '✅'
  },

  // Wellness Habits
  {
    id: 'well-1',
    title: 'Drink Water',
    description: 'Drink a full glass of water to stay hydrated',
    category: 'wellness',
    estimatedDuration: 1,
    difficulty: 'easy',
    tags: ['hydration', 'health', 'energy'],
    icon: '💧'
  },
  {
    id: 'well-2',
    title: '2-Minute Stretch',
    description: 'Simple stretches to relieve tension and improve posture',
    category: 'wellness',
    estimatedDuration: 2,
    difficulty: 'easy',
    tags: ['movement', 'posture', 'tension-relief'],
    icon: '🤸'
  },
  {
    id: 'well-3',
    title: 'Deep Breathing',
    description: 'Take 5 slow, deep breaths to center yourself',
    category: 'wellness',
    estimatedDuration: 1,
    difficulty: 'easy',
    tags: ['breathing', 'calm', 'stress-relief'],
    icon: '🫁'
  },

  // Mindfulness Habits
  {
    id: 'mind-1',
    title: 'Gratitude Note',
    description: 'Write one thing you\'re grateful for today',
    category: 'mindfulness',
    estimatedDuration: 1,
    difficulty: 'easy',
    tags: ['gratitude', 'positivity', 'reflection'],
    icon: '🙏'
  },
  {
    id: 'mind-2',
    title: 'Mindful Transition',
    description: 'Take a moment to be present before starting the next task',
    category: 'mindfulness',
    estimatedDuration: 1,
    difficulty: 'easy',
    tags: ['presence', 'transition', 'awareness'],
    icon: '🧘'
  },
  {
    id: 'mind-3',
    title: 'Set Intention',
    description: 'Define your intention or mindset for the upcoming activity',
    category: 'mindfulness',
    estimatedDuration: 2,
    difficulty: 'easy',
    tags: ['intention', 'focus', 'mindset'],
    icon: '🎯'
  },

  // Learning Habits
  {
    id: 'learn-1',
    title: 'Read One Page',
    description: 'Read one page of a book or article',
    category: 'learning',
    estimatedDuration: 3,
    difficulty: 'easy',
    tags: ['reading', 'knowledge', 'growth'],
    icon: '📚'
  },
  {
    id: 'learn-2',
    title: 'Learn New Word',
    description: 'Look up and learn the meaning of one new word',
    category: 'learning',
    estimatedDuration: 2,
    difficulty: 'easy',
    tags: ['vocabulary', 'language', 'knowledge'],
    icon: '📝'
  },
  {
    id: 'learn-3',
    title: 'Skill Practice',
    description: 'Practice a skill for a few minutes (instrument, language, etc.)',
    category: 'learning',
    estimatedDuration: 5,
    difficulty: 'medium',
    tags: ['practice', 'skill-building', 'improvement'],
    icon: '🎵'
  },

  // Organization Habits
  {
    id: 'org-1',
    title: 'Tidy Workspace',
    description: 'Spend 2 minutes organizing your immediate workspace',
    category: 'organization',
    estimatedDuration: 2,
    difficulty: 'easy',
    tags: ['workspace', 'organization', 'environment'],
    icon: '🗂️'
  },
  {
    id: 'org-2',
    title: 'Inbox Zero Check',
    description: 'Quickly scan and organize 5 emails',
    category: 'organization',
    estimatedDuration: 3,
    difficulty: 'easy',
    tags: ['email', 'inbox', 'communication'],
    icon: '📧'
  },
  {
    id: 'org-3',
    title: 'Tomorrow Prep',
    description: 'Prepare one thing for tomorrow to make it easier',
    category: 'organization',
    estimatedDuration: 3,
    difficulty: 'easy',
    tags: ['preparation', 'planning', 'efficiency'],
    icon: '📅'
  }
];

export const getHabitTemplatesByCategory = (category: HabitTemplate['category']) => {
  return HABIT_TEMPLATES.filter(template => template.category === category);
};

export const getHabitTemplateById = (id: string) => {
  return HABIT_TEMPLATES.find(template => template.id === id);
};

export const getEasyHabits = () => {
  return HABIT_TEMPLATES.filter(template => template.difficulty === 'easy');
};

export const getHabitsByDuration = (maxDuration: number) => {
  return HABIT_TEMPLATES.filter(template => template.estimatedDuration <= maxDuration);
};
