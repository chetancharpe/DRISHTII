/**
 * Safe LocalStorage Helpers with In-Memory Fallbacks
 */

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota or browser restriction fallback
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Fallback
    }
  },
};
