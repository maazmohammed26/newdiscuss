import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('discuss_theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('dark', 'discuss');
    
    // Add appropriate theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'discuss') {
      root.classList.add('discuss');
    }
    
    localStorage.setItem('discuss_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
