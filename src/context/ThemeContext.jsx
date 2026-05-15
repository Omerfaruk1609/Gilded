import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.body.className = mode; // For non-MUI CSS
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode palette
                primary: { main: '#D4AF37' },
                background: {
                  default: '#f5f3e9',
                  paper: '#FAF9F6',
                },
                text: {
                  primary: '#1a1a1a',
                  secondary: '#666666',
                },
              }
            : {
                // Dark mode palette
                primary: { main: '#D4AF37' },
                background: {
                  default: '#050505',
                  paper: '#1a1a1a',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#aaaaaa',
                },
              }),
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
