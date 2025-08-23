import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/audio';

const EpicTransition = ({ isActive, onComplete }) => {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState('countdown'); // 'countdown', 'launch', 'complete'

  useEffect(() => {
    if (!isActive) {
      setCountdown(3);
      setPhase('countdown');
      return;
    }

    // Play initial countdown sound for "3" (lowest pitch)
    playSound('levelUp1');

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('launch');
          // Play launch sound (highest pitch)
          playSound('levelUp4');
          // Trigger completion after launch sequence
          setTimeout(() => {
            setPhase('complete');
            if (onComplete) {
              onComplete();
            }
          }, 2000);
          return 0;
        }
        
        // Play sound for next countdown number with increasing pitch
        const nextNumber = prev - 1;
        if (nextNumber === 2) {
          playSound('levelUp2'); // Medium pitch
        } else if (nextNumber === 1) {
          playSound('levelUp3'); // Higher pitch
        }
        
        return nextNumber;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[10001] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark overlay with pulsing effect */}
          <motion.div
            className="absolute inset-0 bg-black"
            animate={{
              opacity: phase === 'countdown' ? [0.7, 0.9, 0.7] : phase === 'launch' ? 0.95 : 0,
            }}
            transition={{
              duration: phase === 'countdown' ? 1 : 0.5,
              repeat: phase === 'countdown' ? Infinity : 0,
            }}
          />

          {/* Countdown Phase */}
          {phase === 'countdown' && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Countdown number with epic effects */}
              <motion.div
                key={countdown}
                className="relative"
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 0.8],
                  rotate: [180, 0, 0]
                }}
                exit={{ 
                  scale: [1, 0.8, 2],
                  opacity: [0.8, 1, 0],
                  rotate: [0, 0, 360]
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
              >
                {/* Glowing background */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: `radial-gradient(circle, ${
                      countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e'
                    } 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                  }}
                />

                {/* Main countdown number */}
                <motion.h1
                  className="text-[20rem] font-black text-white relative z-10"
                  animate={{
                    textShadow: [
                      `0 0 20px ${countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e'}`,
                      `0 0 40px ${countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e'}`,
                      `0 0 20px ${countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e'}`,
                    ],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: `linear-gradient(45deg, ${
                      countdown === 3 ? '#ef4444, #dc2626' : countdown === 2 ? '#f59e0b, #d97706' : '#22c55e, #16a34a'
                    })`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {countdown}
                </motion.h1>

                {/* Orbiting particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`orbit-${i}`}
                    className="absolute w-4 h-4 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e',
                      boxShadow: `0 0 10px ${countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e'}`,
                    }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * 200,
                      y: Math.sin((i / 8) * Math.PI * 2) * 200,
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))}

                {/* Expanding rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                    style={{
                      borderColor: countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#22c55e',
                      borderStyle: 'solid',
                    }}
                    animate={{
                      scale: [0, 2, 0],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>

              {/* Countdown label */}
              <motion.div
                className="absolute bottom-1/3 left-1/2 -translate-x-1/2"
                animate={{
                  opacity: [0.6, 1, 0.6],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <h2 className="text-4xl font-bold text-white tracking-widest">
                  LAUNCHING IN
                </h2>
              </motion.div>
            </div>
          )}

          {/* Launch Phase */}
          {phase === 'launch' && (
            <>
              {/* Blinding flash */}
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3 }}
              />

              {/* Shockwave rings */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`shockwave-${i}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-8"
                  style={{
                    borderColor: i % 2 === 0 ? '#60a5fa' : '#c084fc',
                    borderStyle: 'solid',
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ 
                    scale: [0, 6],
                    opacity: [1, 0],
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Particle explosion */}
              {[...Array(50)].map((_, i) => {
                const angle = (i / 50) * Math.PI * 2;
                const distance = 300 + Math.random() * 500;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                return (
                  <motion.div
                    key={`explosion-${i}`}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: ['#60a5fa', '#c084fc', '#fbbf24'][i % 3],
                      boxShadow: `0 0 10px ${['#60a5fa', '#c084fc', '#fbbf24'][i % 3]}`,
                    }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{
                      x: x,
                      y: y,
                      scale: [0, 2, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.01,
                      ease: "easeOut",
                    }}
                  />
                );
              })}

              {/* Launch text */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.2, 1, 1.5],
                  rotate: [0, 0, 0, 360]
                }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                <h1 className="text-8xl font-black text-white drop-shadow-2xl">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    LAUNCH!
                  </span>
                </h1>
              </motion.div>

              {/* Energy beams */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`beam-${i}`}
                  className="absolute left-1/2 top-1/2 w-2 origin-bottom"
                  style={{
                    height: '100vh',
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                    background: `linear-gradient(to top, ${
                      i % 3 === 0 ? '#60a5fa' : i % 3 === 1 ? '#c084fc' : '#fbbf24'
                    }, transparent)`,
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ 
                    scaleY: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{ 
                    duration: 1,
                    delay: i * 0.05,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EpicTransition;