import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types/user';
import { MOCK_CANDIDATE, MOCK_EXAMINER, MOCK_ADMIN } from '../utils/mockData';
import { storage } from '../utils/storage';

export interface SignupData {
  name: string;
  email: string;
  role: UserRole;
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
  login: (email: string, password?: string, targetRole?: UserRole) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AUTH_USER_STORAGE_KEY = 'gowow_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Default to mock candidate so candidate views are immediately previewable during development
    return storage.get<User | null>(AUTH_USER_STORAGE_KEY, MOCK_CANDIDATE);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const role: UserRole = user?.role || 'candidate';
  const isAuthenticated = user !== null;

  const clearAuthError = () => setAuthError(null);

  const login = async (email: string, password?: string, targetRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Simulate network response latency
      await new Promise((resolve) => setTimeout(resolve, 350));

      const normalizedEmail = email.trim().toLowerCase();

      // Mock validation failure check for test accounts
      if (normalizedEmail === 'error@gowow.demo' || password === 'wrongpassword') {
        const errorMsg = "We couldn't sign you in. Check your email and password and try again.";
        setAuthError(errorMsg);
        throw new Error(errorMsg);
      }

      // Determine mock role based on demo accounts or targetRole parameter
      let resolvedRole: UserRole = targetRole || 'candidate';
      if (normalizedEmail.includes('examiner') || normalizedEmail === 'examiner@gowow.demo') {
        resolvedRole = 'examiner';
      } else if (normalizedEmail.includes('admin') || normalizedEmail === 'admin@gowow.demo') {
        resolvedRole = 'admin';
      }

      const baseAccount =
        resolvedRole === 'examiner'
          ? MOCK_EXAMINER
          : resolvedRole === 'admin'
          ? MOCK_ADMIN
          : MOCK_CANDIDATE;

      const loggedInUser: User = {
        ...baseAccount,
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        role: resolvedRole,
      };

      setUser(loggedInUser);
      storage.set(AUTH_USER_STORAGE_KEY, loggedInUser);
      return loggedInUser;
    } catch (err) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("We couldn't sign you in. Check your email and password and try again.");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Simulate account creation network latency
      await new Promise((resolve) => setTimeout(resolve, 400));

      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        accessibilityPreferences: {
          fontSize: 'default',
          contrast: 'standard',
          theme: 'dark',
          audioEnabled: false,
          speechRate: 'normal',
          readQuestions: true,
          readOptions: true,
          readInstructions: true,
          announceStatus: true,
          timerAnnouncements: 'warnings',
          keyboardFirst: false,
          screenReaderOptimized: false,
          reducedMotion: 'system',
          simplifiedInterface: false,
          language: data.preferredLanguage || 'en',
          highContrast: false,
          audioFeedbackEnabled: false,
          keyboardOnlyMode: false,
          preferredLanguage: data.preferredLanguage || 'en',
        },
      };

      setUser(newUser);
      storage.set(AUTH_USER_STORAGE_KEY, newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthError(null);
    storage.remove(AUTH_USER_STORAGE_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    const mock =
      newRole === 'examiner' ? MOCK_EXAMINER : newRole === 'admin' ? MOCK_ADMIN : MOCK_CANDIDATE;
    setUser(mock);
    setAuthError(null);
    storage.set(AUTH_USER_STORAGE_KEY, mock);
  };

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
        switchRole,
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
