/**
 * Self-Critique / Red Team Loop System
 * 
 * This tool provides adversarial review capabilities to identify potential
 * security vulnerabilities, race conditions, and resource constraint violations
 * before code is deployed.
 * 
 * Usage:
 * import { performAdversarialReview } from './utils/selfCritique.js';
 * const review = performAdversarialReview(code, context);
 */

/**
 * Security vulnerability patterns to check
 */
const SECURITY_PATTERNS = {
  // Permission bypass checks
  permissionBypass: [
    /(?:without.*auth|bypass.*auth|skip.*auth|ignore.*auth)/i,
    /(?:remove.*middleware|disable.*middleware|comment.*middleware)/i,
    /(?:force.*true|override.*check|allow.*all)/i,
  ],
  
  // SQL injection risks
  sqlInjection: [
    /(?:\$\{.*\}|query\s*=\s*['"`].*?\+.*?['"`])/i,
    /(?:WHERE.*=.*\$\{|raw.*query)/i,
  ],
  
  // XSS vulnerabilities
  xss: [
    /(?:innerHTML\s*=|dangerouslySetInnerHTML)/i,
    /(?:eval\(|new Function\()/i,
  ],
  
  // Plan bypass
  planBypass: [
    /(?:if\s*\(\s*org\.plan\s*===?\s*['"`]elite['"`]\s*\)\s*\{)/i,
    /(?:override.*plan|ignore.*plan|skip.*plan)/i,
  ],
  
  // Multi-tenant leakage
  tenantLeakage: [
    /(?:WHERE|findMany|findFirst).*?companyId.*?(?:=\s*null|IS\s+NULL)/i,
    /(?:findMany\(\{?\s*\}|findFirst\(\{?\s*\})/i, // Missing company filter
  ],
};

/**
 * Performance/Resource constraint patterns
 */
const PERFORMANCE_PATTERNS = {
  // Memory constraint violations (> 1.1GB risk)
  memoryRisk: [
    /(?:load.*all|findMany\(\s*\)|Array\.from.*length)/i,
    /(?:\.map\(\s*\.find|filter.*map.*filter)/i, // Multiple full scans
    /(?:while\s*\([^)]*\)\s*\{[^}]*push)/i, // Unbounded loops with push
  ],
  
  // Query cost issues
  queryCost: [
    /(?:include:\s*\{[^}]*include:)/i, // Nested includes (N+1 risk)
    /(?:findMany.*orderBy.*findMany)/i, // Multiple ordered queries
  ],
  
  // Race conditions
  raceConditions: [
    /(?:async.*\{\s*await.*await)/i, // Multiple awaits without transaction
    /(?:if\s*\([^)]*\)\s*await.*if\s*\([^)]*\)\s*await)/i, // Check-then-act pattern
    /(?:let.*=.*find[^\n]*\n.*update)/i, // Read-modify-write without transaction
  ],
};

/**
 * Architectural violation patterns (from PROHIBITED_CHANGES.md)
 */
const ARCHITECTURAL_PATTERNS = {
  // Custom authentication
  customAuth: [
    /(?:bcrypt\.hash.*jwt\.sign|custom.*login|manual.*auth)/i,
    /(?:session\(\)|passport\.\w+)/i,
  ],
  
  // Database access from controllers
  directDbAccess: [
    /(?:prisma\.\w+|db\.\w+)\.(findMany|findFirst|create|update|delete)/i,
  ],
  
  // Global state
  globalState: [
    /(?:global\.|window\.|module\.exports\s*=\s*\{)/i,
    /(?:let\s+\w+\s*=\s*\[\]|\{\};\s*$)/m,
  ],
  
  // Frontend state mutations
  frontendMutation: [
    /(?:useState.*set|useEffect.*dispatch|useReducer)/i,
  ],
};

/**
 * Check for pattern matches in code
 */
function checkPatterns(code, patterns, category) {
  const findings = [];
  
  for (const [type, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const matches = code.matchAll(regex);
      for (const match of matches) {
        const line = code.substring(0, match.index).split('\n').length;
        findings.push({
          severity: 'high',
          category,
          type,
          line,
          match: match[0].substring(0, 50),
          recommendation: getRecommendation(category, type),
        });
      }
    }
  }
  
  return findings;
}

/**
 * Get recommendation for finding
 */
function getRecommendation(category, type) {
  const recommendations = {
    permissionBypass: 'Remove authentication bypass. Use proper middleware.',
    sqlInjection: 'Use parameterized queries. Never concatenate user input.',
    xss: 'Sanitize output. Use DOMPurify or React\'s built-in escaping.',
    planBypass: 'Use featureGate.js for plan checks. Never hardcode plan logic.',
    tenantLeakage: 'Always include companyId in queries. Use company isolation.',
    memoryRisk: 'Add pagination. Use cursor-based queries. Limit result sets.',
    queryCost: 'Use transactions. Avoid nested includes. Add query limits.',
    raceConditions: 'Use Prisma transactions. Implement optimistic locking.',
    customAuth: 'Use existing JWT + RBAC system. Never create custom auth.',
    directDbAccess: 'Move DB logic to service layer. Controllers should use services.',
    globalState: 'Use dependency injection. Avoid global variables.',
    frontendMutation: 'Backend should not mutate frontend state.',
  };
  
  return recommendations[category]?.[type] || 'Review this pattern for potential issues.';
}

/**
 * Perform adversarial review of code
 */
function performAdversarialReview(code, context = {}) {
  const review = {
    timestamp: new Date().toISOString(),
    context: {
      file: context.file || 'unknown',
      function: context.function || 'unknown',
      user: context.user || 'system',
    },
    findings: [],
    score: 100,
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  };
  
  // Security checks
  review.findings.push(
    ...checkPatterns(code, SECURITY_PATTERNS, 'security')
  );
  
  // Performance checks
  review.findings.push(
    ...checkPatterns(code, PERFORMANCE_PATTERNS, 'performance')
  );
  
  // Architectural checks
  review.findings.push(
    ...checkPatterns(code, ARCHITECTURAL_PATTERNS, 'architecture')
  );
  
  // Calculate severity counts
  review.findings.forEach(finding => {
    review.summary[finding.severity]++;
  });
  
  // Calculate score (deduct points for findings)
  review.score = 100 - (review.summary.critical * 20) - (review.summary.high * 10) - (review.summary.medium * 5);
  review.score = Math.max(0, review.score);
  
  // Generate summary
  review.summary.findings = review.findings.length;
  review.summary.score = review.score;
  
  return review;
}

/**
 * Quick check for common violations
 */
function quickCheck(code) {
  const violations = [];
  
  // Quick permission bypass check
  if (code.match(/(?:skip|bypass|disable).*auth/i)) {
    violations.push('permissionBypass');
  }
  
  // Quick plan bypass check
  if (code.match(/(?:override|ignore).*plan/i)) {
    violations.push('planBypass');
  }
  
  // Quick tenant leakage check
  if (code.match(/findMany\(\s*\)|findFirst\(\s*\)/)) {
    violations.push('tenantLeakage');
  }
  
  return violations;
}

/**
 * Generate review report
 */
function generateReport(review) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('ADVERSARIAL CODE REVIEW REPORT');
  lines.push('='.repeat(80));
  lines.push(`File: ${review.context.file}`);
  lines.push(`Function: ${review.context.function}`);
  lines.push(`Timestamp: ${review.timestamp}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Score: ${review.score}/100`);
  lines.push(`Findings: ${review.summary.findings}`);
  lines.push(`  Critical: ${review.summary.critical}`);
  lines.push(`  High: ${review.summary.high}`);
  lines.push(`  Medium: ${review.summary.medium}`);
  lines.push(`  Low: ${review.summary.low}`);
  lines.push('');
  
  if (review.findings.length > 0) {
    lines.push('DETAILED FINDINGS');
    lines.push('-'.repeat(80));
    
    review.findings.forEach((finding, index) => {
      lines.push(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.category}/${finding.type}`);
      lines.push(`   Line: ${finding.line}`);
      lines.push(`   Pattern: ${finding.match}`);
      lines.push(`   Recommendation: ${finding.recommendation}`);
      lines.push('');
    });
  } else {
    lines.push('✅ No issues found. Code passes adversarial review.');
  }
  
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Self-Critique Questions for developers
 */
const SELF_CRITIQUE_QUESTIONS = [
  'How could this fix fail? (Consider edge cases, race conditions)',
  'Does this introduce a race condition?',
  'Does this violate the 1.1GB memory constraint?',
  'Could this bypass authentication or authorization?',
  'Does this leak data across tenants?',
  'Does this violate plan enforcement?',
  'Is this using errorCodes.js for errors?',
  'Is this using featureGate.js for plan checks?',
  'Is this reading contractMemory.js before making changes?',
  'Does this violate any PROHIBITED_CHANGES.md rules?',
];

module.exports = {
  performAdversarialReview,
  quickCheck,
  generateReport,
  SELF_CRITIQUE_QUESTIONS,
  SECURITY_PATTERNS,
  PERFORMANCE_PATTERNS,
  ARCHITECTURAL_PATTERNS,
};
