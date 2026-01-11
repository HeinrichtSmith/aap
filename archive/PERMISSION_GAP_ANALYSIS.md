# Permission Gap Analysis Report

**Generated:** 2026-01-05 17:53 NZDT  
**Status:** Critical Security Issues Identified

---

## ⚠️ CRITICAL FINDINGS

### Products Controller - CRITICAL GAPS

**Issues:**

1. **No Company Isolation** 🔴 CRITICAL
   - `getProducts()` - No company filter, all users see all products
   - `getProduct()` - No company check
   - `getProductBySku()` - No company check
   - `getProductByBarcode()` - No company check
   - `createProduct()` - No company association
   - `updateProduct()` - No company verification
   - `deleteProduct()` - No company verification
   - `updateInventory()` - No company/site verification

2. **No Site Filtering** 🔴 CRITICAL
   - Products should be filtered by user's site
   - Non-admin users see inventory from all sites
   - Security risk: users can see inventory across all warehouses

3. **No Authorization Checks** 🔴 CRITICAL
   - `createProduct()` - Anyone can create products
   - `updateProduct()` - Anyone can update any product
   - `deleteProduct()` - Anyone can delete any product
   - `updateInventory()` - No role check, anyone can adjust inventory

4. **Missing SiteId in Product Model** 🟡 MEDIUM
   - Product model has no siteId field
   - Cannot associate products with specific sites
   - Makes site-level filtering impossible

**Impact:** 🔴 HIGH
- Cross-company data leakage
- Unauthorized product management
- Inventory manipulation from any site
- No data isolation between tenants

---

### Orders Controller - CRITICAL GAPS

**Issues:**

1. **No Company Isolation** 🔴 CRITICAL
   - `getOrders()` - No company filter
   - `getOrder()` - No company check
   - `createOrder()` - No company association, no siteId
   - `updateOrderStatus()` - No company verification
   - `assignPicker()` - No company verification
   - `pickItem()` - No company verification
   - `assignPacker()` - No company verification
   - `packOrder()` - No company verification
   - `shipOrder()` - No company verification
   - `getOrderStats()` - No company filter

2. **No Site Filtering** 🔴 CRITICAL
   - Orders should be filtered by user's site
   - Non-admin users see orders from all sites
   - Pickers/packers see orders from all warehouses

3. **Missing Authorization** 🔴 CRITICAL
   - `assignPicker()` - No role check, anyone can assign
   - `assignPacker()` - No role check, anyone can assign
   - `pickItem()` - No verification that user is assigned picker
   - `packOrder()` - No verification that user is assigned packer
   - `shipOrder()` - No role check
   - `createOrder()` - No role check

4. **Missing Site Association** 🔴 CRITICAL
   - `createOrder()` doesn't set siteId
   - Orders not tied to specific warehouse
   - Cannot filter orders by site
   - Site-level workflow impossible

5. **Order ID Generation** 🟡 MEDIUM
   - `createOrder()` generates ID client-side with timestamp
   - Collision risk in high-volume scenarios
   - Should use database auto-increment or UUID

**Impact:** 🔴 HIGH
- Cross-company order access
- Unauthorized order management
- Pickers/packers can manipulate any order
- No site-based order routing
- Potential for order fraud

---

## 📋 SCHEMA GAPS IDENTIFIED

### Product Model Missing Fields
```prisma
model Product {
  // ... existing fields ...
  
  // MISSING:
  companyId  String  @default(uuid())  // Required for multi-tenancy
  siteId     String?                     // Optional: products can be at multiple sites
  
  // MISSING RELATIONS:
  company     Company @relation(fields: [companyId], references: [id])
  site        Site?   @relation(fields: [siteId], references: [id])
}
```

### Order Model Has siteId But Not Used
```prisma
model Order {
  // siteId exists but not being set in createOrder()
  siteId      String
  
  // Needs relation if not already there
  site        Site     @relation(fields: [siteId], references: [id])
}
```

---

## 🔧 REQUIRED FIXES

### Products Controller (8 functions)

1. **getProducts()**
   - Add `where.companyId = req.user.companyId`
   - Add site filter for non-admin users
   - Filter inventory by user's site

2. **getProduct()**
   - Add company check: `companyId: req.user.companyId`
   - Return 404 if not found or wrong company

3. **getProductBySku()**
   - Add company check
   - Return 404 if not found or wrong company

4. **getProductByBarcode()**
   - Add company check
   - Return 404 if not found or wrong company

5. **createProduct()**
   - Add authorization: ADMIN/MANAGER only
   - Set `companyId: req.user.companyId`
   - Set `siteId: req.user.siteId` (optional)

6. **updateProduct()**
   - Add company check before update
   - Add authorization: ADMIN/MANAGER only
   - Return 404 if not found or wrong company

7. **deleteProduct()**
   - Add company check before delete
   - Add authorization: ADMIN only
   - Return 404 if not found or wrong company

8. **updateInventory()**
   - Add authorization: ADMIN/MANAGER/RECEIVER
   - Verify user can access the bin (site check)
   - Add company check
   - Validate inventory doesn't go negative

### Orders Controller (10 functions)

1. **getOrders()**
   - Add `where.companyId = req.user.companyId`
   - Add site filter for non-admin users
   - Filter by user's site

2. **getOrder()**
   - Add company check
   - Return 404 if not found or wrong company

3. **createOrder()**
   - Add authorization: ADMIN/MANAGER only
   - Set `companyId: req.user.companyId`
   - Set `siteId` (should come from request or default to user's site)
   - Validate site belongs to company

4. **updateOrderStatus()**
   - Add company check
   - Add authorization: ADMIN/MANAGER only
   - Return 404 if not found or wrong company

5. **assignPicker()**
   - Add company check
   - Add authorization: ADMIN/MANAGER only
   - Verify picker exists and belongs to company
   - Verify order belongs to company
   - Return 404 if not found or wrong company

6. **pickItem()**
   - Add company check
   - Verify user is assigned picker for this order
   - Return 403 if not authorized
   - Return 404 if not found or wrong company

7. **assignPacker()**
   - Add company check
   - Add authorization: ADMIN/MANAGER only
   - Verify packer exists and belongs to company
   - Verify order belongs to company
   - Return 404 if not found or wrong company

8. **packOrder()**
   - Add company check
   - Verify user is assigned packer for this order
   - Add authorization: PACKER only (or ADMIN/MANAGER)
   - Return 403 if not authorized
   - Return 404 if not found or wrong company

9. **shipOrder()**
   - Add company check
   - Add authorization: ADMIN/MANAGER only
   - Return 404 if not found or wrong company

10. **getOrderStats()**
    - Add company filter
    - Filter by user's site if not admin
    - Return stats for user's company only

---

## 📊 SUMMARY

### Critical Issues: 18
- Products Controller: 8 critical issues
- Orders Controller: 10 critical issues

### Impact: HIGH 🔴
- Cross-company data access
- Unauthorized mutations
- No multi-tenancy isolation
- Security vulnerability

### Estimated Fix Time: 2-3 hours
- Schema updates: 30 minutes
- Products controller fixes: 1 hour
- Orders controller fixes: 1 hour
- Testing: 30 minutes

---

## 🎯 RECOMMENDED ACTION PLAN

### Step 1: Schema Updates (30 min)
1. Add companyId and siteId to Product model
2. Create migration
3. Run migration

### Step 2: Products Controller Fixes (1 hour)
1. Add company isolation to all queries
2. Add site filtering for non-admin users
3. Add authorization middleware
4. Add role checks
5. Test all endpoints

### Step 3: Orders Controller Fixes (1 hour)
1. Add company isolation to all queries
2. Add site filtering for non-admin users
3. Add authorization checks for picking/packing
4. Verify picker/packer assignments
5. Test all endpoints

### Step 4: Testing (30 min)
1. Test with ADMIN role
2. Test with MANAGER role
3. Test with PICKER role
4. Test with PACKER role
5. Test cross-company access (should fail)

---

## ⚠️ IMMEDIATE RISKS

**If Not Fixed Before Production:**
1. **Data Leakage:** Company A can see Company B's data
2. **Unauthorized Access:** Any user can modify any product/order
3. **Fraud Risk:** Pickers can pick orders not assigned to them
4. **Compliance Issues:** No proper data isolation for regulations
5. **Audit Trail Gaps:** Cannot track who accessed what data

**Production Blocker:** YES - Should fix before deployment

---

## 📝 NOTES

### Design Decisions Needed
1. **Product-Site Relationship:**
   - Option A: One product can be at multiple sites (current schema)
   - Option B: Product is site-specific (simpler, may not fit all use cases)
   - Recommendation: Keep Option A, add junction table or use inventory for site association

2. **Order Site Assignment:**
   - Should siteId be required on order creation?
   - Should it default to user's site?
   - Recommendation: Required, validated against company's sites

3. **Picker/Packer Authorization:**
   - Should pickers only pick orders assigned to them?
   - Current: Yes, needs verification
   - Recommendation: Enforce strictly

---

**Priority:** CRITICAL  
**Timeline:** Fix before production  
**Complexity:** HIGH (requires schema changes + controller updates)
