import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../common/Loading";
import { ROUTES } from "../../utils/constants";

const RoleProtectedRoute = ({
  children,
  allowedRoles = [],
  fallbackRoute = ROUTES.HOME,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check if user role is in allowed roles (case-insensitive)
  if (allowedRoles.length > 0) {
    const userRole = (user.role || "").toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toUpperCase()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.warn(
        `Access denied: User role "${userRole}" not in allowed roles:`,
        normalizedAllowedRoles
      );
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;
