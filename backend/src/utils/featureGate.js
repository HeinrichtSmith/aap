/**
 * FEATURE FLAG GOVERNANCE
 * 
 * Centrally governed feature availability based on plans and organization status.
 * Prevents drift and ensures consistent feature access control.
 * 
 * All feature checks must go through these functions.
 * No inline feature checks allowed.
 */

import { formatErrorResponse } from './errorCodes.js';

// Plan definitions
export const PLANS = {
  STARTER: {
    name: 'starter',
    maxUsers: 15,
    maxSites: 2,
    features: {
      // Basic features
      inventory: true,
      orders: true,
      picking: true,
      packing: true,
      shipping: true,
      products: true,
      bins: true,
      
      // Advanced features (disabled)
      purchaseOrders: false,
      returns: false,
      stockTakes: false,
      batchPicking: false,
      wavePlanning: false,
      barcodeGeneration: false,
      reports: false,
      analytics: false,
    },
  },
  PRO: {
    name: 'pro',
    maxUsers: 30,
    maxSites: 4,
    features: {
      // Basic features
      inventory: true,
      orders: true,
      picking: true,
      packing: true,
      shipping: true,
      products: true,
      bins: true,
      
      // Advanced features (enabled)
      purchaseOrders: true,
      returns: true,
      stockTakes: true,
      batchPicking: true,
      barcodeGeneration: true,
      
      // Elite features (disabled)
      wavePlanning: false,
      reports: false,
      analytics: false,
    },
  },
  ELITE: {
    name: 'elite',
    maxUsers: 50,
    maxSites: -1, // Unlimited
    features: {
      // All features enabled
      inventory: true,
      orders: true,
      picking: true,
      packing: true,
      shipping: true,
      products: true,
      bins: true,
      purchaseOrders: true,
      returns: true,
      stockTakes: true,
      batchPicking: true,
      wavePlanning: true,
      barcodeGeneration: true,
      reports: true,
      analytics: true,
    },
  },
};

/**
 * Check if organization can use a feature
 * @param {Object} organization - Organization object with plan type
 * @param {string} feature - Feature name to check
 * @returns {Object} - { allowed: boolean, plan?: string }
 */
export function canAccessFeature(organization, feature) {
  if (!organization || !organization.plan) {
    throw formatErrorResponse('PLAN_001_PLAN_NOT_FOUND');
  }

  const plan = PLANS[organization.plan.toUpperCase()];
  
  if (!plan) {
    throw formatErrorResponse('PLAN_001_PLAN_NOT_FOUND');
  }

  const allowed = plan.features[feature] || false;

  return {
    allowed,
    plan: plan.name,
    feature,
  };
}

/**
 * Check if organization can access batch picking
 */
export function canUseBatchPicking(organization) {
  const result = canAccessFeature(organization, 'batchPicking');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED', 
      'Batch picking requires Pro or Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can use wave planning
 */
export function canUseWavePlanning(organization) {
  const result = canAccessFeature(organization, 'wavePlanning');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Wave planning requires Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can generate barcodes
 */
export function canGenerateBarcodes(organization) {
  const result = canAccessFeature(organization, 'barcodeGeneration');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Barcode generation requires Pro or Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can access reports
 */
export function canAccessReports(organization) {
  const result = canAccessFeature(organization, 'reports');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Reports require Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can access analytics
 */
export function canAccessAnalytics(organization) {
  const result = canAccessFeature(organization, 'analytics');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Analytics require Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can use purchase orders
 */
export function canUsePurchaseOrders(organization) {
  const result = canAccessFeature(organization, 'purchaseOrders');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Purchase orders require Pro or Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can use returns
 */
export function canUseReturns(organization) {
  const result = canAccessFeature(organization, 'returns');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Returns require Pro or Elite plan');
  }
  
  return true;
}

/**
 * Check if organization can use stock takes
 */
export function canUseStockTakes(organization) {
  const result = canAccessFeature(organization, 'stockTakes');
  
  if (!result.allowed) {
    throw formatErrorResponse('PLAN_002_PLAN_UPGRADE_REQUIRED',
      'Stock takes require Pro or Elite plan');
  }
  
  return true;
}

/**
 * Get all features available to an organization
 */
export function getOrganizationFeatures(organization) {
  if (!organization || !organization.plan) {
    return [];
  }

  const plan = PLANS[organization.plan.toUpperCase()];
  
  if (!plan) {
    return [];
  }

  return Object.entries(plan.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Get plan details
 */
export function getPlanDetails(planName) {
  return PLANS[planName?.toUpperCase()];
}

/**
 * Validate plan name
 */
export function isValidPlan(planName) {
  return PLANS.hasOwnProperty(planName?.toUpperCase());
}
