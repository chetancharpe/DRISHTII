import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/user';

export interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to the candidate dashboard by default if forbidden
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
