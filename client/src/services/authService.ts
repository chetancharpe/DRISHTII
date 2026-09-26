import { User } from '../types/user';
import { MOCK_CANDIDATE } from '../utils/mockData';

/**
 * Authentication Service
 * Prepares endpoints for FastAPI OAuth2 / JWT integration:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/signup
 * - POST /api/v1/auth/logout
 * - GET  /api/v1/auth/me
 */
export const authService = {
  async login(email: string, _password: string): Promise<{ user: User; token: string }> {
    // Future FastAPI connection:
    // return apiClient<{ user: User; token: string }>('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ username: email, password }),
    // });
    return {
      user: { ...MOCK_CANDIDATE, email },
      token: 'mock-jwt-bearer-token',
    };
  },

  async signup(data: { name: string; email: string; role: string }): Promise<{ user: User; token: string }> {
    // Future FastAPI connection:
    // return apiClient('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
    return {
      user: { ...MOCK_CANDIDATE, name: data.name, email: data.email },
      token: 'mock-jwt-bearer-token',
    };
  },

  async getCurrentUser(): Promise<User | null> {
    // Future FastAPI connection:
    // return apiClient<User>('/auth/me');
    return MOCK_CANDIDATE;
  },

  async logout(): Promise<void> {
    // Future FastAPI connection:
    // return apiClient('/auth/logout', { method: 'POST' });
  },
};
