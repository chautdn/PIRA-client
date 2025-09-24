import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';
import { ROUTES } from '../../utils/constants';

const RoleProtectedRoute = ({ children, allowedRoles = [], fallbackRoute = ROUTES.HOME }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check if user role is in allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role?.toUpperCase())) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};

export default RoleProtectedRoute;