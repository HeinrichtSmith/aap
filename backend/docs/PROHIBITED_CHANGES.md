# DO NOT BUILD LIST - CRITICAL SYSTEM GUARDRAILS

## 🔴 ABSOLUTELY PROHIBITED CHANGES

### 1. CUSTOM AUTHENTICATION SYSTEMS
**Status: NEVER IMPLEMENT**
- ❌ DO NOT build custom JWT token generation
- ❌ DO NOT build custom password hashing
- ❌ DO NOT build custom session management
- ❌ DO NOT build custom OAuth providers

**Reason:** Use existing, battle-tested libraries:
- JWT: `jsonwebtoken` (already installed)
- Password: `bcrypt` (already installed)
- OAuth: Use established providers (Auth0, Clerk, etc.)

### 2. BILLING LOGIC DUPLICATION
**Status: NEVER IMPLEMENT**
- ❌ DO NOT embed pricing logic in controllers
- ❌ DO NOT calculate plan limits in routes
- ❌ DO NOT store payment info in database
- ❌ DO NOT handle Stripe/PayPal webhooks directly

**Reason:** Billing is a separate concern:
- Use `featureGate.js` for feature access (ALREADY IMPLEMENTED)
- Billing logic belongs in separate microservice
- Plan limits enforced through `planEnforcement.js` middleware (ALREADY IMPLEMENTED)

### 3. FRONTEND STATE MUTATIONS
**Status: NEVER IMPLEMENT**
- ❌ DO NOT store frontend state in backend
- ❌ DO NOT send UI configuration in API responses
- ❌ DO NOT render HTML/JSX from backend
- ❌ DO NOT manipulate browser DOM from server

**Reason:** Backend is API-only:
- Frontend manages its own state
- API returns data, not UI
- Keep separation of concerns strict

### 4. PLAN LOGIC IN FRONTEND
**Status: NEVER IMPLEMENT**
- ❌ DO NOT check plan limits in frontend
- ❌ DO NOT hide features based on plan in UI
- ❌ DO NOT store plan permissions in browser

**Reason:** Security risk - frontend cannot be trusted:
- All plan checks MUST be server-side
- Frontend can request any endpoint
- Use `featureGate.js` for all feature checks
- Hide UI features based on API responses

### 5. DATABASE MIGRATION IN PRODUCTION
**Status: NEVER DO WITHOUT PROTOCOL**
- ❌ DO NOT run schema changes without backup
- ❌ DO NOT alter columns without migration script
- ❌ DO NOT drop tables without approval
- ❌ DO NOT change primary keys

**Reason:** Data integrity is sacred:
- Create Prisma migration first: `npx prisma migrate dev`
- Test in staging environment
- Get approval before running in production
- Always have rollback plan ready

### 6. CRYPTOGRAPHY IMPLEMENTATIONS
**Status: NEVER IMPLEMENT**
- ❌ DO NOT build custom encryption
- ❌ DO NOT implement your own hashing
- ❌ DO NOT create random number generators
- ❌ DO NOT write crypto algorithms

**Reason:** Security through proven libraries:
- Use Node.js `crypto` module
- Use established encryption libraries
- Never roll your own crypto

### 7. DIRECT DATABASE ACCESS FROM CONTROLLERS
**Status: NEVER IMPLEMENT**
- ❌ DO NOT import Prisma directly in controllers
- ❌ DO NOT write raw SQL queries
- ❌ DO NOT bypass service layer

**Reason:** Maintain architecture:
- Controllers → Services → Database
- Services encapsulate business logic
- Controllers handle HTTP concerns only
- Services handle data access only

### 8. GLOBAL STATE IN SERVICES
**Status: NEVER IMPLEMENT**
- ❌ DO NOT use global variables for state
- ❌ DO NOT cache user data in module scope
- ❌ DO NOT share database connections across requests

**Reason:** Thread safety & memory leaks:
- Each request is isolated
- Use Redis for caching if needed
- Avoid singleton patterns for mutable state

## 🟡 REQUIRE EXPLICIT APPROVAL

### 9. ADDING NEW DEPENDENCIES
**Status: APPROVAL REQUIRED**
- ⚠️ MUST justify necessity
- ⚠️ MUST check for security vulnerabilities
- ⚠️ MUST check license compatibility
- ⚠️ MUST update package.json

**Process:**
1. Document problem being solved
2. Research existing solutions
3. Compare alternatives
4. Get approval before installing
5. Audit with `npm audit` after install

### 10. CHANGING AUTHENTICATION MIDDLEWARE
**Status: APPROVAL REQUIRED**
- ⚠️ MUST test with all existing endpoints
- ⚠️ MUST ensure backward compatibility
- ⚠️ MUST verify permissions still work

**Reason:** Auth is security-critical
- One mistake = full system compromise
- Test extensively

### 11. MODIFYING PLAN ENFORCEMENT
**Status: APPROVAL REQUIRED**
- ⚠️ MUST update featureGate.js
- ⚠️ MUST update planEnforcement.js
- ⚠️ MUST update documentation
- ⚠️ MUST test all plan levels

**Reason:** Billing accuracy & legal compliance
- Plan limits = legal contract
- Changing them = changing contract
- Must be carefully reviewed

## 🟢 ALLOWED PATTERNS

### ✅ GOOD PATTERNS TO FOLLOW

1. **Use errorCodes.js for all errors**
   ```javascript
   throw formatErrorResponse('INV_002_INSUFFICIENT_STOCK');
   ```

2. **Use featureGate.js for feature checks**
   ```javascript
   canUseBatchPicking(organization);
   ```

3. **Use Prisma transactions for multi-step operations**
   ```javascript
   await prisma.$transaction(async (tx) => {
     // Multiple operations here
   });
   ```

4. **Use middleware for cross-cutting concerns**
   - Authentication: `auth.js`
   - Plan limits: `planEnforcement.js`
   - Error handling: `errorHandler.js`

5. **Keep controllers thin**
   ```javascript
   // Controller handles HTTP, delegates to service
   const result = await orderService.createOrder(req.body);
   res.json(result);
   ```

6. **Validate input early**
   ```javascript
   // Use express-validator in routes
   body('email').isEmail().normalizeEmail()
   ```

## 📋 IMPLEMENTATION CHECKLIST

Before implementing any feature:

- [ ] Is this on the "Do Not Build" list? → STOP
- [ ] Does this duplicate existing functionality? → USE EXISTING
- [ ] Does this change plan enforcement? → GET APPROVAL
- [ ] Does this change auth? → GET APPROVAL
- [ ] Does this add a dependency? → GET APPROVAL
- [ ] Can I use errorCodes.js? → USE IT
- [ ] Can I use featureGate.js? → USE IT
- [ ] Is database change needed? → CREATE MIGRATION
- [ ] Does this add new error codes? → UPDATE errorCodes.js

## 🔒 SECURITY PRINCIPLES

1. **Never trust client input**
   - Validate everything
   - Sanitize user data
   - Use prepared statements (Prisma handles this)

2. **Never expose internal state**
   - Don't return full error stacks
   - Don't leak database details
   - Don't expose implementation details

3. **Never assume authentication**
   - Every protected endpoint needs auth middleware
   - Check permissions for every action
   - Verify organization ownership

4. **Never hardcode secrets**
   - Use environment variables
   - Rotate keys regularly
   - Don't commit `.env` files

5. **Never disable security**
   - Don't comment out auth for "testing"
   - Don't disable rate limits "temporarily"
   - Don't bypass validation "for now"

## 📝 DOCUMENTATION UPDATES

When you change anything:
- Update this file
- Update API documentation
- Update schema documentation
- Add examples if complex

## 🚨 EMERGENCY STOP

If you're about to do something on this list:
1. **STOP IMMEDIATELY**
2. Read this file again
3. Find the correct pattern
4. Ask if unsure

**Better to ask and wait, than to break and apologize.**

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0
**Status:** ENFORCED
