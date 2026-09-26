import { AccessibilityPreferences } from './accessibility';

export type UserRole = 'candidate' | 'examiner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accessibilityPreferences: AccessibilityPreferences;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
