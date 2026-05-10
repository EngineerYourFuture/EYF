import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type Zone = "public" | "authority";
export type Role = "user" | "staff" | "admin";

export interface AccessPayload {
  sub: string;
  role: Role;
  plan: string;
  sessionId: string;
  zone: Zone;
  type: "access";
  jti: string;
}

export interface RefreshPayload {
  sub: string;
  sessionId: string;
  familyId: string;
  type: "refresh";
  jti: string;
}

export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const issueAccessToken = (
  userId: string,
  role: Role,
  plan: string,
  sessionId: string,
  zone: Zone
): string => {
  const payload: AccessPayload = {
    sub: userId,
    role,
    plan,
    sessionId,
    zone,
    type: "access",
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: "15m" });
};

export const issueRefreshToken = (
  userId: string,
  sessionId: string,
  familyId: string
): { token: string; hash: string } => {
  const jti = crypto.randomUUID();
  const payload: RefreshPayload = {
    sub: userId,
    sessionId,
    familyId,
    type: "refresh",
    jti,
  };
  const token = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "30d" });
  const hash = sha256(token);
  return { token, hash };
};

export const verifyAccess = (token: string): AccessPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
};

export const verifyRefresh = (token: string): RefreshPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshPayload;
};
