import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUser?: User;
    }
  }
}

export {};
