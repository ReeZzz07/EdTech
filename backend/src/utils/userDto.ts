import type { User } from "@prisma/client";

export function userToJson(user: User) {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    avatar: user.avatar,
    coinBalance: user.coinBalance,
    level: user.level,
    experience: user.experience,
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil,
    dailyStreak: user.dailyStreak,
    lastActiveDate: user.lastActiveDate,
    schoolName: user.schoolName,
    grade: user.grade,
    settings: user.settings,
    onboardingComplete: user.onboardingComplete,
    totalProblemsSolved: user.totalProblemsSolved,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
