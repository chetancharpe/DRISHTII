/**
 * Real Production API Client for GoWow Platform
 * Handles:
 * - Base URL from VITE_API_BASE_URL
 * - Bearer JWT from tokenStorage
 * - Typed ApiError mapping { error: { code, message, details } } to accessible plain-language messages
 * - One-time automatic token refresh on 401 via /auth/refresh
 * - Request timeout via AbortController (default 15s)
 * - Exponential backoff retry policy for idempotent GET requests only
 * - Preservation / generation of X-Request-ID
 */

import { tokenStorage } from '../utils/tokenStorage';

const DEFAULT_RENDER_BACKEND = 'https://drishtii-1d0b.onrender.com/api/v1';

let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_RENDER_BACKEND).trim().replace(/\/+$/, '');
if (rawBaseUrl.includes('<') || rawBaseUrl.includes('>') || rawBaseUrl.includes('your-render-backend-url') || !rawBaseUrl) {
  rawBaseUrl = DEFAULT_RENDER_BACKEND;
}

export const API_BASE_URL = rawBaseUrl.endsWith('/api/v1') ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

export interface BackendErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown;
    retry_after_seconds?: number;
  };
}

export class ApiError extends Error {
  public code: string;
  public details?: unknown;
  public status: number;
  public retryAfterSeconds?: number;

  constructor(code: string, message: string, status: number, details?: unknown, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface ApiRequestOptions extends RequestInit {
  token?: string | null;
  skipAuth?: boolean;
  timeoutMs?: number;
  retries?: number;
}

// Plain-language translations for technical error codes to ensure screen-reader friendliness
function mapErrorCodeToMessage(code: string, rawMessage: string): string {
  switch (code) {
    case 'WEAK_PASSWORD':
      return 'Password does not meet security requirements. Use at least 8 characters with uppercase, lowercase, numbers, and symbols.';
    case 'INVALID_CREDENTIALS':
    case 'UNAUTHORIZED':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'ACCOUNT_DEACTIVATED':
      return 'This account is currently deactivated. Please contact support or an administrator.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests were sent in a short time. Please wait a moment and try again.';
    case 'VALIDATION_CONFLICT':
      return 'An account with this email address already exists. Please sign in or use a different email.';
    case 'EXAM_EXPIRED':
      return 'The official deadline for this examination has ended. Answers can no longer be accepted.';
    case 'ALREADY_SUBMITTED':
      return 'This examination session has already been submitted and completed.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'NOT_FOUND':
      return 'The requested resource could not be found.';
    default:
      return rawMessage || 'An unexpected error occurred. Please try again or contact support.';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      tokenStorage.setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    token,
    skipAuth = false,
    timeoutMs = 45000,
    retries = 2,
    headers = {},
    ...rest
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Correlation / Request ID tracking
  const requestId =
    (headers as Record<string, string>)['X-Request-ID'] ||
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const executeRequest = async (overrideToken?: string | null): Promise<Response> => {
    const activeToken = overrideToken !== undefined ? overrideToken : token || tokenStorage.getAccessToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(headers as Record<string, string>),
    };

    if (!skipAuth && activeToken) {
      requestHeaders['Authorization'] = `Bearer ${activeToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...rest,
        method,
        headers: requestHeaders,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Execution with idempotent GET retry policy
  let lastError: Error | null = null;
  const maxAttempts = isGet ? retries + 1 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await executeRequest();

      // Handle 401 Unauthorized token expiration with one-time rotation
      if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = attemptTokenRefresh().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        if (newAccessToken) {
          // Retry the original request with the fresh access token
          const retryResponse = await executeRequest(newAccessToken);
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return {} as T;
            return (await retryResponse.json()) as T;
          }
        } else {
          // Session definitively dead; clear tokens and notify
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/login?session_expired=true';
          }
        }
      }

      // Handle Empty No-Content Responses
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON response or structured error
      const contentType = response.headers.get('content-type') || '';
      let responseData: any = null;
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      }

      if (!response.ok) {
        const errorBody = responseData as BackendErrorShape | null;
        const code = errorBody?.error?.code || `HTTP_${response.status}`;
        const rawMessage = errorBody?.error?.message || response.statusText;
        const plainMessage = mapErrorCodeToMessage(code, rawMessage);
        const retryAfter = errorBody?.error?.retry_after_seconds;

        throw new ApiError(code, plainMessage, response.status, errorBody?.error?.details, retryAfter);
      }

      return responseData as T;
    } catch (err: any) {
      lastError = err;

      // Do not retry 4xx client errors or non-GET mutations
      if (err instanceof ApiError && err.status < 500) {
        throw err;
      }

      // If attempts remain for GET, delay with exponential backoff
      if (isGet && attempt < maxAttempts) {
        const backoffMs = attempt * 300;
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      break;
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  // Network offline or timeout failure
  throw new ApiError(
    'NETWORK_ERROR',
    'Unable to connect to the examination server. Please check your internet connection and try again.',
    0,
    lastError?.message
  );
}

apiClient.get = function <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

apiClient.post = function <T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.patch = function <T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.put = function <T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.delete = function <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};
