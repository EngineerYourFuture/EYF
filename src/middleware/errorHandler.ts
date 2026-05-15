import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { AppError } from "../lib/AppError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Prisma unique constraint violation → conflict
  if ((err as { code?: string }).code === "P2002") {
    res.status(409).json({ error: { code: "CONFLICT", message: "A record with that value already exists." } });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error." } });
};
