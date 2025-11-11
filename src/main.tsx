import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import './index.css';
import { initCacheBusting } from './utils/cacheBusting';

// Initialize cache busting to prevent style/asset caching issues
initCacheBusting();

// Force clear browser cache on app start
if (typeof window !== 'undefined') {
  const rootElement = document.documentElement;
  const storedTheme = window.localStorage.getItem('app-theme');
  const initialTheme = storedTheme === 'light' ? 'light' : 'dark';

  rootElement.classList.remove('light', 'dark');
  rootElement.classList.add(initialTheme);

  if (!storedTheme) {
    window.localStorage.setItem('app-theme', initialTheme);
    window.dispatchEvent(new Event('themeChange'));
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  </StrictMode>
);
