import React, { useState, useRef } from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from '../../utils/audio';

const PickingQuantityControls = ({ 
  currentQuantity, 
  targetQuantity, 
  onAdd, 
  onRemove,
  className = '',
  isDisabled = false
}) => {
  const canAdd = currentQuantity < targetQuantity && !isDisabled;
  const canRemove = currentQuantity > 0 && !isDisabled;
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const removeTimeout = useRef(null);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (canAdd) {
      onAdd();
      playSound('success');
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (canRemove) {
      // First click shows warning, second click confirms
      if (!showRemoveWarning) {
        setShowRemoveWarning(true);
        playSound('error');
        
        // Auto-hide warning after 2 seconds
        if (removeTimeout.current) clearTimeout(removeTimeout.current);
        removeTimeout.current = setTimeout(() => {
          setShowRemoveWarning(false);
        }, 2000);
      } else {
        // Confirmed - perform the removal
        onRemove();
        playSound('click');
        setShowRemoveWarning(false);
        if (removeTimeout.current) clearTimeout(removeTimeout.current);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-1 z-20 ${className}`} onClick={(e) => e.stopPropagation()}>
      <motion.button
        whileHover={{ scale: canAdd ? 1.05 : 1 }}
        whileTap={{ scale: canAdd ? 0.95 : 1 }}
        onClick={handleAdd}
        className={`min-w-[56px] min-h-[56px] flex items-center justify-center rounded-xl transition-all duration-150 ${
          canAdd
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 border-2 border-blue-500/50'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50'
        }`}
        disabled={!canAdd}
      >
        <Plus size={28} />
      </motion.button>

      <div className="min-w-[56px] min-h-[56px] flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 my-2 px-3">
        <span className="text-xl font-semibold text-white">
          {currentQuantity}/{targetQuantity}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: canRemove ? 1.05 : 1 }}
        whileTap={{ scale: canRemove ? 0.95 : 1 }}
        onClick={handleRemove}
        className={`min-w-[56px] min-h-[56px] flex items-center justify-center rounded-xl transition-all duration-150 relative ${
          canRemove
            ? showRemoveWarning 
              ? 'bg-orange-500/30 text-orange-400 hover:bg-orange-500/40 border-2 border-orange-500/70 animate-pulse'
              : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-500/50'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-0 pointer-events-none'
        }`}
        disabled={!canRemove}
      >
        {showRemoveWarning ? (
          <>
            <AlertCircle size={28} />
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs bg-orange-500 text-white px-2 py-1 rounded whitespace-nowrap z-30">
              Click again to confirm
            </span>
          </>
        ) : (
          <Minus size={28} />
        )}
      </motion.button>
    </div>
  );
};

export default PickingQuantityControls;