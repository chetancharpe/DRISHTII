const ACCESS_TOKEN_KEY = 'gowow_access_token';
const REFRESH_TOKEN_KEY = 'gowow_refresh_token';

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    if (inMemoryRefreshToken) return inMemoryRefreshToken;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken: string): void {
    inMemoryAccessToken = accessToken;
    inMemoryRefreshToken = refreshToken;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // Quota or incognito storage restriction fallback
    }
  },

  clearTokens(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignored
    }
  },

  hasToken(): boolean {
    return Boolean(this.getAccessToken());
  },
};
