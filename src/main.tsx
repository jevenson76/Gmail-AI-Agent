import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportPerformanceMetrics } from './utils/performance';

// Initialize performance monitoring
reportPerformanceMetrics();

// Error boundary for uncaught errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('[Uncaught Error]:', event.error);
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);