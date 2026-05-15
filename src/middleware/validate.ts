import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Returns middleware that validates req.body against the given Zod schema.
 * On failure throws a structured 400 — no boilerplate needed in each route.
 */
export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = (result.error as ZodError).issues[0];
      res.status(400).json({
        error: { code: "VALIDATION", message: issue?.message ?? "Invalid request body." },
      });
      return;
    }
    req.body = result.data;
    next();
  };
