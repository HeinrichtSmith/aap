import React, { useState } from 'react';
import { Plus, Minus, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from '../../utils/audio';
import { useTierSystem, MAX_QUANTITY } from '../../hooks/useTierSystem';

const PackageQuantityControls = ({ 
  quantity, 
  onAdd, 
  onRemove, 
  onUpdateQuantity,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const tierInfo = useTierSystem(quantity);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue('');
    playSound('click');
  };

  const handleBlur = () => {
    setIsEditing(false);
    setEditValue('');
    playSound('success');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
      if (e.key === 'Enter') {
        playSound('success');
      }
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-1 z-20 ${className}`} onClick={(e) => e.stopPropagation()}>
      <motion.button
        whileHover={{ scale: quantity >= MAX_QUANTITY ? 1 : 1.1 }}
        whileTap={{ scale: quantity >= MAX_QUANTITY ? 1 : 0.9 }}
        onClick={onAdd}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          quantity >= MAX_QUANTITY
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
        }`}
        disabled={quantity >= MAX_QUANTITY}
      >
        <Plus size={16} />
      </motion.button>

      {isEditing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= MAX_QUANTITY)) {
              setEditValue(val);
              const newQuantity = parseInt(val) || 0;
              onUpdateQuantity(newQuantity, false);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-12 px-1 py-1.5 rounded-lg font-semibold text-center bg-transparent border-2 outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            (() => {
              if (quantity >= 250) return 'border-cyan-500 text-cyan-400';
              if (quantity >= 125) return 'border-pink-500 text-pink-400';
              if (quantity >= 25) return 'border-orange-500 text-orange-400';
              if (quantity >= 5) return 'border-blue-600 text-blue-400';
              return 'border-blue-500 text-blue-300';
            })()
          }`}
          placeholder={quantity.toString()}
          autoFocus
          min="0"
          max={MAX_QUANTITY}
        />
      ) : (
        <div 
          onClick={handleEdit}
          className={`px-3 py-1.5 rounded-lg font-semibold text-lg transition-all duration-150 border cursor-text hover:brightness-110 relative group ${
            (() => {
              if (quantity >= MAX_QUANTITY) {
                return 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border-cyan-500/50';
              } else if (tierInfo) {
                return `bg-gradient-to-r ${
                  quantity >= 250 ? 'from-purple-600/20 via-pink-600/20 to-cyan-600/20 border-cyan-500/50' :
                  quantity >= 125 ? 'from-purple-600/20 via-pink-600/20 to-red-600/20 border-pink-500/50' :
                  quantity >= 25 ? 'from-yellow-500/20 to-orange-500/20 border-orange-500/50' :
                  quantity >= 5 ? 'from-blue-500/20 to-blue-700/20 border-blue-600/50' :
                  'bg-blue-500/20 border-blue-500/50'
                }`;
              }
              return 'bg-white/5 border-white/10';
            })()
          }`}
          title="Click to edit quantity"
        >
          <motion.span 
            key={quantity}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`inline-block ${
              (() => {
                if (quantity >= 250) return 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text animate-pulse';
                if (quantity >= 125) return 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text animate-pulse';
                if (quantity >= 25) return 'text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text';
                if (quantity >= 5) return 'text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text';
                if (quantity > 0) return 'text-blue-300';
                return 'text-gray-500';
              })()
            }`}
          >
            {quantity}
          </motion.span>
          <Edit2 
            size={10} 
            className="absolute -top-0.5 -right-0.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          quantity === 0 
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-0 pointer-events-none' 
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
        }`}
        disabled={quantity === 0}
      >
        <Minus size={16} />
      </motion.button>

      {quantity >= MAX_QUANTITY && (
        <motion.span 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-cyan-400 mt-1"
        >
          MAX
        </motion.span>
      )}
    </div>
  );
};

export default PackageQuantityControls; 