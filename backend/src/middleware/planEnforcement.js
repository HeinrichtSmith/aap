import prisma from '../config/database.js';

/**
 * Plan Limits Configuration
 * These define the maximum users and sites per plan
 */
const PLAN_LIMITS = {
  STARTER: {
    users: 15,
    sites: 2,
  },
  PRO: {
    users: 30,
    sites: 4,
  },
  ELITE: {
    users: 50,
    sites: 999, // Effectively unlimited
  },
};

/**
 * Check if user can be added based on plan limits
 * This middleware should be used before creating new users
 */
export const enforceUserLimit = async (req, res, next) => {
  try {
    // Skip check for super-admin or if no company context
    if (!req.user?.companyId) {
      return next();
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Company not found',
      });
    }

    const planLimit = PLAN_LIMITS[company.plan]?.users;
    const currentUsers = company._count.users;

    if (currentUsers >= planLimit) {
      return res.status(403).json({
        error: 'PlanLimitReached',
        message: `Your ${company.plan} plan has reached the user limit of ${planLimit}`,
        details: {
          plan: company.plan,
          currentUsers,
          limit: planLimit,
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if site can be created based on plan limits
 * This middleware should be used before creating new sites
 */
export const enforceSiteLimit = async (req, res, next) => {
  try {
    // Skip check for super-admin or if no company context
    if (!req.user?.companyId) {
      return next();
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      include: {
        _count: {
          select: { sites: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Company not found',
      });
    }

    const planLimit = PLAN_LIMITS[company.plan]?.sites;
    const currentSites = company._count.sites;

    if (currentSites >= planLimit) {
      return res.status(403).json({
        error: 'PlanLimitReached',
        message: `Your ${company.plan} plan has reached the site limit of ${planLimit}`,
        details: {
          plan: company.plan,
          currentSites,
          limit: planLimit,
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if feature is available in current plan
 * Use this middleware for plan-gated features
 */
export const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.companyId) {
        return next();
      }

      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId },
        select: { plan: true },
      });

      if (!company) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Company not found',
        });
      }

      const features = {
        STARTER: ['basic_picking', 'basic_packing', 'basic_reports'],
        PRO: ['basic_picking', 'basic_packing', 'basic_reports', 'batch_picking', 'wave_planning', 'advanced_reports'],
        ELITE: ['basic_picking', 'basic_packing', 'basic_reports', 'batch_picking', 'wave_planning', 'advanced_reports', 'api_access', 'custom_integrations'],
      };

      const availableFeatures = features[company.plan] || [];

      if (!availableFeatures.includes(feature)) {
        return res.status(403).json({
          error: 'FeatureNotAvailable',
          message: `The '${feature}' feature is not available in your ${company.plan} plan`,
          details: {
            currentPlan: company.plan,
            requiredFeature: feature,
            availableFeatures,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get current usage stats for a company
 * This can be used in admin dashboards
 */
export const getUsageStats = async (companyId) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const planLimit = PLAN_LIMITS[company.plan];

    return {
      plan: company.plan,
      users: {
        current: company._count.users,
        limit: planLimit.users,
        remaining: planLimit.users - company._count.users,
        percentage: (company._count.users / planLimit.users) * 100,
      },
      sites: {
        current: company._count.sites,
        limit: planLimit.sites,
        remaining: planLimit.sites - company._count.sites,
        percentage: (company._count.sites / planLimit.sites) * 100,
      },
    };
  } catch (error) {
    throw error;
  }
};
