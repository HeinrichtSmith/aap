import React from 'react';
import { motion } from 'framer-motion';

const ActivityIcon = ({ 
  size = 32, 
  tier = 'normal', 
  quantity = 1, 
  className = '', 
  isAnimated = false 
}) => {
  const tierColors = {
    cosmic: {
      primary: '#FF6B9D',
      secondary: '#4ECDC4', 
      accent: '#FFE66D',
      glow: '#FF6B9D'
    },
    mega: {
      primary: '#FF9500',
      secondary: '#FFD700',
      accent: '#FF6B35',
      glow: '#FF9500'
    },
    super: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#C4B5FD',
      glow: '#8B5CF6'
    },
    standard: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#93C5FD',
      glow: '#3B82F6'
    },
    normal: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      accent: '#D1D5DB',
      glow: '#6B7280'
    }
  };

  const colors = tierColors[tier];
  const isHighTier = ['cosmic', 'mega', 'super'].includes(tier);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={isAnimated ? { scale: 0, rotate: -45 } : {}}
      animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Glow effect for higher tiers */}
      {isHighTier && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-sm opacity-60"
          style={{
            background: `radial-gradient(circle, ${colors.glow}40, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="relative z-10"
      >
        {/* Chart background */}
        <motion.rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="6"
          fill={colors.secondary}
          fillOpacity="0.1"
          stroke={colors.primary}
          strokeWidth="1.5"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Grid lines */}
        <motion.g
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.line
              key={`h-${i}`}
              x1="12"
              y1={16 + i * 10}
              x2="52"
              y2={16 + i * 10}
              stroke={colors.accent}
              strokeWidth="0.5"
              strokeDasharray="2 2"
              initial={isAnimated ? { pathLength: 0 } : {}}
              animate={isAnimated ? { pathLength: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.line
              key={`v-${i}`}
              x1={16 + i * 8}
              y1="12"
              x2={16 + i * 8}
              y2="52"
              stroke={colors.accent}
              strokeWidth="0.5"
              strokeDasharray="2 2"
              initial={isAnimated ? { pathLength: 0 } : {}}
              animate={isAnimated ? { pathLength: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
            />
          ))}
        </motion.g>

        {/* Activity bars */}
        <motion.g
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          {[
            { x: 16, height: 20, delay: 0 },
            { x: 24, height: 32, delay: 0.1 },
            { x: 32, height: 16, delay: 0.2 },
            { x: 40, height: 28, delay: 0.3 },
            { x: 48, height: 24, delay: 0.4 }
          ].map((bar, i) => (
            <motion.rect
              key={i}
              x={bar.x - 2}
              y={52 - bar.height}
              width="4"
              height={bar.height}
              rx="2"
              fill={colors.primary}
              initial={isAnimated ? { scaleY: 0 } : {}}
              animate={isAnimated ? { scaleY: 1 } : {}}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                delay: 1.0 + bar.delay 
              }}
            />
          ))}
        </motion.g>

        {/* Activity line chart */}
        <motion.path
          d="M 16 36 Q 20 32 24 28 Q 28 38 32 40 Q 36 30 40 32 Q 44 28 48 34"
          fill="none"
          stroke={colors.glow}
          strokeWidth="2"
          strokeLinecap="round"
          initial={isAnimated ? { pathLength: 0 } : {}}
          animate={isAnimated ? { pathLength: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
        />

        {/* Data points */}
        <motion.g
          initial={isAnimated ? { opacity: 0 } : {}}
          animate={isAnimated ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.8 }}
        >
          {[
            { x: 16, y: 36 },
            { x: 24, y: 28 },
            { x: 32, y: 40 },
            { x: 40, y: 32 },
            { x: 48, y: 34 }
          ].map((point, i) => (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={colors.glow}
              stroke={colors.primary}
              strokeWidth="1"
              initial={isAnimated ? { scale: 0 } : {}}
              animate={isAnimated ? { scale: 1 } : {}}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                delay: 2.0 + i * 0.1 
              }}
            />
          ))}
        </motion.g>

        {/* Pulse indicator */}
        <motion.circle
          cx="48"
          cy="16"
          r="3"
          fill={colors.glow}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Activity count indicator */}
        {quantity > 1 && (
          <motion.g
            initial={isAnimated ? { scale: 0, rotate: -90 } : {}}
            animate={isAnimated ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: "spring", stiffness: 200, delay: 2.2 }}
          >
            <motion.circle
              cx="52"
              cy="12"
              r="6"
              fill={colors.glow}
              stroke={colors.primary}
              strokeWidth="2"
              animate={isHighTier ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.text
              x="52"
              y="14"
              fontSize="6"
              fill="white"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {quantity > 99 ? '99+' : quantity}
            </motion.text>
          </motion.g>
        )}

        {/* Cosmic tier special effects */}
        {tier === 'cosmic' && (
          <motion.g
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.circle
                key={i}
                cx={32 + Math.cos(i * Math.PI / 3) * 24}
                cy={32 + Math.sin(i * Math.PI / 3) * 24}
                r="1"
                fill={i % 2 === 0 ? colors.accent : colors.glow}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.5, 0.8]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Mega tier lightning bolt */}
        {tier === 'mega' && (
          <motion.path
            d="M 28 8 L 32 20 L 30 20 L 36 28 L 32 16 L 34 16 L 28 8 Z"
            fill={colors.glow}
            stroke={colors.primary}
            strokeWidth="1"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Super tier wave effect */}
        {tier === 'super' && (
          <motion.g>
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx="32"
                cy="32"
                r={12 + i * 8}
                fill="none"
                stroke={colors.glow}
                strokeWidth="1"
                opacity="0.3"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Real-time activity indicator */}
        <motion.g
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.circle
            cx="12"
            cy="12"
            r="2"
            fill={colors.glow}
          />
          <motion.text
            x="16"
            y="10"
            fontSize="4"
            fill={colors.primary}
            fontWeight="bold"
          >
            LIVE
          </motion.text>
        </motion.g>
      </svg>
    </motion.div>
  );
};

export default ActivityIcon; 