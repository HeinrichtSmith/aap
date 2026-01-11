/**
 * PICK PATH OPTIMIZER
 * 
 * Nearest-neighbor TSP (Traveling Salesman Problem) algorithm.
 * Calculates optimal bin visit sequence for picking operations.
 * 
 * Features:
 * - Nearest-neighbor algorithm
 * - Bin coordinate calculation
 * - Distance matrix generation
 * - Path optimization with multiple start/end points
 */

// Get coordinates for a bin location
function getBinCoordinates(binLocation) {
  const parts = binLocation.split('-');
  if (parts.length < 2) return null;

  const zone = parts[0];
  const aisle = zone.toUpperCase();
  const position = parts[1] || '01';
  const level = parts[2] || '01';

  // Default layout coordinates (simplified)
  const aisleX = {
    'A': 0,
    'B': 25,
    'C': 50,
    'D': 75,
  };

  // Get aisle coordinates
  const xPos = aisleX[aisle] !== undefined ? aisleX[aisle] : 0;
  const posNum = parseInt(position);
  const yPos = (posNum % 10) * 5; // 5m per position
  const zPos = (parseInt(level) - 1) * 1.5; // 1.5m per level

  return {
    x: xPos,
    y: yPos,
    z: zPos,
    aisle,
    position,
    level,
  };
}

/**
 * Calculate Manhattan distance between two coordinates
 */
function calculateManhattanDistance(from, to) {
  const horizontal = Math.abs(to.x - from.x);
  const vertical = Math.abs(to.y - from.y);
  const levelDiff = Math.abs(to.z - from.z);
  
  // Add cross-aisle penalty
  const crossAislePenalty = from.aisle !== to.aisle ? 15 : 0;
  
  return horizontal + vertical + levelDiff + crossAislePenalty;
}

/**
 * Calculate distance between two bin locations
 */
function getDistance(bin1, bin2) {
  const coords1 = getBinCoordinates(bin1);
  const coords2 = getBinCoordinates(bin2);

  if (!coords1 || !coords2) {
    return Infinity;
  }

  return calculateManhattanDistance(coords1, coords2);
}

/**
 * Generate distance matrix for all bins
 */
function generateDistanceMatrix(bins) {
  const matrix = {};

  bins.forEach(bin1 => {
    matrix[bin1] = {};
    bins.forEach(bin2 => {
      matrix[bin1][bin2] = getDistance(bin1, bin2);
    });
  });

  return matrix;
}

/**
 * Nearest-neighbor algorithm for TSP
 * Greedy approach that visits nearest unvisited bin
 */
export function optimizePath(bins) {
  if (!bins || bins.length === 0) {
    return [];
  }

  if (bins.length === 1) {
    return bins;
  }

  // Generate distance matrix
  const distanceMatrix = generateDistanceMatrix(bins);

  // Start with first bin
  let path = [bins[0]];
  let unvisited = new Set(bins.slice(1));

  // Visit nearest unvisited bin at each step
  while (unvisited.size > 0) {
    const current = path[path.length - 1];
    let nearest = null;
    let nearestDistance = Infinity;

    unvisited.forEach(bin => {
      const distance = distanceMatrix[current][bin];
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = bin;
      }
    });

    if (nearest) {
      path.push(nearest);
      unvisited.delete(nearest);
    }
  }

  // Calculate total distance
  const totalDistance = calculatePathDistance(path, distanceMatrix);

  return {
    path,
    totalDistance,
    binCount: path.length,
  };
}

/**
 * Calculate total distance for a path
 */
function calculatePathDistance(path, distanceMatrix) {
  let total = 0;

  for (let i = 0; i < path.length - 1; i++) {
    total += distanceMatrix[path[i]][path[i + 1]];
  }

  return total;
}

/**
 * Optimize path with start and end points
 */
export function optimizePathWithEndpoints(bins, startBin, endBin) {
  if (!bins || bins.length === 0) {
    return {
      path: [],
      totalDistance: 0,
    };
  }

  // Add start and end points to bins
  let allBins = [startBin, ...bins, endBin];

  // Remove duplicates
  allBins = [...new Set(allBins)];

  // Optimize full path
  const result = optimizePath(allBins);

  return result;
}

/**
 * Calculate efficiency score for a path
 * Compares optimized path to sequential path
 */
export function calculateEfficiencyScore(bins) {
  if (!bins || bins.length < 2) {
    return {
      score: 100,
      improvement: 0,
    };
  }

  // Generate distance matrix
  const distanceMatrix = generateDistanceMatrix(bins);

  // Calculate sequential path distance
  let sequentialDistance = 0;
  for (let i = 0; i < bins.length - 1; i++) {
    sequentialDistance += distanceMatrix[bins[i]][bins[i + 1]];
  }

  // Optimize path
  const optimizedResult = optimizePath(bins);
  const optimizedDistance = optimizedResult.totalDistance;

  // Calculate improvement
  const improvement = sequentialDistance - optimizedDistance;
  const improvementPercent = sequentialDistance > 0
    ? ((improvement / sequentialDistance) * 100).toFixed(2)
    : 0;

  return {
    score: parseFloat(improvementPercent),
    improvement,
    sequentialDistance,
    optimizedDistance,
    path: optimizedResult.path,
  };
}

/**
 * Find best starting bin for picking
 * Returns bin that minimizes total travel distance
 */
export function findBestStartBin(bins) {
  if (!bins || bins.length === 0) {
    return null;
  }

  if (bins.length === 1) {
    return bins[0];
  }

  // Try each bin as starting point
  let bestStart = bins[0];
  let bestDistance = Infinity;

  for (const startBin of bins) {
    const otherBins = bins.filter(b => b !== startBin);
    const path = [startBin, ...otherBins];

    // Calculate total distance
    const distanceMatrix = generateDistanceMatrix(path);
    let totalDistance = 0;

    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += distanceMatrix[path[i]][path[i + 1]];
    }

    if (totalDistance < bestDistance) {
      bestDistance = totalDistance;
      bestStart = startBin;
    }
  }

  return bestStart;
}

/**
 * Get nearest bins from current location
 */
export function getNearestBins(currentBin, targetBins, limit = 5) {
  if (!targetBins || targetBins.length === 0) {
    return [];
  }

  // Filter out current bin from targets
  const filteredTargets = targetBins.filter(b => b !== currentBin);

  // Calculate distances
  const distances = filteredTargets.map(bin => ({
    bin,
    distance: getDistance(currentBin, bin),
  }));

  // Sort by distance and return top N
  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, limit);
}

// Export optimizer
export const pickPathOptimizer = {
  optimizePath,
  optimizePathWithEndpoints,
  calculateEfficiencyScore,
  findBestStartBin,
  getNearestBins,
};
