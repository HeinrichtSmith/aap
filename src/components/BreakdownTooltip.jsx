import React from 'react';

const BreakdownTooltip = ({ boxes }) => {
  if (boxes.length <= 1) return null;

  return (
    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity text-xs text-gray-400 whitespace-nowrap pointer-events-none">
      {boxes.map((box, i) => (
        <span key={i}>
          {i > 0 && ' + '}
          {box.count}
          {box.type === 'cosmic' ? '🌟' : 
           box.type === 'mega' ? '💜' : 
           box.type === 'super' ? '🟡' : 
           box.type === 'standard' ? '🔵' : '🟫'}
        </span>
      ))}
    </div>
  );
};

export default BreakdownTooltip; 