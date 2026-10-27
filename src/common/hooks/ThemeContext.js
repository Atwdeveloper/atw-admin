"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Generate storage key based on user type and ID
const getStorageKey = (userType, userId) => {
  if (!userType) return 'theme-preference';
  return `${userType}-${userId || 'default'}-theme`;
};

// Read the persisted theme (or OS preference) synchronously so the very first
// render already has the correct value. This avoids a race where the default
// 'light' would be written back to localStorage before the saved value loads
// (which previously caused the theme to reset to light on a full page reload).
const getInitialTheme = (userType, userId) => {
  try {
    const saved = localStorage.getItem(getStorageKey(userType, userId));
    if (saved === 'light' || saved === 'dark') return saved;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch (e) {
    // localStorage may be unavailable (private mode / SSR); fall through
  }
  return 'light';
};

export const ThemeProvider = ({ children, userType, userId }) => {
  const [theme, setTheme] = useState(() => getInitialTheme(userType, userId));

  useEffect(() => {
    // Apply the Tailwind `dark` class and persist whenever the theme changes.
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(getStorageKey(userType, userId), theme);
    } catch (e) {
      /* ignore persistence errors */
    }
  }, [theme, userType, userId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};