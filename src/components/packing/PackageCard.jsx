import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useTierSystem, MAX_QUANTITY } from '../../hooks/useTierSystem';
import GameIcon from '../GameIcon';
import PackageQuantityControls from './PackageQuantityControls';
import TierBadge from './TierBadge';

const getTierGradient = (option) => {
  if (option.iconType === 'box') {
    switch(option.id) {
      case 'box-s': return 'from-gray-400 to-gray-500';
      case 'box-m': return 'from-blue-400 to-blue-500';
      case 'box-l': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  } else {
    switch(option.id) {
      case 'nzc-a4': return 'from-gray-400 to-gray-500';
      case 'nzc-a3': return 'from-red-400 to-red-500';
      case 'nzc-a2': return 'from-red-500 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  }
};

const PackageCard = ({ 
  option, 
  quantity = 0, 
  onAdd, 
  onRemove, 
  onUpdateQuantity, 
  isRecommended = false,
  isSatchel = false,
  isSelected = false
}) => {
  const tierInfo = useTierSystem(quantity);

  return (
    <motion.div
      onClick={() => {
        // Always allow clicking to select/add, regardless of current quantity
        onAdd();
      }}
      onMouseEnter={() => {
        playSound('hover');
      }}
      whileHover={quantity < MAX_QUANTITY ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      whileTap={quantity < MAX_QUANTITY ? { scale: 0.98 } : {}}
      animate={isRecommended ? { 
        scale: [1, 1.02, 1],
        filter: [
          "drop-shadow(0 0 0px rgba(59, 130, 246, 0.5))",
          "drop-shadow(0 0 25px rgba(59, 130, 246, 0.8))",
          "drop-shadow(0 0 0px rgba(59, 130, 246, 0.5))"
        ]
      } : {}}
      transition={isRecommended ? { 
        type: "tween", 
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      } : {}}
      className={`relative p-6 rounded-2xl border transition-all duration-150 ${
        quantity < MAX_QUANTITY ? 'cursor-pointer group' : 'cursor-not-allowed'
      } ${
        (() => {
          if (quantity >= MAX_QUANTITY) {
            return 'bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-cyan-900/40 border-cyan-500/80 shadow-xl shadow-cyan-500/40 animate-pulse';
          } else if (tierInfo) {
            return `bg-gradient-to-br ${tierInfo.gradient || 'bg-blue-900/20'} ${tierInfo.borderColor} shadow-xl ${tierInfo.shadow} ${tierInfo.hoverShadow} ${tierInfo.hoverBorder}`;
          } else if (isSelected) {
            return 'bg-white/[0.08] backdrop-blur-xl border-yellow-500/60 hover:border-yellow-500/80 hover:bg-white/[0.12] shadow-lg shadow-yellow-500/25';
          } else if (isRecommended) {
            return 'bg-white/[0.03] backdrop-blur-xl border-blue-500/30 hover:border-blue-500/50 hover:bg-white/[0.05]';
          } else {
            return 'bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-gray-600/50 hover:bg-white/[0.05]';
          }
        })()
      }`}
    >
      {isRecommended && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-500/50 flex items-center space-x-1 z-30 pointer-events-none"
        >
          <Sparkles size={14} />
          <span>AI Pick</span>
        </motion.div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div 
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg shadow-yellow-500/50 flex items-center space-x-1 z-30 pointer-events-none"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⚡
          </motion.div>
          <span>Selected</span>
        </motion.div>
      )}

      {/* Quantity Badge */}
      {quantity > 0 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute top-3 left-3 rounded-full w-10 h-10 flex items-center justify-center shadow-lg pointer-events-none z-20 bg-gradient-to-r ${
            tierInfo?.badgeGradient || 'from-gray-600 to-gray-700'
          } ${tierInfo?.badgeShadow || ''} ${
            tierInfo?.animate ? 'animate-pulse' : ''
          }`}
        >
          <span className="text-white font-bold text-lg">{quantity}</span>
        </motion.div>
      )}

      {/* Tier Badge */}
      <TierBadge quantity={quantity} />
      
      <div className="relative text-center z-10">
        {/* Game Icon */}
        <div className={`flex justify-center mb-4 ${
          quantity >= 5 ? 'filter drop-shadow-lg' : ''
        }`}>
          <GameIcon 
            iconType={option.iconType} 
            iconCount={option.iconCount}
            actualQuantity={quantity > 0 ? quantity : undefined}
            iconSize={option.iconSize}
          />
        </div>
        
        <h3 className={`font-bold text-2xl mb-2 ${isSatchel ? 'text-yellow-400' : 'text-white'}`}>
          {option.name}
        </h3>
        <p className={`font-medium mb-2 ${isSatchel ? 'text-yellow-300' : 'text-gray-400'}`}>
          {option.dimensions}
        </p>
        
        {/* Size/Type indicator */}
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3].map((tier) => (
            <motion.div
              key={tier}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: tier * 0.1 }}
              className={`w-8 h-1 rounded-full transition-all duration-300 ${
                tier <= option.iconCount
                  ? `bg-gradient-to-r ${getTierGradient(option)} shadow-sm`
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {option.courier && (
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10">
            <Truck className={`mr-1 ${isSatchel ? 'text-yellow-400' : ''}`} size={12} />
            <span className={isSatchel ? 'text-yellow-400' : option.courier === 'NZ Couriers' ? 'text-blue-400' : 'text-orange-400'}>
              {option.courier}
            </span>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <PackageQuantityControls
        quantity={quantity}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdateQuantity={onUpdateQuantity}
        className="absolute bottom-4 right-4"
      />
    </motion.div>
  );
};

export default PackageCard; 