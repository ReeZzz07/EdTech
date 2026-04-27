import type { NextFunction, Request, RequestHandler, Response } from "express";

type RouteFn = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>;

export function asyncHandler(fn: RouteFn): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
