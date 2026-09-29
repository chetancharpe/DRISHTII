import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types/user';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';

export interface SignupData {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  organization?: string;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password?: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => Promise<void>;
  // Dev-only demo helper calling real API with seeded credentials
  loginDemo?: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const role: UserRole = user?.role || 'candidate';
  const isAuthenticated = user !== null;

  const clearAuthError = () => setAuthError(null);

  // Initialize session from real backend /auth/me on initial load
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (!tokenStorage.hasToken()) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          tokenStorage.clearTokens();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { user: loggedInUser } = await authService.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      const message = err.message || "We couldn't sign you in. Check your email and password and try again.";
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || 'Candidate';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const { user: newUser } = await authService.signup({
        firstName,
        lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      setUser(newUser);
      return newUser;
    } catch (err: any) {
      const message = err.message || 'Unable to complete registration. Please verify your details and try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  // Dev-only demo account helper that makes REAL login calls against seeded accounts
  const loginDemo = import.meta.env.DEV
    ? async (targetRole: UserRole): Promise<User> => {
        if (targetRole === 'admin') {
          return await login('admin@gowow.org', 'AdminSecurePass123!');
        }
        if (targetRole === 'examiner') {
          return await login('examiner@gowow.org', 'ExaminerSecure123!');
        }
        return await login('candidate1@gowow.org', 'CandidateSecure123!');
      }
    : undefined;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        authError,
        clearAuthError,
        login,
        signup,
        logout,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
