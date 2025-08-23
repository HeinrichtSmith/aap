import { useMemo } from 'react';

export const useStacking = (boxes) => {
  const stackConfig = useMemo(() => {
    // Get stacking configuration for 3 box types
    const getStackConfiguration = () => {
      const positions = [];
      
      // Calculate total boxes to display (max 14)
      let totalToDisplay = 0;
      const displayBoxes = [];
      
      // If we only have one box type, we can show up to 14
      // If we have multiple types, limit each to reasonable amounts
      const maxPerType = boxes.length === 1 ? 14 : 5;
      
      // Limit each type to reasonable display counts
      boxes.forEach(boxGroup => {
        const displayCount = Math.min(boxGroup.count, maxPerType);
        if (totalToDisplay + displayCount <= 14) {
          displayBoxes.push({ ...boxGroup, displayCount });
          totalToDisplay += displayCount;
        } else if (totalToDisplay < 14) {
          // Partial display
          const remaining = 14 - totalToDisplay;
          displayBoxes.push({ ...boxGroup, displayCount: remaining });
          totalToDisplay = 14;
        }
      });
      
      // Position layouts for different total counts - improved stacking
      const layouts = {
        1: [
          { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 1 }
        ],
        2: [
          { x: -12, y: 0, scale: 0.9, rotation: -3, zIndex: 1 },
          { x: 12, y: 0, scale: 0.9, rotation: 3, zIndex: 2 }
        ],
        3: [
          { x: -20, y: 0, scale: 0.85, rotation: -3, zIndex: 1 },
          { x: 0, y: 0, scale: 0.85, rotation: 0, zIndex: 2 },
          { x: 20, y: 0, scale: 0.85, rotation: 3, zIndex: 3 }
        ],
        4: [
          { x: -15, y: -8, scale: 0.8, rotation: -3, zIndex: 1 },
          { x: 15, y: -8, scale: 0.8, rotation: 3, zIndex: 2 },
          { x: -15, y: 10, scale: 0.8, rotation: -3, zIndex: 3 },
          { x: 15, y: 10, scale: 0.8, rotation: 3, zIndex: 4 }
        ],
        5: [
          { x: -20, y: -8, scale: 0.75, rotation: -3, zIndex: 1 },
          { x: 0, y: -8, scale: 0.75, rotation: 0, zIndex: 2 },
          { x: 20, y: -8, scale: 0.75, rotation: 3, zIndex: 3 },
          { x: -10, y: 10, scale: 0.75, rotation: -2, zIndex: 4 },
          { x: 10, y: 10, scale: 0.75, rotation: 2, zIndex: 5 }
        ],
        6: [
          { x: -20, y: -8, scale: 0.7, rotation: -3, zIndex: 1 },
          { x: 0, y: -8, scale: 0.7, rotation: 0, zIndex: 2 },
          { x: 20, y: -8, scale: 0.7, rotation: 3, zIndex: 3 },
          { x: -20, y: 10, scale: 0.7, rotation: -3, zIndex: 4 },
          { x: 0, y: 10, scale: 0.7, rotation: 0, zIndex: 5 },
          { x: 20, y: 10, scale: 0.7, rotation: 3, zIndex: 6 }
        ],
        7: [
          { x: -24, y: -8, scale: 0.65, rotation: -3, zIndex: 1 },
          { x: -8, y: -8, scale: 0.65, rotation: -1, zIndex: 2 },
          { x: 8, y: -8, scale: 0.65, rotation: 1, zIndex: 3 },
          { x: 24, y: -8, scale: 0.65, rotation: 3, zIndex: 4 },
          { x: -16, y: 10, scale: 0.65, rotation: -2, zIndex: 5 },
          { x: 0, y: 10, scale: 0.65, rotation: 0, zIndex: 6 },
          { x: 16, y: 10, scale: 0.65, rotation: 2, zIndex: 7 }
        ],
        8: [
          { x: -24, y: -8, scale: 0.6, rotation: -3, zIndex: 1 },
          { x: -8, y: -8, scale: 0.6, rotation: -1, zIndex: 2 },
          { x: 8, y: -8, scale: 0.6, rotation: 1, zIndex: 3 },
          { x: 24, y: -8, scale: 0.6, rotation: 3, zIndex: 4 },
          { x: -24, y: 10, scale: 0.6, rotation: -3, zIndex: 5 },
          { x: -8, y: 10, scale: 0.6, rotation: -1, zIndex: 6 },
          { x: 8, y: 10, scale: 0.6, rotation: 1, zIndex: 7 },
          { x: 24, y: 10, scale: 0.6, rotation: 3, zIndex: 8 }
        ],
        9: [
          { x: -24, y: -14, scale: 0.55, rotation: -2, zIndex: 1 },
          { x: 0, y: -14, scale: 0.55, rotation: 0, zIndex: 2 },
          { x: 24, y: -14, scale: 0.55, rotation: 2, zIndex: 3 },
          { x: -24, y: 0, scale: 0.55, rotation: -2, zIndex: 4 },
          { x: 0, y: 0, scale: 0.55, rotation: 0, zIndex: 5 },
          { x: 24, y: 0, scale: 0.55, rotation: 2, zIndex: 6 },
          { x: -24, y: 14, scale: 0.55, rotation: -2, zIndex: 7 },
          { x: 0, y: 14, scale: 0.55, rotation: 0, zIndex: 8 },
          { x: 24, y: 14, scale: 0.55, rotation: 2, zIndex: 9 }
        ],
        10: [
          { x: -30, y: -14, scale: 0.5, rotation: -2, zIndex: 1 },
          { x: -10, y: -14, scale: 0.5, rotation: -1, zIndex: 2 },
          { x: 10, y: -14, scale: 0.5, rotation: 1, zIndex: 3 },
          { x: 30, y: -14, scale: 0.5, rotation: 2, zIndex: 4 },
          { x: -30, y: 0, scale: 0.5, rotation: -2, zIndex: 5 },
          { x: -10, y: 0, scale: 0.5, rotation: -1, zIndex: 6 },
          { x: 10, y: 0, scale: 0.5, rotation: 1, zIndex: 7 },
          { x: 30, y: 0, scale: 0.5, rotation: 2, zIndex: 8 },
          { x: -20, y: 14, scale: 0.5, rotation: -1, zIndex: 9 },
          { x: 20, y: 14, scale: 0.5, rotation: 1, zIndex: 10 }
        ],
        11: [
          { x: -30, y: -14, scale: 0.48, rotation: -2, zIndex: 1 },
          { x: -10, y: -14, scale: 0.48, rotation: -1, zIndex: 2 },
          { x: 10, y: -14, scale: 0.48, rotation: 1, zIndex: 3 },
          { x: 30, y: -14, scale: 0.48, rotation: 2, zIndex: 4 },
          { x: -30, y: 0, scale: 0.48, rotation: -2, zIndex: 5 },
          { x: -10, y: 0, scale: 0.48, rotation: -1, zIndex: 6 },
          { x: 10, y: 0, scale: 0.48, rotation: 1, zIndex: 7 },
          { x: 30, y: 0, scale: 0.48, rotation: 2, zIndex: 8 },
          { x: -20, y: 14, scale: 0.48, rotation: -1, zIndex: 9 },
          { x: 0, y: 14, scale: 0.48, rotation: 0, zIndex: 10 },
          { x: 20, y: 14, scale: 0.48, rotation: 1, zIndex: 11 }
        ],
        12: [
          { x: -30, y: -14, scale: 0.45, rotation: -2, zIndex: 1 },
          { x: -10, y: -14, scale: 0.45, rotation: -1, zIndex: 2 },
          { x: 10, y: -14, scale: 0.45, rotation: 1, zIndex: 3 },
          { x: 30, y: -14, scale: 0.45, rotation: 2, zIndex: 4 },
          { x: -30, y: 0, scale: 0.45, rotation: -2, zIndex: 5 },
          { x: -10, y: 0, scale: 0.45, rotation: -1, zIndex: 6 },
          { x: 10, y: 0, scale: 0.45, rotation: 1, zIndex: 7 },
          { x: 30, y: 0, scale: 0.45, rotation: 2, zIndex: 8 },
          { x: -30, y: 14, scale: 0.45, rotation: -2, zIndex: 9 },
          { x: -10, y: 14, scale: 0.45, rotation: -1, zIndex: 10 },
          { x: 10, y: 14, scale: 0.45, rotation: 1, zIndex: 11 },
          { x: 30, y: 14, scale: 0.45, rotation: 2, zIndex: 12 }
        ],
        13: [
          { x: -36, y: -14, scale: 0.42, rotation: -2, zIndex: 1 },
          { x: -18, y: -14, scale: 0.42, rotation: -1, zIndex: 2 },
          { x: 0, y: -14, scale: 0.42, rotation: 0, zIndex: 3 },
          { x: 18, y: -14, scale: 0.42, rotation: 1, zIndex: 4 },
          { x: 36, y: -14, scale: 0.42, rotation: 2, zIndex: 5 },
          { x: -36, y: 0, scale: 0.42, rotation: -2, zIndex: 6 },
          { x: -18, y: 0, scale: 0.42, rotation: -1, zIndex: 7 },
          { x: 0, y: 0, scale: 0.42, rotation: 0, zIndex: 8 },
          { x: 18, y: 0, scale: 0.42, rotation: 1, zIndex: 9 },
          { x: 36, y: 0, scale: 0.42, rotation: 2, zIndex: 10 },
          { x: -24, y: 14, scale: 0.42, rotation: -1, zIndex: 11 },
          { x: 0, y: 14, scale: 0.42, rotation: 0, zIndex: 12 },
          { x: 24, y: 14, scale: 0.42, rotation: 1, zIndex: 13 }
        ],
        14: [
          { x: -36, y: -14, scale: 0.4, rotation: -2, zIndex: 1 },
          { x: -18, y: -14, scale: 0.4, rotation: -1, zIndex: 2 },
          { x: 0, y: -14, scale: 0.4, rotation: 0, zIndex: 3 },
          { x: 18, y: -14, scale: 0.4, rotation: 1, zIndex: 4 },
          { x: 36, y: -14, scale: 0.4, rotation: 2, zIndex: 5 },
          { x: -36, y: 0, scale: 0.4, rotation: -2, zIndex: 6 },
          { x: -18, y: 0, scale: 0.4, rotation: -1, zIndex: 7 },
          { x: 0, y: 0, scale: 0.4, rotation: 0, zIndex: 8 },
          { x: 18, y: 0, scale: 0.4, rotation: 1, zIndex: 9 },
          { x: 36, y: 0, scale: 0.4, rotation: 2, zIndex: 10 },
          { x: -30, y: 14, scale: 0.4, rotation: -1.5, zIndex: 11 },
          { x: -10, y: 14, scale: 0.4, rotation: -0.5, zIndex: 12 },
          { x: 10, y: 14, scale: 0.4, rotation: 0.5, zIndex: 13 },
          { x: 30, y: 14, scale: 0.4, rotation: 1.5, zIndex: 14 }
        ]
      };
      
      const layout = layouts[totalToDisplay] || layouts[1];
      let positionIndex = 0;
      
      // Add boxes in order from highest tier to lowest
      displayBoxes.forEach(boxGroup => {
        for (let i = 0; i < boxGroup.displayCount && positionIndex < totalToDisplay; i++) {
          positions.push({
            ...layout[positionIndex],
            isTier: boxGroup.type !== 'normal',
            tierType: boxGroup.type
          });
          positionIndex++;
        }
      });
      
      return positions;
    };

    return getStackConfiguration();
  }, [boxes]);

  return stackConfig;
}; 