// src/components/AnimatedCharts.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import { TrendingUp, Activity, Zap, Award } from 'lucide-react';

// Custom animated tooltip
const CustomTooltip = ({ active, payload, label, color = '#3b82f6' }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-xl border border-gray-700 shadow-2xl"
    >
      <p className="text-white font-semibold text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {payload[0].value}
      </p>
      <motion.div
        className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, ${color}, ${color}dd)` }}
        />
      </motion.div>
    </motion.div>
  );
};

// Animated bar with hover effect
const AnimatedBar = (props) => {
  const [isHovered, setIsHovered] = useState(false);
  const { fill, x, y, width, height, value } = props;
  
  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        initial={{ height: 0, y: y + height }}
        animate={{ 
          height: height, 
          y: y,
          scale: isHovered ? 1.02 : 1,
          filter: isHovered ? 'brightness(1.2)' : 'brightness(1)'
        }}
        transition={{ 
          height: { duration: 0.8, ease: "easeOut" },
          scale: { duration: 0.2 }
        }}
        style={{
          transformOrigin: `${x + width/2}px ${y + height}px`,
          cursor: 'pointer'
        }}
      />
      {isHovered && value && (
        <motion.text
          x={x + width / 2}
          y={y - 10}
          textAnchor="middle"
          fill="#fff"
          fontSize="14"
          fontWeight="bold"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {value}
        </motion.text>
      )}
    </g>
  );
};

// Glowing dot for line charts
const GlowingDot = (props) => {
  const { cx, cy, payload } = props;
  const [isActive, setIsActive] = useState(false);

  return (
    <g onMouseEnter={() => setIsActive(true)} onMouseLeave={() => setIsActive(false)}>
      <motion.circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#3b82f6"
        animate={{
          r: isActive ? 10 : 6,
          opacity: isActive ? 1 : 0.8
        }}
        style={{ cursor: 'pointer' }}
      />
      {isActive && (
        <>
          <motion.circle
            cx={cx}
            cy={cy}
            r="6"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            initial={{ r: 6, opacity: 1 }}
            animate={{ r: 20, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.text
            x={cx}
            y={cy - 20}
            textAnchor="middle"
            fill="#fff"
            fontSize="14"
            fontWeight="bold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {payload.value}
          </motion.text>
        </>
      )}
    </g>
  );
};

// Orders chart with wave animation
export const AnimatedOrdersChart = ({ data }) => {
  const [selectedBar, setSelectedBar] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimationComplete(true), 1000);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-gray-800 relative"
      style={{ overflow: 'visible' }}
    >
      {/* Animated background gradient with proper clipping */}
      <motion.div
        className="absolute inset-0 opacity-10 rounded-xl"
        style={{ overflow: 'hidden' }}
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, #3b82f6 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, #3b82f6 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, #3b82f6 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, #3b82f6 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, #3b82f6 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white relative z-10">
        <motion.div
          animate={{ rotate: animationComplete ? 360 : 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <Activity className="mr-2" size={20} />
        </motion.div>
        Orders Processed Today
      </h3>
      
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} onClick={(e) => setSelectedBar(e?.activeLabel)}>
            <defs>
              <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" strokeOpacity={0.3} />
            <XAxis 
              dataKey="hour" 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip color="#3b82f6" />} />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#orderGradient)"
              filter="url(#glow)"
              dot={<GlowingDot />}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {selectedBar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-lg p-3 rounded-lg border border-gray-700"
        >
          <p className="text-xs text-gray-400">Selected Time</p>
          <p className="text-lg font-bold text-white">{selectedBar}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// XP chart with particle effects
export const AnimatedXPChart = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-gray-800 relative h-full"
      style={{ overflow: 'visible' }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white relative z-10">
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Zap className="mr-2 text-yellow-400" size={20} />
        </motion.div>
        Your Weekly XP Gain
      </h3>
      
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={(e) => setHoveredBar(e?.activeLabel)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" strokeOpacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip color="#8b5cf6" />} />
            <Bar 
              dataKey="xp" 
              radius={[8, 8, 0, 0]}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Particle effects on hover */}
      <AnimatePresence>
        {hoveredBar && (
          <motion.div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0]
                }}
                exit={{ scale: 0 }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Circular performance chart with liquid fill effect
export const AnimatedPerformanceChart = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-900/50 backdrop-blur-xl p-6 rounded-xl border border-gray-800"
      style={{ overflow: 'visible' }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Award className="mr-2 text-yellow-400" size={20} />
        Your Performance
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ overflow: 'visible' }}>
        {data.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index, type: "spring" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-center cursor-pointer"
            onClick={() => setSelectedMetric(metric)}
          >
            <div className="relative w-24 h-24 mx-auto">
              {/* Background circle */}
              <svg className="w-24 h-24 transform -rotate-90">
                <defs>
                  <filter id={`glow-${index}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/10"
                />
                {/* Animated progress circle */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 36 * (1 - metric.value / 100),
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 * index }}
                  className="text-blue-500"
                  filter={`url(#glow-${index})`}
                />
              </svg>
              
              {/* Center value with pulse effect */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl font-bold text-white">{metric.value}%</span>
              </motion.div>
            </div>
            <p className="text-sm text-gray-400 mt-2">{metric.name}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Selected metric detail */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-gray-800/50 rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">{selectedMetric.name}</h4>
                <p className="text-sm text-gray-400">Current Performance</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-500">{selectedMetric.value}%</p>
                <p className="text-xs text-gray-500">
                  {selectedMetric.value >= 90 ? 'Excellent' : 
                   selectedMetric.value >= 70 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
            <motion.div
              className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedMetric.value}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Mini sparkline chart for stats cards
export const SparklineChart = ({ data, color = '#3b82f6' }) => {
  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  AnimatedOrdersChart,
  AnimatedXPChart,
  AnimatedPerformanceChart,
  SparklineChart
};