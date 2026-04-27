export type SubjectDto = {
  id: string;
  code: string;
  name: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type UserDto = {
  id: string;
  telegramId: string;
  firstName: string;
  coinBalance: number;
  level: number;
  experience: number;
  dailyStreak: number;
  onboardingComplete: boolean;
  totalProblemsSolved: number;
};
