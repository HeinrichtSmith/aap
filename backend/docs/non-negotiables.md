# OpsUI Backend Non-Negotiables

**BINDING RULES** - These rules are NEVER violated under any circumstances.

---

## Frontend Data Model

### READ-ONLY STATUS
- **Frontend data files are reference only** (`src/data/*.json`)
- NEVER modify, delete, or restructure frontend data
- Backend must map to frontend expectations, not the reverse
- If frontend schema changes, update backend schema - NOT frontend data files

### Frontend Expectations
- Orders use status enum: `PENDING, PICKING, READY_TO_PACK, PACKED, SHIPPED, CANCELLED`
- User roles: `ADMIN, MANAGER, PICKER, PACKER, RECEIVER, STAFF`
- Product fields: `sku`, `name`, `barcode`, `category`, `price`, `inventory`
- Bin format: `Aisle-Row-Column-Level` (e.g., `A-01-02-1`)
- Date format in frontend: ISO 8601, displayed in NZT

---

## API Stability

### NO BREAKING CHANGES
- Once an API endpoint is deployed, it never breaks backward compatibility
- Add new fields to responses, never remove existing fields
- Add new optional query parameters, never remove required ones
- Deprecated endpoints must be marked for at least 6 months before removal
- All breaking changes require explicit approval from lead architect

### Response Structure
- Never change field names in responses
- Never change data types (string → number, etc.)
- Never change enum values
- Never change pagination structure
- Never change error response shape

---

## Feature Implementation

### NO SPECULATIVE FEATURES
- Only implement what is explicitly requested
- NO "nice to have" features without approval
- NO premature optimization
- NO generic solutions to specific problems
- If requirements are unclear, STOP and ask for clarification

### Example: DON'T DO THIS
```javascript
// WRONG - Speculative feature not requested
app.get('/api/orders/analytics/trends', async (req, res) => {
  // Complex trend analysis nobody asked for
});
```

### Example: DO THIS INSTEAD
```javascript
// RIGHT - Only what was requested
app.get('/api/orders/stats', async (req, res) => {
  // Simple statistics as specified
});
```

---

## Code Quality

### NO PLACEHOLDER LOGIC
- All functions must have real implementations
- NO `TODO` comments in production code
- NO `// implement later` comments
- NO throwing `Error('Not implemented')`
- If implementation is incomplete, the feature is not done

### Example: DON'T DO THIS
```javascript
// WRONG - Placeholder logic
async function calculateOptimalRoute(pickingList) {
  // TODO: Implement actual algorithm
  return pickingList;
}
```

### Example: DO THIS INSTEAD
```javascript
// RIGHT - Real implementation or don't implement at all
async function calculateOptimalRoute(pickingList) {
  const sorted = sortingAlgorithm(pickingList);
  return optimizeRoute(sorted);
}
```

### NO MAGIC NUMBERS
- Extract all constants to named constants
- NO hardcoded values in business logic
- Use configuration files for environment-specific values

### Example: DON'T DO THIS
```javascript
// WRONG - Magic number
if (order.total > 1000) { /* ... */ }
```

### Example: DO THIS INSTEAD
```javascript
// RIGHT - Named constant
const FREE_SHIPPING_THRESHOLD = 1000;
if (order.total > FREE_SHIPPING_THRESHOLD) { /* ... */ }
```

---

## New Zealand Context

### NZ-FIRST ASSUMPTIONS
- Default timezone: NZT (UTC+12/UTC+13 DST)
- Default currency: NZD ($)
- Default phone format: +64 XX XXX XXXX
- Default address format: NZ address structure
- Default couriers: NZ Couriers, NZ Post, Mainfreight, Post Haste

### Business Hours
- Warehouse operations: 8 AM - 5 PM NZT, Monday-Friday
- Cut-off time for same-day shipping: 2 PM NZT
- Shipping days: Monday-Friday (weekends excluded)
- Public holidays: Follow NZ public holiday calendar

### Delivery SLAs
- Metro Auckland: 1-2 business days
- Rest of NZ: 2-3 business days
- Rural: 3-5 business days
- Overnight: Next business day (metro only)

---

## Performance Baselines

### RESPONSE TIME LIMITS
- API endpoints: Maximum 200ms (p95)
- Database queries: Maximum 50ms (p95)
- Authentication: Maximum 100ms (p95)
- Simple CRUD: Maximum 100ms (p95)

### If Limits Exceeded
- Add database indexes
- Optimize queries
- Implement caching
- Refactor slow code
- STOP and ask for help if optimization is insufficient

### Database Performance
- NO N+1 queries (use Prisma `include` or `select`)
- NO fetching entire tables (use pagination)
- NO circular relations in responses
- Use connection pooling in production
- Use read replicas if necessary

---

## Security Baselines

### NEVER COMPROMISE
- All endpoints must be authenticated (except login/register)
- All inputs must be validated
- All passwords must be hashed (bcrypt, salt rounds: 10)
- All JWT tokens must expire (max 7 days)
- All errors must be logged (never expose stack traces to clients)

### Data Protection
- NEVER store passwords in plain text
- NEVER log sensitive data (passwords, tokens, API keys)
- NEVER send sensitive data in URLs
- NEVER use weak encryption
- NEVER hardcode credentials

### Input Validation
- Validate ALL user inputs
- Sanitize ALL data from external sources
- Use parameterized queries (Prisma handles this)
- Never trust client-side validation
- Validate file uploads (size, type, content)

### Authorization
- Check permissions on EVERY protected endpoint
- Never rely on client-side authorization
- Use role-based access control (RBAC)
- Log all authorization failures
- Never expose admin endpoints without proper auth

---

## Integration Rules

### ADAPTER PATTERN ONLY
- NO direct third-party API calls in controllers
- NO integration-specific code in services
- ALL external systems must use adapter pattern
- ALL adapters must implement standard interface

### Example: DON'T DO THIS
```javascript
// WRONG - Direct API call in controller
async function createOrder(req, res) {
  const netsuiteResponse = await axios.post('https://netsuite.api...', data);
  // ...
}
```

### Example: DO THIS INSTEAD
```javascript
// RIGHT - Use adapter
async function createOrder(req, res) {
  const adapter = new NetSuiteAdapter(credentials);
  const result = await adapter.createOrder(data);
  // ...
}
```

### Error Handling
- Catch ALL integration errors
- Return standardized error responses
- NEVER expose third-party error messages to clients
- Log integration errors with full context
- Implement retry logic for transient failures

### Rate Limiting
- Respect third-party API rate limits
- Add delays between calls if necessary
- Implement exponential backoff
- Queue requests if limits are exceeded
- NEVER spam external APIs

### Credentials
- Store in environment variables ONLY
- NEVER commit credentials to Git
- NEVER hardcode credentials
- Rotate credentials regularly
- Use different credentials for different environments

---

## Database Rules

### MIGRATION POLICY
- Use Prisma migrations in production
- NEVER use `db push` in production
- Review migrations before applying
- Backup database before major migrations
- Test migrations in staging first

### Schema Changes
- NEVER remove columns without migration
- NEVER rename columns without migration
- NEVER change data types without migration
- Use Prisma `@deprecated` for deprecated fields
- Remove deprecated fields after at least 6 months

### Data Integrity
- NEVER allow NULL in foreign keys
- Use ON DELETE CASCADE or ON DELETE RESTRICT explicitly
- Use unique constraints where applicable
- Use indexes for frequently queried fields
- NEVER use SELECT * (specify fields)

---

## Error Handling

### STANDARDIZED ERRORS
- All errors must follow backend-contract.md format
- All error messages must be user-friendly
- All errors must be logged
- NEVER expose stack traces to clients
- NEVER expose database errors to clients

### Error Types
- Use appropriate HTTP status codes
- Use descriptive error types
- Include actionable error messages
- Provide error details where helpful
- Never return generic "Something went wrong"

### Example: DON'T DO THIS
```javascript
// WRONG - Generic error
res.status(500).json({ error: 'Something went wrong' });
```

### Example: DO THIS INSTEAD
```javascript
// RIGHT - Specific error
res.status(404).json({
  error: 'NotFoundError',
  message: 'Order ORD-20260105-00123 not found',
  details: { orderId: 'ORD-20260105-00123' }
});
```

---

## Logging

### WHAT TO LOG
- All API requests (with duration)
- All errors (with stack traces)
- All authentication/authorization failures
- All external API calls (request/response)
- All job queue operations
- All slow database queries (> 100ms)

### WHAT NOT TO LOG
- NEVER log passwords
- NEVER log API keys
- NEVER log JWT tokens
- NEVER log credit card numbers
- NEVER log personal identifiable information (PII) in plain text

### Log Levels
- `error` - Critical errors requiring immediate attention
- `warn` - Warning conditions, potential issues
- `info` - General informational messages
- `debug` - Detailed debugging (development only)

---

## Testing

### COVERAGE REQUIREMENTS
- All controllers must have unit tests
- All services must have unit tests
- All utilities must have unit tests
- All critical paths must have integration tests
- Minimum 80% code coverage

### NO UNTESTED CODE
- Never commit untested code to main branch
- Tests must pass before merge
- Fix broken tests immediately
- Tests must be deterministic (no random failures)

### Test Data
- Use factory pattern for test data
- Use separate test database
- Clean up test data after tests
- Never use production data for tests

---

## Code Review

### MANDATORY REVIEWS
- All code requires peer review
- At least one approval required
- All feedback must be addressed
- No self-approval for own code
- Reviewer must understand the code

### Review Checklist
- Code follows backend-contract.md
- No non-negotiables violated
- Tests pass
- No security vulnerabilities
- Performance acceptable
- Documentation updated
- No TODOs or placeholders

---

## Documentation

### DOCUMENT AS YOU CODE
- Update README.md for new features
- Update API documentation for new endpoints
- Comment complex business logic
- Document non-obvious algorithms
- Keep changelog updated

### NO UNDOCUMENTED CHANGES
- All API changes must be documented
- All breaking changes must be announced
- All deprecations must be documented
- All configuration changes must be documented

---

## When to Stop and Ask

### AMBIGUOUS REQUIREMENTS
- If requirements are unclear → ASK
- If multiple ways to implement → ASK
- If performance impact unknown → ASK
- If security implications unclear → ASK
- If integration behavior unclear → ASK

### BLOCKING ISSUES
- If unable to meet performance targets → ASK
- If unable to implement without breaking changes → ASK
- If external API behavior unexpected → ASK
- If database schema change required → ASK
- If user impact unclear → ASK

### BETTER SOLUTIONS FOUND
- If you find a better approach → ASK
- If requirements seem outdated → ASK
- If implementation seems over-engineered → ASK
- If simpler solution exists → ASK

---

## Deployment

### PRE-DEPLOYMENT CHECKLIST
- All tests pass
- Code reviewed and approved
- Documentation updated
- Security audit passed
- Performance tested
- Database migrations tested
- Environment variables configured
- Rollback plan documented

### NO HOTFIXES IN PRODUCTION
- Use proper deployment process
- Test in staging first
- Get approval for production changes
- Document all changes
- Monitor after deployment

---

## Communication

### TRANSPARENCY
- Report blockers immediately
- Share progress regularly
- Document decisions
- Explain trade-offs
- Ask for help when needed

### NO SILENT FAILURES
- If a task is blocked → Report it
- If requirements change → Report it
- If timeline impacted → Report it
- If quality concerns → Report it
- If security issue found → Report it immediately

---

## Professional Standards

### CODE OWNERSHIP
- Take responsibility for your code
- Fix bugs in your code
- Maintain your code over time
- Refactor your code when needed
- Delete dead code promptly

### COLLABORATION
- Respect peer reviews
- Provide constructive feedback
- Help teammates learn
- Share knowledge
- Document decisions

---

**These rules are non-negotiable. Violations require explicit approval from lead architect and must be documented with justification.**
