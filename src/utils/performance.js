// Performance monitoring utilities for production optimization

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Measure component render times
  startMeasure(name) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(name, { startTime, name });
    
    return () => this.endMeasure(name);
  }

  endMeasure(name) {
    if (!this.isEnabled) return;
    
    const endTime = performance.now();
    const measurement = this.metrics.get(name);
    
    if (measurement) {
      const duration = endTime - measurement.startTime;
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
      
      // Warn about slow renders
      if (duration > 16) {
        console.warn(`🐌 Slow render detected in ${name}: ${duration.toFixed(2)}ms`);
      }
      
      this.metrics.delete(name);
    }
  }

  // Monitor LCP (Largest Contentful Paint)
  observeLCP() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.set('lcp', observer);
  }

  // Monitor CLS (Cumulative Layout Shift)
  observeCLS() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    this.observers.set('cls', observer);
  }

  // Monitor FID (First Input Delay)
  observeFID() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      console.log(`📊 FID: ${firstEntry.processingStart - firstEntry.startTime}ms`);
    });
    
    observer.observe({ type: 'first-input', buffered: true });
    this.observers.set('fid', observer);
  }

  // Monitor memory usage
  observeMemory() {
    if (!this.isEnabled || !performance.memory) return;
    
    const logMemory = () => {
      const memory = performance.memory;
      console.log(`🧠 Memory - Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB, Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`);
    };
    
    // Log memory every 30 seconds
    const interval = setInterval(logMemory, 30000);
    this.observers.set('memory', { disconnect: () => clearInterval(interval) });
  }

  // Monitor long tasks
  observeLongTasks() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`⏰ Long task detected: ${entry.duration.toFixed(2)}ms`);
      }
    });
    
    observer.observe({ type: 'longtask', buffered: true });
    this.observers.set('longtask', observer);
  }

  // Initialize all monitoring
  init() {
    if (!this.isEnabled) return;
    
    console.log('🚀 Performance monitoring initialized');
    
    this.observeLCP();
    this.observeCLS();
    this.observeFID();
    this.observeMemory();
    this.observeLongTasks();
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
  }
}

// React hook for measuring component performance
export function usePerformanceMonitor(componentName) {
  const monitor = new PerformanceMonitor();
  
  // Note: Import React in the component that uses this hook
  // React.useEffect(() => {
  //   const endMeasure = monitor.startMeasure(componentName);
  //   return endMeasure;
  // });
}

// HOC for measuring component performance
export function withPerformanceMonitor(Component, name) {
  return function PerformanceMonitoredComponent(props) {
    const monitor = new PerformanceMonitor();
    
    // Note: Import React in the component that uses this HOC
    // React.useEffect(() => {
    //   const endMeasure = monitor.startMeasure(name || Component.displayName || Component.name);
    //   return endMeasure;
    // });
    
    // return React.createElement(Component, props);
    return Component(props);
  };
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring on app start
export const initializePerformanceMonitoring = () => {
  performanceMonitor.init();
};