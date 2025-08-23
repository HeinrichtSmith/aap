import { useMemo } from 'react';

export const useTierBreakdown = (quantity) => {
  const tierData = useMemo(() => {
    // Calculate tier breakdown - returns up to 3 box types
    const calculateTierBreakdown = () => {
      if (quantity < 5) {
        return { 
          boxes: [
            { count: quantity, type: 'normal' }
          ]
        };
      }
      
      const normalRemainder = quantity % 5;
      const totalBlueBoxes = Math.floor(quantity / 5);
      
      // For quantities 5-24
      if (totalBlueBoxes < 5) {
        const boxes = [];
        if (totalBlueBoxes > 0) boxes.push({ count: totalBlueBoxes, type: 'standard' });
        if (normalRemainder > 0) boxes.push({ count: normalRemainder, type: 'normal' });
        return { boxes };
      }
      
      // For 25+
      const blueRemainder = totalBlueBoxes % 5;
      const totalGoldBoxes = Math.floor(totalBlueBoxes / 5);
      
      if (totalGoldBoxes < 5) {
        // Gold tier range (25-124)
        const boxes = [];
        if (totalGoldBoxes > 0) boxes.push({ count: totalGoldBoxes, type: 'super' });
        if (blueRemainder > 0) boxes.push({ count: blueRemainder, type: 'standard' });
        if (normalRemainder > 0) boxes.push({ count: normalRemainder, type: 'normal' });
        return { boxes };
      }
      
      // For 125+
      const goldRemainder = totalGoldBoxes % 5;
      const totalPurpleBoxes = Math.floor(totalGoldBoxes / 5);
      
      if (totalPurpleBoxes < 5) {
        // Purple tier range (125-624)
        const boxes = [];
        if (totalPurpleBoxes > 0) boxes.push({ count: totalPurpleBoxes, type: 'mega' });
        if (goldRemainder > 0) boxes.push({ count: goldRemainder, type: 'super' });
        else if (blueRemainder > 0) boxes.push({ count: blueRemainder, type: 'standard' });
        if (normalRemainder > 0) boxes.push({ count: normalRemainder, type: 'normal' });
        return { boxes };
      }
      
      // For 625+ (Cosmic tier)
      const purpleRemainder = totalPurpleBoxes % 5;
      const totalCosmicBoxes = Math.floor(totalPurpleBoxes / 5);
      
      const boxes = [];
      if (totalCosmicBoxes > 0) boxes.push({ count: totalCosmicBoxes, type: 'cosmic' });
      if (purpleRemainder > 0) boxes.push({ count: purpleRemainder, type: 'mega' });
      else if (goldRemainder > 0) boxes.push({ count: goldRemainder, type: 'super' });
      else if (blueRemainder > 0) boxes.push({ count: blueRemainder, type: 'standard' });
      if (normalRemainder > 0) boxes.push({ count: normalRemainder, type: 'normal' });
      
      return { boxes };
    };

    // Get highest tier for overall styling
    const getHighestTier = (boxes) => {
      if (boxes.some(b => b.type === 'cosmic')) return 'cosmic';
      if (boxes.some(b => b.type === 'mega')) return 'mega';
      if (boxes.some(b => b.type === 'super')) return 'super';
      if (boxes.some(b => b.type === 'standard')) return 'standard';
      return 'normal';
    };

    const { boxes } = calculateTierBreakdown();
    const highestTier = getHighestTier(boxes);

    return { boxes, highestTier };
  }, [quantity]);

  return tierData;
}; 