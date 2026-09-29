import { apiClient } from './api';
import { tokenStorage } from '../utils/tokenStorage';
import { User, UserRole } from '../types/user';

export interface BackendUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions?: string[];
  is_active: boolean;
}

export interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: BackendUserResponse;
}

export function mapBackendUserToClient(backendUser: BackendUserResponse): User {
  const role = (backendUser.role || 'CANDIDATE').toLowerCase() as UserRole;
  return {
    id: backendUser.id,
    name: `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim() || backendUser.email,
    email: backendUser.email,
    role: role === 'examiner' ? 'examiner' : role === 'admin' ? 'admin' : 'candidate',
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
      language: 'en',
      highContrast: false,
      audioFeedbackEnabled: false,
      keyboardOnlyMode: false,
      preferredLanguage: 'en',
    },
  };
}

export const authService = {
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await apiClient<BackendTokenResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    tokenStorage.setTokens(res.access_token, res.refresh_token);
    const user = mapBackendUserToClient(res.user);
    return { user, token: res.access_token };
  },

  async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await apiClient<BackendTokenResponse>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password || 'CandidateSecure123!',
        role: data.role ? data.role.toUpperCase() : 'CANDIDATE',
      }),
    });

    tokenStorage.setTokens(res.access_token, res.refresh_token);
    const user = mapBackendUserToClient(res.user);
    return { user, token: res.access_token };
  },

  async getCurrentUser(): Promise<User | null> {
    if (!tokenStorage.hasToken()) {
      return null;
    }

    try {
      const res = await apiClient<BackendUserResponse>('/auth/me');
      return mapBackendUserToClient(res);
    } catch {
      tokenStorage.clearTokens();
      return null;
    }
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async requestPasswordReset(email: string): Promise<string> {
    const res = await apiClient<{ status: string; message: string }>('/auth/forgot-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return res.message;
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const res = await apiClient<{ status: string; message: string }>('/auth/reset-password', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return res.message;
  },
};
