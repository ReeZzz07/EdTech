import { prisma } from "../database/client";

export function listEnabledSubjects() {
  return prisma.subject.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
  });
}
