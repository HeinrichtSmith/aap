import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { playSound } from '../utils/audio';

const PackingTimer = ({ onComplete, isActive, compact = false }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          if (newSeconds % 30 === 0 && newSeconds > 0) {
            playSound('tick');
          }
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive && seconds > 0) {
      onComplete(seconds);
    }
  }, [isActive, seconds, onComplete]);

  return (
    <div className="flex items-center space-x-2">
      <Timer className="text-blue-400 animate-pulse" size={compact ? 16 : 20} />
      <div className={`font-mono bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent ${
        compact ? 'text-xl' : 'text-5xl'
      }`}>
        {formatTime(seconds)}
      </div>
    </div>
  );
};

export default PackingTimer;