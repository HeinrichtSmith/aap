import React, { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const OptimizedAreaChart = memo(({ data, title, color = "#3b82f6", gradientId = "orderGradient" }) => {
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { time: '8AM', orders: 4 },
        { time: '10AM', orders: 12 },
        { time: '12PM', orders: 8 },
        { time: '2PM', orders: 15 },
        { time: '4PM', orders: 6 }
      ];
    }
    return data;
  }, [data]);

  // Memoize gradient definition
  const gradientDef = useMemo(() => (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
        <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  ), [color, gradientId]);

  // Memoize tooltip styles
  const tooltipStyle = useMemo(() => ({
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }), []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
    >
      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {gradientDef}
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stroke={color}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              filter="url(#glow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

OptimizedAreaChart.displayName = 'OptimizedAreaChart';

export default OptimizedAreaChart;