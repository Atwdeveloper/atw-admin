"use client";

import { useTheme } from '../hooks/ThemeContext';
import { SunIcon, MoonIcon } from 'lucide-react';

const ThemeToggle = ({ size = 'md', showLabel = true, variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5'
  };
  
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
    minimal: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    primary: 'bg-blue-600 dark:bg-blue-700 text-white'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center gap-2 rounded-lg transition-all duration-300
        ${sizeClasses[size]} ${variants[variant]}
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {showLabel && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark Mode
            </span>
          )}
        </>
      ) : (
        <>
          <SunIcon className="h-5 w-5 text-yellow-400" />
          {showLabel && (
            <span className="text-sm font-medium text-gray-300">
              Light Mode
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default ThemeToggle;