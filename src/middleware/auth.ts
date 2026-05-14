import { Request, Response, NextFunction } from "express";
import { verifyAccess, AccessPayload, Zone, Role } from "../lib/tokens";

export interface AuthRequest extends Request {
  auth?: AccessPayload;
  rawBody?: Buffer;
}

export const requireAuth = (zone?: Zone | null) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token." } });
      return;
    }
    try {
      const payload = verifyAccess(header.slice(7));
      if (payload.type !== "access") {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token type." } });
        return;
      }
      if (zone && payload.zone !== zone) {
        res.status(403).json({ error: { code: "FORBIDDEN", message: "Wrong zone." } });
        return;
      }
      req.auth = payload;
      next();
    } catch (_err) {
      res.status(401).json({ error: { code: "TOKEN_EXPIRED", message: "Token expired or invalid." } });
    }
  };
};

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient role." } });
      return;
    }
    next();
  };
};

/** Coerce Express query/param string | string[] to string */
export const asStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
