import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '../AnimatedCounter';
import GameIcon from '../GameIcon';

const OptimizedPerformanceChart = memo(({ 
  stats, 
  selectedMetric, 
  onMetricChange 
}) => {
  // Memoize calculated values
  const circleValues = useMemo(() => {
    const pickedProgress = Math.min(stats.totalItemsPicked, 100) / 100;
    const packedProgress = Math.min(stats.totalItemsPacked, 100) / 100;
    
    return {
      pickedProgress,
      packedProgress,
      pickedDashOffset: 534 - (534 * pickedProgress),
      packedDashOffset: 471 - (471 * packedProgress)
    };
  }, [stats.totalItemsPicked, stats.totalItemsPacked]);

  // Memoize display value
  const displayValue = useMemo(() => {
    switch (selectedMetric) {
      case 'picked': return stats.totalItemsPicked;
      case 'packed': return stats.totalItemsPacked;
      default: return stats.totalItemsPicked + stats.totalItemsPacked;
    }
  }, [selectedMetric, stats.totalItemsPicked, stats.totalItemsPacked]);

  // Memoize display label
  const displayLabel = useMemo(() => {
    switch (selectedMetric) {
      case 'picked': return 'Items Picked';
      case 'packed': return 'Items Packed';
      default: return 'Total Items';
    }
  }, [selectedMetric]);

  // Memoized event handlers
  const handlePickedClick = useCallback(() => {
    onMetricChange(selectedMetric === 'picked' ? 'total' : 'picked');
  }, [selectedMetric, onMetricChange]);

  const handlePackedClick = useCallback(() => {
    onMetricChange(selectedMetric === 'packed' ? 'total' : 'packed');
  }, [selectedMetric, onMetricChange]);

  // Memoize legend data
  const legendData = useMemo(() => [
    {
      key: 'picked',
      color: '#3b82f6',
      label: `Items Picked (${stats.totalItemsPicked})`,
      isActive: selectedMetric === 'picked',
      onClick: handlePickedClick
    },
    {
      key: 'packed',
      color: '#f59e0b',
      label: `Items Packed (${stats.totalItemsPacked})`,
      isActive: selectedMetric === 'packed',
      onClick: handlePackedClick
    }
  ], [stats.totalItemsPicked, stats.totalItemsPacked, selectedMetric, handlePickedClick, handlePackedClick]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
    >
      <div className="flex items-center space-x-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.1, rotateY: 15 }}
          transition={{ type: "spring", stiffness: 600, damping: 20 }}
        >
          <GameIcon
            iconType="trophy"
            actualQuantity={Math.floor(stats.teamPerformance / 10)}
            size={48}
            iconSize="medium"
          />
        </motion.div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Dispatch Performance
        </h3>
      </div>
      
      <div className="h-64 flex items-center justify-center">
        <div className="relative">
          {/* Outer circle for Items Picked */}
          <motion.div
            className="relative w-48 h-48"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          >
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(75, 85, 99, 0.2)"
                strokeWidth="12"
              />
              {/* Items Picked circle (blue) */}
              <motion.circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#3b82f6"
                strokeWidth={selectedMetric === 'picked' ? 16 : 12}
                strokeLinecap="round"
                strokeDasharray={534}
                initial={{ strokeDashoffset: 534 }}
                animate={{ strokeDashoffset: circleValues.pickedDashOffset }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                style={{
                  filter: selectedMetric === 'picked' 
                    ? 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.8))' 
                    : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                  cursor: 'pointer'
                }}
              />
            </svg>
            
            {/* Clickable overlay for outer circle */}
            <motion.div
              className="absolute inset-0 cursor-pointer rounded-full"
              style={{ 
                background: selectedMetric === 'picked' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                border: '24px solid transparent'
              }}
              whileHover={{ scale: 1.02, background: 'rgba(59, 130, 246, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePickedClick}
            />

            {/* Inner circle for Items Packed */}
            <svg className="absolute inset-4 w-40 h-40 transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="rgba(75, 85, 99, 0.2)"
                strokeWidth="10"
              />
              {/* Items Packed circle (orange) */}
              <motion.circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#f59e0b"
                strokeWidth={selectedMetric === 'packed' ? 14 : 10}
                strokeLinecap="round"
                strokeDasharray={471}
                initial={{ strokeDashoffset: 471 }}
                animate={{ strokeDashoffset: circleValues.packedDashOffset }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.7 }}
                style={{
                  filter: selectedMetric === 'packed' 
                    ? 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.8))' 
                    : 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))',
                  cursor: 'pointer'
                }}
              />
            </svg>
            
            {/* Clickable overlay for inner circle */}
            <motion.div
              className="absolute inset-8 cursor-pointer rounded-full"
              style={{ 
                background: selectedMetric === 'packed' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                border: '20px solid transparent'
              }}
              whileHover={{ scale: 1.05, background: 'rgba(245, 158, 11, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePackedClick}
            />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <motion.div 
                  className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  key={selectedMetric}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnimatedCounter target={displayValue} duration={1000} />
                </motion.div>
                <motion.div 
                  className="text-sm text-gray-400 font-medium"
                  key={`${selectedMetric}-label`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {displayLabel}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Hint text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-4 text-center"
          >
            <span className="text-xs text-gray-500 italic">
              💡 Click the blue/orange circles or legend items to view specific metrics
            </span>
          </motion.div>

          {/* Legend */}
          <div className="mt-4 flex justify-center space-x-8">
            {legendData.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.2 }}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-white/5"
                onClick={item.onClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.color,
                    filter: item.isActive 
                      ? `drop-shadow(0 0 8px ${item.color}80)` 
                      : `drop-shadow(0 0 4px ${item.color}80)` 
                  }}
                  whileHover={{ 
                    scale: 1.3,
                    filter: `drop-shadow(0 0 8px ${item.color}CC)`
                  }}
                />
                <span className={`text-sm font-medium transition-colors ${
                  item.isActive ? (item.key === 'picked' ? 'text-blue-400' : 'text-orange-400') : 'text-gray-300'
                }`}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

OptimizedPerformanceChart.displayName = 'OptimizedPerformanceChart';

export default OptimizedPerformanceChart;