export type Role = "user" | "staff" | "admin";
export type Zone = "public" | "authority";

export interface SessionState {
  accessToken: string;
  userId?: string;
  role: Role;
  zone: Zone;
  email?: string;
}
