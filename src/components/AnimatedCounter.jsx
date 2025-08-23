import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ target, duration = 1000, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(target);
  const hasAnimated = useRef(false);
  const previousTarget = useRef(target);
  const animationRef = useRef(null);
  
  useEffect(() => {
    // Skip animation if target hasn't changed
    if (target === previousTarget.current) {
      return;
    }
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const startValue = count;
    const difference = target - startValue;
    const startTime = Date.now();
    
    // Use easing function for smoother animation
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing for smoother animation
      const easedProgress = easeOutQuart(progress);
      const currentValue = startValue + (difference * easedProgress);
      
      setCount(Math.round(currentValue));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
        previousTarget.current = target;
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration, count]);
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

export default AnimatedCounter;