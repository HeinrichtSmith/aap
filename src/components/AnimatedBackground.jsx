import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const AnimatedBackground = React.memo(() => {
  const [particles, setParticles] = useState([]);
  const particleIdRef = useRef(0);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);
  
  // Memoize particle creation function
  const createParticle = useCallback(() => {
    return {
      id: particleIdRef.current++,
      left: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: 0,
      opacity: Math.random() * 0.5 + 0.5,
      createdAt: Date.now()
    };
  }, []);
  
  // Memoize filter function
  const filterOldParticles = useCallback((particles) => {
    const now = Date.now();
    return particles.filter(p => {
      const age = now - (p.createdAt || 0);
      return age < 30000; // Remove particles older than 30 seconds
    });
  }, []);
  
  useEffect(() => {
    // Create initial particles
    const initialParticles = [];
    for (let i = 0; i < 12; i++) { // Reduced from 20 to 12
      initialParticles.push({
        id: particleIdRef.current++,
        left: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.5 + 0.5,
        createdAt: Date.now()
      });
    }
    setParticles(initialParticles);
    
    // Add new particles periodically
    intervalRef.current = setInterval(() => {
      if (!isActiveRef.current) return;
      
      const newParticle = createParticle();
      
      setParticles(prev => {
        // Batch the filtering and addition
        const filtered = filterOldParticles(prev);
        
        // Limit total particles to prevent memory issues
        if (filtered.length >= 15) {
          return filtered;
        }
        
        return [...filtered, newParticle];
      });
    }, 2000); // Increased interval from 1000 to 2000ms
    
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [createParticle, filterOldParticles]);
  
  // Memoize the CSS styles to prevent recreation
  const gradientStyles = useMemo(() => ({
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
    zIndex: -2
  }), []);
  
  const overlayStyles = useMemo(() => ({
    background: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                radial-gradient(circle at 80% 80%, rgba(96, 165, 250, 0.05) 0%, transparent 50%), 
                radial-gradient(circle at 40% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%)`,
    zIndex: -1,
    animation: 'backgroundShift 20s ease-in-out infinite'
  }), []);
  
  const particleContainerStyles = useMemo(() => ({ zIndex: 1 }), []);
  
  // Memoize the CSS string to prevent recreation
  const cssString = useMemo(() => `
    .particle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: rgba(59, 130, 246, 0.4);
      border-radius: 50%;
      bottom: -10px;
      animation: floatUp linear infinite;
      pointer-events: none;
      will-change: transform;
    }
    
    @keyframes floatUp {
      to {
        transform: translateY(-100vh) translateX(100px);
        opacity: 0;
      }
    }
    
    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    
    @keyframes backgroundShift {
      0%, 100% {
        transform: rotate(0deg) scale(1);
      }
      50% {
        transform: rotate(180deg) scale(1.1);
      }
    }
  `, []);
  
  return (
    <>
      {/* Full viewport gradient background matching app.css */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={gradientStyles}
      />
      
      {/* Radial gradient overlay matching app.css */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={overlayStyles}
      />
      
      {/* Particle container */}
      <div className="fixed inset-0 pointer-events-none" style={particleContainerStyles}>
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              opacity: particle.opacity
            }}
          />
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: cssString
      }} />
    </>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;