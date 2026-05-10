import { Navigate } from "react-router-dom";
import { getSession } from "../lib/session";
import type { ReactElement } from "react";
import type { Role, Zone } from "../types";

interface RequireAuthProps {
  zone: Zone;
  allowedRoles?: Role[];
  children: ReactElement;
}

export const RequireAuth = ({ zone, allowedRoles, children }: RequireAuthProps) => {
  const session = getSession();
  if (!session) {
    return <Navigate to={zone === "authority" ? "/authority/login" : "/login"} replace />;
  }
  if (session.zone !== zone) {
    return <Navigate to={session.zone === "authority" ? "/authority/queue" : "/app/home"} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to="/authority/queue" replace />;
  }
  return children;
};
