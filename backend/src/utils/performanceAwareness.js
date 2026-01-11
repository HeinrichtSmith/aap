/**
 * Performance & Memory Awareness System
 * 
 * This tool provides query cost estimates, endpoint latency budgets,
 * and memory ceiling enforcement. Critical for the 1.1GB memory constraint.
 * 
 * Usage:
 * import { checkMemoryUsage, estimateQueryCost } from './utils/performanceAwareness.js';
 */

const os = require('os');

/**
 * Memory constraints (in bytes)
 */
const MEMORY_LIMITS = {
  CRITICAL: 1.1 * 1024 * 1024 * 1024, // 1.1GB - hard limit
  WARNING: 950 * 1024 * 1024, // 950MB - warning threshold
  HEALTHY: 600 * 1024 * 1024, // 600MB - healthy range
};

/**
 * Latency budgets (in milliseconds)
 */
const LATENCY_BUDGETS = {
  API_P50: 200,  // 50th percentile
  API_P95: 500,  // 95th percentile
  DB_P50: 100,   // Database queries
  DB_P95: 200,
  AUTH: 50,      // Authentication
  VALIDATION: 30, // Input validation
};

/**
 * Query cost estimates (relative units)
 */
const QUERY_COSTS = {
  findMany: 10,
  findFirst: 5,
  findUnique: 3,
  create: 8,
  update: 8,
  delete: 6,
  aggregate: 15,
  count: 12,
  rawQuery: 20,
};

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
    
    // Percentages
    heapUsedPercent: (usage.heapUsed / usage.heapTotal) * 100,
    rssPercent: (usage.rss / totalMem) * 100,
    systemUsedPercent: (usedMem / totalMem) * 100,
    
    // Formatted
    heapUsedMB: formatBytes(usage.heapUsed),
    heapTotalMB: formatBytes(usage.heapTotal),
    rssMB: formatBytes(usage.rss),
    totalMemMB: formatBytes(totalMem),
    freeMemMB: formatBytes(freeMem),
    
    // Status
    status: getMemoryStatus(usage.rss),
  };
}

/**
 * Get memory status
 */
function getMemoryStatus(rss) {
  if (rss >= MEMORY_LIMITS.CRITICAL) {
    return 'critical';
  } else if (rss >= MEMORY_LIMITS.WARNING) {
    return 'warning';
  } else if (rss >= MEMORY_LIMITS.HEALTHY) {
    return 'healthy';
  } else {
    return 'optimal';
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if memory usage is within limits
 */
function checkMemoryUsage() {
  const usage = getMemoryUsage();
  const warnings = [];
  const errors = [];
  
  // Check RSS against critical limit
  if (usage.rss >= MEMORY_LIMITS.CRITICAL) {
    errors.push(
      `Memory usage (${usage.rssMB}) exceeds critical limit (${formatBytes(MEMORY_LIMITS.CRITICAL)})`
    );
  }
  
  // Check RSS against warning threshold
  if (usage.rss >= MEMORY_LIMITS.WARNING) {
    warnings.push(
      `Memory usage (${usage.rssMB}) approaching warning threshold (${formatBytes(MEMORY_LIMITS.WARNING)})`
    );
  }
  
  // Check heap usage
  if (usage.heapUsedPercent > 90) {
    warnings.push(
      `Heap usage at ${usage.heapUsedPercent.toFixed(1)}% - potential memory leak`
    );
  }
  
  return {
    ...usage,
    withinLimit: errors.length === 0,
    warnings,
    errors,
    recommendation: getMemoryRecommendation(usage.status),
  };
}

/**
 * Get memory recommendation
 */
function getMemoryRecommendation(status) {
  const recommendations = {
    critical: 'IMMEDIATE ACTION REQUIRED: Stop accepting requests, investigate memory leak, restart process',
    warning: 'WARNING: Monitor closely, optimize memory usage, consider restarting soon',
    healthy: 'OK: Memory usage is within acceptable range',
    optimal: 'EXCELLENT: Memory usage is optimal, continue monitoring',
  };
  
  return recommendations[status];
}

/**
 * Estimate query cost
 */
function estimateQueryCost(operation, options = {}) {
  let cost = QUERY_COSTS[operation] || 10;
  const factors = [];
  
  // Factor in result size estimation
  if (options.limit) {
    cost = Math.min(cost, cost * (options.limit / 100));
    factors.push(`limit: ${options.limit}`);
  }
  
  // Factor in includes (N+1 risk)
  if (options.include) {
    const includeCount = Object.keys(options.include).length;
    cost = cost * (1 + includeCount * 0.5);
    factors.push(`includes: ${includeCount}`);
  }
  
  // Factor in orderBy (sorting cost)
  if (options.orderBy) {
    cost = cost * 1.2;
    factors.push('orderBy present');
  }
  
  // Factor in where clauses (complexity)
  if (options.where) {
    const whereKeys = Object.keys(options.where).length;
    cost = cost * (1 + whereKeys * 0.1);
    factors.push(`where clauses: ${whereKeys}`);
  }
  
  return {
    cost: Math.round(cost),
    factors,
    category: getCostCategory(cost),
    recommendation: getQueryRecommendation(cost),
  };
}

/**
 * Get cost category
 */
function getCostCategory(cost) {
  if (cost < 5) return 'low';
  if (cost < 15) return 'medium';
  if (cost < 25) return 'high';
  return 'critical';
}

/**
 * Get query recommendation
 */
function getQueryRecommendation(cost) {
  const recommendations = {
    low: 'Query is efficient, no action needed',
    medium: 'Query is acceptable, consider adding pagination if not present',
    high: 'Query is expensive, add pagination, reduce includes, or use indexing',
    critical: 'Query is very expensive, MUST optimize: add pagination, remove nested includes, add indexes',
  };
  
  return recommendations[getCostCategory(cost)];
}

/**
 * Analyze endpoint performance
 */
function analyzeEndpointPerformance(endpoint, metrics) {
  const analysis = {
    endpoint,
    withinBudget: true,
    issues: [],
    warnings: [],
    recommendations: [],
  };
  
  // Check P50 latency
  if (metrics.p50 > LATENCY_BUDGETS.API_P50) {
    analysis.withinBudget = false;
    analysis.issues.push(
      `P50 latency (${metrics.p50}ms) exceeds budget (${LATENCY_BUDGETS.API_P50}ms)`
    );
  }
  
  // Check P95 latency
  if (metrics.p95 > LATENCY_BUDGETS.API_P95) {
    analysis.withinBudget = false;
    analysis.issues.push(
      `P95 latency (${metrics.p95}ms) exceeds budget (${LATENCY_BUDGETS.API_P95}ms)`
    );
  }
  
  // Check error rate
  if (metrics.errorRate > 0.01) { // > 1%
    analysis.warnings.push(
      `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) is elevated`
    );
  }
  
  // Check throughput
  if (metrics.throughput < 10) {
    analysis.warnings.push(
      `Low throughput (${metrics.throughput} req/s) - may indicate performance issues`
    );
  }
  
  // Generate recommendations
  if (!analysis.withinBudget) {
    analysis.recommendations.push(
      'Profile endpoint with Node.js profiler',
      'Check database query performance',
      'Add caching where appropriate',
      'Consider implementing pagination',
      'Review middleware for bottlenecks'
    );
  }
  
  return analysis;
}

/**
 * Detect potential memory leaks
 */
function detectMemoryLeaks(history) {
  if (!history || history.length < 3) {
    return {
      hasLeak: false,
      confidence: 'insufficient_data',
      recommendation: 'Collect more memory samples',
    };
  }
  
  const recent = history.slice(-10);
  const first = recent[0];
  const last = recent[recent.length - 1];
  
  const growthRate = (last.heapUsed - first.heapUsed) / first.heapUsed;
  
  let hasLeak = false;
  let confidence = 'low';
  
  // Check for consistent growth
  if (growthRate > 0.2) { // > 20% growth
    hasLeak = true;
    confidence = 'high';
  } else if (growthRate > 0.1) { // > 10% growth
    hasLeak = true;
    confidence = 'medium';
  }
  
  const recommendations = [];
  if (hasLeak) {
    recommendations.push(
      'Enable heap snapshots to identify leak source',
      'Check for event listeners not being removed',
      'Review caching strategies for unbounded growth',
      'Check for closures retaining large objects',
      'Use --inspect flag with Chrome DevTools for profiling'
    );
  }
  
  return {
    hasLeak,
    confidence,
    growthRate: (growthRate * 100).toFixed(2) + '%',
    recommendations,
  };
}

/**
 * Generate performance report
 */
function generatePerformanceReport(memoryCheck, queryAnalysis = null, endpointAnalysis = null) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('PERFORMANCE & MEMORY AWARENESS REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  
  // Memory Section
  lines.push('MEMORY USAGE');
  lines.push('-'.repeat(80));
  lines.push(`RSS: ${memoryCheck.rssMB} (${memoryCheck.status.toUpperCase()})`);
  lines.push(`Heap Used: ${memoryCheck.heapUsedMB} / ${memoryCheck.heapTotalMB} (${memoryCheck.heapUsedPercent.toFixed(1)}%)`);
  lines.push(`System Memory: ${memoryCheck.totalMemMB} total, ${memoryCheck.freeMemMB} free`);
  lines.push('');
  lines.push(`Status: ${memoryCheck.status.toUpperCase()}`);
  lines.push(`Within Limit: ${memoryCheck.withinLimit ? '✅ YES' : '❌ NO'}`);
  lines.push('');
  
  if (memoryCheck.warnings.length > 0) {
    lines.push('WARNINGS:');
    memoryCheck.warnings.forEach(w => lines.push(`  ⚠️ ${w}`));
    lines.push('');
  }
  
  if (memoryCheck.errors.length > 0) {
    lines.push('ERRORS:');
    memoryCheck.errors.forEach(e => lines.push(`  ❌ ${e}`));
    lines.push('');
  }
  
  lines.push(`Recommendation: ${memoryCheck.recommendation}`);
  lines.push('');
  
  // Query Analysis Section
  if (queryAnalysis) {
    lines.push('QUERY COST ANALYSIS');
    lines.push('-'.repeat(80));
    lines.push(`Estimated Cost: ${queryAnalysis.cost} (${queryAnalysis.category.toUpperCase()})`);
    lines.push('');
    
    if (queryAnalysis.factors.length > 0) {
      lines.push('Cost Factors:');
      queryAnalysis.factors.forEach(f => lines.push(`  • ${f}`));
      lines.push('');
    }
    
    lines.push(`Recommendation: ${queryAnalysis.recommendation}`);
    lines.push('');
  }
  
  // Endpoint Analysis Section
  if (endpointAnalysis) {
    lines.push('ENDPOINT PERFORMANCE');
    lines.push('-'.repeat(80));
    lines.push(`Endpoint: ${endpointAnalysis.endpoint}`);
    lines.push(`Within Budget: ${endpointAnalysis.withinBudget ? '✅ YES' : '❌ NO'}`);
    lines.push('');
    
    if (endpointAnalysis.issues.length > 0) {
      lines.push('ISSUES:');
      endpointAnalysis.issues.forEach(i => lines.push(`  ❌ ${i}`));
      lines.push('');
    }
    
    if (endpointAnalysis.warnings.length > 0) {
      lines.push('WARNINGS:');
      endpointAnalysis.warnings.forEach(w => lines.push(`  ⚠️ ${w}`));
      lines.push('');
    }
    
    if (endpointAnalysis.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      endpointAnalysis.recommendations.forEach(r => lines.push(`  • ${r}`));
      lines.push('');
    }
  }
  
  // Latency Budget Reference
  lines.push('LATENCY BUDGETS (REFERENCE)');
  lines.push('-'.repeat(80));
  lines.push(`API P50: ${LATENCY_BUDGETS.API_P50}ms`);
  lines.push(`API P95: ${LATENCY_BUDGETS.API_P95}ms`);
  lines.push(`DB P50: ${LATENCY_BUDGETS.DB_P50}ms`);
  lines.push(`DB P95: ${LATENCY_BUDGETS.DB_P95}ms`);
  lines.push(`Authentication: ${LATENCY_BUDGETS.AUTH}ms`);
  lines.push(`Validation: ${LATENCY_BUDGETS.VALIDATION}ms`);
  lines.push('');
  
  // Memory Limits Reference
  lines.push('MEMORY LIMITS (REFERENCE)');
  lines.push('-'.repeat(80));
  lines.push(`Critical Limit: ${formatBytes(MEMORY_LIMITS.CRITICAL)}`);
  lines.push(`Warning Threshold: ${formatBytes(MEMORY_LIMITS.WARNING)}`);
  lines.push(`Healthy Range: ${formatBytes(MEMORY_LIMITS.HEALTHY)}`);
  lines.push('');
  
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Performance optimization checklist
 */
const OPTIMIZATION_CHECKLIST = [
  'Are all database queries using indexes?',
  'Is pagination implemented for list endpoints?',
  'Are N+1 queries avoided (using includes properly)?',
  'Is caching implemented where appropriate?',
  'Are large result sets being streamed?',
  'Are unnecessary includes removed?',
  'Is connection pooling configured?',
  'Are database connections being reused?',
  'Are memory-intensive operations offloaded to background jobs?',
  'Is memory being released after large operations?',
];

module.exports = {
  checkMemoryUsage,
  getMemoryUsage,
  estimateQueryCost,
  analyzeEndpointPerformance,
  detectMemoryLeaks,
  generatePerformanceReport,
  OPTIMIZATION_CHECKLIST,
  MEMORY_LIMITS,
  LATENCY_BUDGETS,
  QUERY_COSTS,
};
