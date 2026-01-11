/**
 * WAREHOUSE MAP SERVICE
 * 
 * Spatial awareness for warehouse operations.
 * Travel distance calculation, zone management, pick path optimization.
 * 
 * Features:
 * - Complete warehouse layout (zones, aisles, bins)
 * - Travel distance calculation (meters, seconds)
 * - Pick path efficiency scoring
 * - Nearest bin search
 * - Zone-aware routing
 */

import prisma from '../config/database.js';
import { pickPathOptimizer } from '../utils/pickPathOptimizer.js';
import logger from '../utils/logger.js';

// Warehouse layout constants (can be customized per site)
const DEFAULT_LAYOUT = {
  aisles: {
    A: { x: 0, width: 20, y: 0, depth: 50 },    // Aisle A
    B: { x: 25, width: 20, y: 0, depth: 50 },   // Aisle B
    C: { x: 50, width: 20, y: 0, depth: 50 },   // Aisle C
    D: { x: 75, width: 20, y: 0, depth: 50 },   // Aisle D
  },
  zones: {
    RECEIVING: { x: 0, y: 60, width: 100, depth: 20 },
    SHIPPING: { x: 0, y: -20, width: 100, depth: 20 },
    STAGING: { x: 0, y: 110, width: 100, depth: 20 },
  },
  // Walking speed: meters per second
  walkSpeed: 1.5,
  // Cross-aisle travel time (seconds)
  crossAisleTime: 10,
};

/**
 * Get complete warehouse map
 */
export async function getWarehouseMap(siteId) {
  // Get warehouse layout from site config or use default
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  const layout = site?.warehouseLayout 
    ? JSON.parse(site.warehouseLayout)
    : DEFAULT_LAYOUT;

  // Get all bins with inventory
  const bins = await prisma.inventoryItem.findMany({
    where: { siteId },
    select: {
      binLocation: true,
      quantityAvailable: true,
      quantityTotal: true,
    },
  });

  // Group by zone
  const zones = {};
  bins.forEach(bin => {
    const zone = bin.binLocation?.split('-')[0] || 'UNKNOWN';
    if (!zones[zone]) {
      zones[zone] = {
        zone,
        bins: [],
        itemCount: 0,
        totalQuantity: 0,
      };
    }
    zones[zone].bins.push(bin.binLocation);
    zones[zone].itemCount++;
    zones[zone].totalQuantity += bin.quantityTotal;
  });

  return {
    layout,
    zones: Object.values(zones),
    totalBins: bins.length,
    statistics: {
      totalItems: bins.length,
      totalQuantity: bins.reduce((sum, b) => sum + b.quantityTotal, 0),
      zoneCount: Object.keys(zones).length,
    },
  };
}

/**
 * Calculate travel distance between two bin locations
 */
export async function getTravelDistance(fromBin, toBin, siteId) {
  // Get coordinates for both bins
  const fromCoords = getBinCoordinates(fromBin);
  const toCoords = getBinCoordinates(toBin);

  if (!fromCoords || !toCoords) {
    throw new Error('Invalid bin location format');
  }

  // Calculate Manhattan distance (warehouse layout)
  const distance = calculateManhattanDistance(fromCoords, toCoords);

  // Calculate time
  const time = calculateTravelTime(distance);

  return {
    fromBin,
    toBin,
    distance, // meters
    time, // seconds
    path: [
      { location: fromBin, x: fromCoords.x, y: fromCoords.y },
      { location: toBin, x: toCoords.x, y: toCoords.y },
    ],
  };
}

/**
 * Get coordinates for a bin location
 */
function getBinCoordinates(binLocation) {
  const parts = binLocation.split('-');
  if (parts.length < 2) return null;

  const zone = parts[0];
  const aisle = zone.toUpperCase();
  const position = parts[1] || '01';
  const level = parts[2] || '01';

  // Default layout coordinates
  const layout = DEFAULT_LAYOUT;

  // Get aisle coordinates
  const aisleData = layout.aisles[aisle];
  if (!aisleData) return null;

  // Calculate position within aisle
  const posNum = parseInt(position);
  const xPos = aisleData.x + (posNum / 10) * 5; // 5m per position
  const yPos = aisleData.y + (posNum % 10) * 5; // 5m per shelf position

  // Adjust for level (vertical offset - assumes racks with levels)
  const levelOffset = (parseInt(level) - 1) * 1.5; // 1.5m per level

  return {
    x: xPos,
    y: yPos,
    z: levelOffset,
    aisle,
    position,
    level,
  };
}

/**
 * Calculate Manhattan distance between two coordinates
 */
function calculateManhattanDistance(from, to) {
  // Horizontal distance
  const horizontal = Math.abs(to.x - from.x);

  // Vertical distance
  const vertical = Math.abs(to.y - from.y);

  // Level difference
  const levelDiff = Math.abs(to.z - from.z);

  // Different aisles require cross-aisle travel
  let crossAisleDistance = 0;
  if (from.aisle !== to.aisle) {
    crossAisleDistance = DEFAULT_LAYOUT.crossAisleTime * DEFAULT_LAYOUT.walkSpeed;
  }

  // Total distance
  return horizontal + vertical + levelDiff + crossAisleDistance;
}

/**
 * Calculate travel time from distance
 */
function calculateTravelTime(distance) {
  return Math.round(distance / DEFAULT_LAYOUT.walkSpeed);
}

/**
 * Find nearest bin from current location
 */
export async function findNearestBin(
  siteId,
  fromBin,
  sku = null,
  preferredZone = null
) {
  const where = { siteId };

  // Filter by SKU if specified
  if (sku) {
    where.sku = sku;
  }

  // Get all potential bins
  const bins = await prisma.inventoryItem.findMany({
    where: { ...where, quantityAvailable: { gt: 0 } },
    select: {
      binLocation: true,
      quantityAvailable: true,
      sku: true,
    },
  });

  if (bins.length === 0) {
    return {
      success: false,
      message: 'No bins with available inventory found',
    };
  }

  // Calculate distance from each bin
  const fromCoords = getBinCoordinates(fromBin);
  if (!fromCoords) {
    return {
      success: false,
      message: 'Invalid starting bin location',
    };
  }

  const binDistances = [];
  for (const bin of bins) {
    const binCoords = getBinCoordinates(bin.binLocation);
    if (binCoords) {
      const distance = calculateManhattanDistance(fromCoords, binCoords);

      binDistances.push({
        binLocation: bin.binLocation,
        sku: bin.sku,
        quantity: bin.quantityAvailable,
        distance,
        zone: bin.binLocation.split('-')[0],
      });
    }
  }

  // Sort by distance
  binDistances.sort((a, b) => a.distance - b.distance);

  // Filter by preferred zone if specified
  let filtered = binDistances;
  if (preferredZone) {
    const zoneBins = binDistances.filter(b => b.zone === preferredZone);
    if (zoneBins.length > 0) {
      filtered = zoneBins;
    }
  }

  return {
    success: true,
    nearest: filtered[0],
    alternatives: filtered.slice(0, 5),
  };
}

/**
 * Calculate pick path efficiency
 */
export async function calculatePickPathEfficiency(bins, siteId) {
  if (!bins || bins.length === 0) {
    return {
      efficiency: 0,
      message: 'No bins provided',
    };
  }

  // Get coordinates for all bins
  const binCoords = bins.map(bin => ({
    binLocation: bin,
    ...getBinCoordinates(bin),
  })).filter(b => b.x !== undefined);

  if (binCoords.length === 0) {
    return {
      efficiency: 0,
      message: 'Invalid bin locations',
    };
  }

  // Optimize path using nearest-neighbor algorithm
  const optimizedPath = pickPathOptimizer.optimizePath(bins);

  // Calculate total distance for optimized path
  let optimizedDistance = 0;
  for (let i = 0; i < optimizedPath.length - 1; i++) {
    const from = binCoords.find(b => b.binLocation === optimizedPath[i]);
    const to = binCoords.find(b => b.binLocation === optimizedPath[i + 1]);
    if (from && to) {
      optimizedDistance += calculateManhattanDistance(from, to);
    }
  }

  // Calculate total distance for original path
  let originalDistance = 0;
  for (let i = 0; i < bins.length - 1; i++) {
    const from = binCoords.find(b => b.binLocation === bins[i]);
    const to = binCoords.find(b => b.binLocation === bins[i + 1]);
    if (from && to) {
      originalDistance += calculateManhattanDistance(from, to);
    }
  }

  // Calculate efficiency score (0-100)
  const efficiencyScore = Math.round(
    ((originalDistance - optimizedDistance) / originalDistance) * 100
  );

  const improvement = originalDistance - optimizedDistance;

  return {
    efficiency: efficiencyScore,
    originalDistance,
    optimizedDistance,
    improvement,
    improvementPercent: efficiencyScore,
    timeSaved: Math.round(improvement / DEFAULT_LAYOUT.walkSpeed),
    optimizedPath,
  };
}

/**
 * Get zone layout
 */
export async function getZoneLayout(siteId, zone) {
  const bins = await prisma.inventoryItem.findMany({
    where: {
      siteId,
      binLocation: { startsWith: zone },
    },
    select: {
      binLocation: true,
      quantityTotal: true,
      quantityAvailable: true,
    },
  });

  // Group by aisle
  const aisles = {};
  bins.forEach(bin => {
    const parts = bin.binLocation.split('-');
    const aisle = parts[0];
    const position = parts[1] || '01';
    const level = parts[2] || '01';

    if (!aisles[`${aisle}-${position}`]) {
      aisles[`${aisle}-${position}`] = {
        location: `${aisle}-${position}`,
        levels: [],
      };
    }

    aisles[`${aisle}-${position}`].levels.push({
      level,
      binLocation: bin.binLocation,
      quantityTotal: bin.quantityTotal,
      quantityAvailable: bin.quantityAvailable,
    });
  });

  return {
    zone,
    positions: Object.values(aisles),
    totalBins: bins.length,
  };
}

// Export service
export const warehouseMapService = {
  getWarehouseMap,
  getTravelDistance,
  findNearestBin,
  calculatePickPathEfficiency,
  getZoneLayout,
};
