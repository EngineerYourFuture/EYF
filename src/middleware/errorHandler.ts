import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error." } });
};
