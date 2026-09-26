import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types/accessibility';
import { storage } from '../utils/storage';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark' | 'high_contrast';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'gowow_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return storage.get<ThemeMode>(THEME_STORAGE_KEY, 'dark');
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'high_contrast'>('dark');

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storage.set(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('high_contrast');
    else if (theme === 'high_contrast') setTheme('system');
    else setTheme('dark');
  };

  useEffect(() => {
    const resolveAndApply = () => {
      let active: 'light' | 'dark' | 'high_contrast' = 'dark';

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = prefersDark ? 'dark' : 'light';
      } else {
        active = theme;
      }

      setResolvedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
    };

    resolveAndApply();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => resolveAndApply();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
