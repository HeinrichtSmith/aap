import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ progress, size = 60, strokeWidth = 4, strokeColor = "#3b82f6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);
  const [rotation, setRotation] = useState(0);
  const [prevProgress, setPrevProgress] = useState(progress);

  // Determine stroke color based on progress
  const getStrokeColor = () => {
    if (progress >= 1) {
      return "#22c55e"; // Green (completed)
    } else if (progress > 0) {
      return "#eab308"; // Yellow (in progress)
    } else {
      return "#3b82f6"; // Blue (not started)
    }
  };

  const dynamicStrokeColor = strokeColor === "#3b82f6" ? getStrokeColor() : strokeColor;

  // Calculate Y-shaped hole pattern
  // Each hole takes up about 5% of the circumference, with 3 holes evenly spaced
  const holeSize = circumference * 0.05;
  const segmentSize = (circumference - holeSize * 3) / 3;
  
  // Create dash array pattern with 3 holes forming a Y shape
  const dashPattern = `${segmentSize} ${holeSize}`;

  // Add rotation effect when progress changes
  useEffect(() => {
    if (progress !== prevProgress) {
      if (progress > prevProgress) {
        // Adding items - rotate clockwise
        setRotation(prev => prev + 15);
      } else if (progress < prevProgress) {
        // Removing items - rotate counter-clockwise
        setRotation(prev => prev - 15);
      }
      setPrevProgress(progress);
    }
  }, [progress, prevProgress]);

  return (
    <motion.div
      animate={{ rotate: rotation }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        duration: 0.15
      }}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {/* Define a mask for the Y-shaped holes */}
          <mask id={`y-holes-mask-${size}-${rotation}`}>
            <rect x="0" y="0" width={size} height={size} fill="white" />
            {/* Create 3 rectangular holes at 120-degree intervals to form Y shape */}
            <rect 
              x={size/2 - strokeWidth/2} 
              y="0" 
              width={strokeWidth} 
              height={radius * 0.7} 
              fill="black"
              transform={`rotate(0 ${size/2} ${size/2})`}
            />
            <rect 
              x={size/2 - strokeWidth/2} 
              y="0" 
              width={strokeWidth} 
              height={radius * 0.7} 
              fill="black"
              transform={`rotate(120 ${size/2} ${size/2})`}
            />
            <rect 
              x={size/2 - strokeWidth/2} 
              y="0" 
              width={strokeWidth} 
              height={radius * 0.7} 
              fill="black"
              transform={`rotate(240 ${size/2} ${size/2})`}
            />
          </mask>
        </defs>
        
        {/* Background circle with Y-shaped holes */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
          mask={`url(#y-holes-mask-${size}-${rotation})`}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dynamicStrokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-150"
          mask={`url(#y-holes-mask-${size}-${rotation})`}
        />
      </svg>
    </motion.div>
  );
};

export default ProgressRing;