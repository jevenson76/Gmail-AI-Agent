// Performance monitoring utilities
export interface PerformanceMetrics {
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

export function capturePerformanceMetrics(): PerformanceMetrics {
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintEntries = performance.getEntriesByType('paint');
  const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0];

  return {
    timeToFirstByte: navigationEntry.responseStart - navigationEntry.requestStart,
    firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    largestContentfulPaint: lcpEntry ? lcpEntry.startTime : 0,
    timeToInteractive: navigationEntry.domInteractive - navigationEntry.requestStart
  };
}

export function reportPerformanceMetrics() {
  if (!window.performance || !window.performance.getEntriesByType) {
    console.warn('Performance API not supported');
    return;
  }

  // Wait for LCP to be available
  new PerformanceObserver((entryList) => {
    const metrics = capturePerformanceMetrics();
    console.info('[Performance Metrics]:', metrics);
    
    // Here you would typically send these metrics to your analytics service
    // For now, we'll just log them
    if (metrics.largestContentfulPaint > 2500) {
      console.warn('LCP is above recommended threshold (2.5s)');
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
}