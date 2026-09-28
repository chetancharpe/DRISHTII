import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { UserRole } from '../types/user';

export interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const { announce } = useAccessibility();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowedRoles.includes(role)) {
      announce(
        `Access restricted. The requested page is for ${allowedRoles.join(' or ')} only. Redirecting you to your ${role} dashboard.`,
        'assertive'
      );
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, announce]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background"
      >
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">Verifying access credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    const targetDashboard =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'examiner'
        ? '/examiner/dashboard'
        : '/candidate/dashboard';
    return <Navigate to={targetDashboard} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
