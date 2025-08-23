import React, { useState, useEffect, useRef } from 'react';

const ParticleEffect = () => {
  const [particles, setParticles] = useState([]);
  const particleIdRef = useRef(0);
  
  useEffect(() => {
    // Create initial particles
    const initialParticles = [];
    for (let i = 0; i < 20; i++) {
      initialParticles.push({
        id: particleIdRef.current++,
        left: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.5 + 0.5
      });
    }
    setParticles(initialParticles);
    
    // Add new particles periodically
    const interval = setInterval(() => {
      const newParticle = {
        id: particleIdRef.current++,
        left: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: 0,
        opacity: Math.random() * 0.5 + 0.5
      };
      
      setParticles(prev => {
        // Remove old particles and add new one
        const filtered = prev.filter(p => {
          const age = Date.now() - (p.createdAt || 0);
          return age < 30000; // Remove particles older than 30 seconds
        });
        return [...filtered, { ...newParticle, createdAt: Date.now() }];
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      {/* Particle container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
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
        __html: `
          .particle {
            position: absolute;
            width: 7px;
            height: 7px;
            background: rgba(59, 130, 246, 0.5);
            border-radius: 50%;
            bottom: -10px;
            animation: floatUp linear infinite;
            pointer-events: none;
          }
          
          @keyframes floatUp {
            to {
              transform: translateY(-100vh) translateX(100px);
              opacity: 0;
            }
          }
        `
      }} />
    </>
  );
};

export default ParticleEffect;