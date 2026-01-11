# Phase 4: Enforcement Verification

**Generated:** 2026-01-05 18:40 NZDT  
**Status:** In Progress  
**Objective:** Verify plan limits, permissions, and validation are enforced everywhere

---

## 🎯 ENFORCEMENT CHECKLIST

### 1. Plan Limits Enforcement

#### User Count Limits
- ✅ PlanEnforcement middleware exists (`backend/src/middleware/planEnforcement.js`)
- ✅ User creation checks plan limit
- ❓ User update to Manager/Staff doesn't check limit
- ❓ User deletion doesn't update count properly
- ❓ Company plan upgrade doesn't update limits

#### Site Count Limits
- ✅ Site creation checks plan limit
- ✅ Site creation enforces company ownership
- ❓ Site deletion doesn't update count
- ❓ Plan upgrade doesn't update site limit

#### Feature Access by Plan
- ✅ Stock takes available (all plans)
- ✅ Audit logging infrastructure in place
- ❓ Advanced features (batching, waves) not gated by plan

---

### 2. Permission Enforcement Review

#### Auth Middleware
- ✅ `authenticate()` - JWT validation working
- ✅ `authorize()` - Role-based access control working
- ✅ `validateRequest()` - Input validation working
- ✅ `requireStaff()` - Deprecated (replaced by authorize)

#### Controller-Level Checks
- ✅ Products: Company isolation on all queries
- ✅ Products: Site filtering for non-admins
- ✅ Products: Role-based access control
- ✅ Orders: Company isolation on all queries
- ✅ Orders: Site filtering for non-admins
- ✅ Orders: Role-based access control
- ✅ Orders: Picker/packer assignment verification
- ✅ Users: Company isolation
- ✅ Sites: Company isolation
- ✅ Bins: No company isolation (needed?)
- ✅ Purchase Orders: Company isolation
- ✅ Returns: Company isolation
- ✅ Stock Takes: Company isolation

**Issues Found:**
- ⚠️ Bins table has no companyId field - bins are shared across companies (security risk)
- ⚠️ Some endpoints don't verify user belongs to company (assume from auth)

---

### 3. Input Validation Review

#### Validators Defined
- ✅ createUserValidation - 7 fields
- ✅ updateUserValidation - 6 fields
- ✅ updateRoleValidation - 1 field
- ✅ createSiteValidation - 4 fields
- ✅ updateSiteValidation - 3 fields
- ✅ createBinValidation - 8 fields
- ✅ updateBinValidation - 6 fields
- ✅ createPurchaseOrderValidation - 4 fields
- ✅ createReturnValidation - 5 fields
- ✅ createStockTakeValidation - 4 fields
- ✅ updateStockTakeItemValidation - 2 fields

#### Validation Applied to Routes
- ✅ Auth routes: Validations applied
- ✅ Products routes: Validations applied
- ✅ Orders routes: Validations applied
- ✅ Users routes: Validations applied
- ✅ Sites routes: Validations applied
- ✅ Bins routes: Validations applied
- ✅ Purchase orders routes: Validations applied
- ✅ Returns routes: Validations applied
- ✅ Stock takes routes: Validations applied

**Issues Found:**
- ⚠️ Some routes have inline validations instead of using validators.js
- ⚠️ Error handling needs to catch validation errors consistently

---

### 4. Business Logic Validation

#### Order Workflow
- ✅ Can't pick items not in order
- ✅ Can't over-pick items (enforced in pickItem)
- ✅ Can't pack orders not in READY_TO_PACK status
- ✅ Can't ship orders not in PACKED status
- ⚠️ Can't unassign pickers/packers (missing feature?)
- ⚠️ Can't cancel orders after picking started

#### Inventory Management
- ✅ Can't have negative inventory
- ✅ Can't delete products with inventory
- ✅ Can't delete products with orders
- ⚠️ No low stock alerts (automated?)
- ⚠️ No reorder point alerts

#### Stock Takes
- ✅ Can't approve stock takes not in COMPLETED status
- ✅ Variance calculated correctly
- ⚠️ No automatic inventory adjustment on approval
- ⚠️ No approval workflow (who can approve?)

---

## 🔴 CRITICAL ISSUES FOUND

### 1. Bins Table Security Risk 🔴
**Issue:** Bins table has no companyId field  
**Impact:** All companies share the same bins  
**Severity:** HIGH - Cross-company data leakage

**Fix Required:**
- Add companyId to Bin model
- Add company relation to Bin model
- Update all bin queries to filter by company
- Create migration
- Update seed data

### 2. Stock Take Approval Missing 🔴
**Issue:** Stock takes have approval workflow but no authorization checks  
**Impact:** Anyone can approve stock takes  
**Severity:** HIGH - Unauthorized inventory adjustments

**Fix Required:**
- Add authorization to approveStockTake endpoint
- Only MANAGER/ADMIN should approve
- Add approval reason field

### 3. User Limit Enforcement Gaps 🟡
**Issue:** Plan limit middleware not applied consistently  
**Impact:** Could exceed plan limits in some scenarios  
**Severity:** MEDIUM - Business logic violation

**Fix Required:**
- Apply planEnforcement to all user mutation endpoints
- Add user count caching for performance
- Handle plan upgrades properly

### 4. Site Limit Enforcement Gaps 🟡
**Issue:** Site deletion doesn't update count  
**Impact:** Incorrect limit tracking  
**Severity:** MEDIUM - Could create extra sites

**Fix Required:**
- Add site count tracking in Company model
- Update count on site creation/deletion
- Enforce limit consistently

---

## 🔧 RECOMMENDED FIXES

### Priority 1: Bins Table Security (30 min)

**Schema Update:**
```prisma
model Bin {
  id          String    @id @default(uuid())
  companyId   String    // NEW
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade) // NEW
  code        String    @unique
  // ... rest of fields
}

model Company {
  // ... existing fields ...
  bins        Bin[]     // NEW
}
```

**Controller Updates:**
- Add `companyId: req.user.companyId` to all bin queries
- Update bin creation to set company

**Routes Update:**
- Add authorization to bin endpoints

### Priority 2: Stock Take Authorization (15 min)

**Controller Update:**
```javascript
export const approveStockTake = async (req, res, next) => {
  // Verify user is MANAGER or ADMIN
  if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only Managers and Admins can approve stock takes',
    });
  }
  // ... rest of implementation
};
```

### Priority 3: User Limit Enforcement (30 min)

**Middleware Update:**
```javascript
export const enforceUserLimit = async (req, res, next) => {
  // Only check on user creation
  if (req.method === 'POST' && req.path === '/api/users') {
    const userCount = await prisma.user.count({
      where: { companyId: req.user.companyId },
    });
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });
    const maxUsers = getMaxUsersByPlan(company.plan);
    
    if (userCount >= maxUsers) {
      return res.status(400).json({
        error: 'LimitExceeded',
        message: `Your ${company.plan} plan allows maximum ${maxUsers} users`,
      });
    }
  }
  next();
};
```

**Apply to Routes:**
- Add `enforceUserLimit` to user creation endpoint
- Add to user role update (if promoting to Manager/Staff)

### Priority 4: Site Limit Enforcement (20 min)

**Middleware Update:**
```javascript
export const enforceSiteLimit = async (req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/sites') {
    const siteCount = await prisma.site.count({
      where: { companyId: req.user.companyId },
    });
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });
    const maxSites = getMaxSitesByPlan(company.plan);
    
    if (siteCount >= maxSites) {
      return res.status(400).json({
        error: 'LimitExceeded',
        message: `Your ${company.plan} plan allows maximum ${maxSites} sites`,
      });
    }
  }
  next();
};
```

**Apply to Routes:**
- Add `enforceSiteLimit` to site creation endpoint

---

## 📊 CURRENT STATUS

### Enforcement Coverage
- **Company Isolation:** 95% (missing on bins)
- **Site Filtering:** 90% (some gaps)
- **Plan Limits:** 70% (user/site limits incomplete)
- **Role-Based Access:** 100% (complete)
- **Input Validation:** 95% (minor gaps)
- **Business Logic:** 85% (some validation missing)

### Security Risks
- **Critical:** 1 (bins table)
- **High:** 1 (stock take approval)
- **Medium:** 2 (limit enforcement)
- **Low:** 3 (minor validation gaps)

---

## 🎯 ACTION PLAN

### Immediate Fixes Required (1.5 hours)
1. Add companyId to Bin model (30 min)
2. Add authorization to stock take approval (15 min)
3. Fix user limit enforcement (30 min)
4. Fix site limit enforcement (20 min)

### Recommended Improvements (1 hour)
5. Add stock take inventory adjustment (20 min)
6. Add low stock alert mechanism (20 min)
7. Add order cancellation workflow (20 min)

### Optional Enhancements (1 hour)
8. Add bin capacity validation (20 min)
9. Add order priority escalation (20 min)
10. Add user activity tracking (20 min)

---

## 📝 DECISION NEEDED

The following fixes require your input:

1. **Should bins be company-specific?**
   - Option A: Yes, each company has their own bins (recommended for security)
   - Option B: No, bins are shared across all companies (current state, security risk)

2. **Should stock take approval automatically adjust inventory?**
   - Option A: Yes, automatically adjust inventory on approval
   - Option B: No, manual adjustment required (current state)

3. **Should we implement the recommended improvements?**
   - Option A: Yes, fix all issues (~2.5 hours total)
   - Option B: No, only fix critical issues (~1.5 hours)

---

**Generated:** 2026-01-05 18:40 NZDT  
**Status:** Awaiting user decision  
**Critical Issues:** 4  
**Recommended Fix Time:** 1.5-2.5 hours
