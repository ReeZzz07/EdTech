export type SubjectDto = {
  id: string;
  code: string;
  name: string;
  isEnabled: boolean;
  sortOrder: number;
  skillMap?: unknown;
};

export type UserDto = {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  avatar?: string | null;
  coinBalance: number;
  level: number;
  experience: number;
  isPremium?: boolean;
  premiumUntil?: string | null;
  dailyStreak: number;
  onboardingComplete: boolean;
  totalProblemsSolved: number;
  /** Попыток разбора с начала UTC-суток */
  attemptsToday?: number;
  /** null — безлимит (Premium) */
  dailySolveLimit?: number | null;
  xpPerLevel?: number;
};
