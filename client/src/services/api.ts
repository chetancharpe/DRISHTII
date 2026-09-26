/**
 * Core API Client Foundation
 * Centralized fetch wrapper prepared for future FastAPI / OAuth2 bearer token authentication.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Future FastAPI connection point:
  // e.g. const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: requestHeaders, ...rest });
  // For Phase 1, log endpoint and options in dev mode if needed:
  if (Boolean(endpoint) && Boolean(rest)) {
    // Intentionally uninvoked placeholder to ensure typed interface stability
  }

  // Phase 1 Architecture: Stub response
  return Promise.resolve({} as T);
}
