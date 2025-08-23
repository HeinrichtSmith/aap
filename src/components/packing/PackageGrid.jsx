import React from 'react';
import { motion } from 'framer-motion';
import PackageCard from './PackageCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: 20,
    rotateX: -15
  },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -20,
    rotateX: 15,
    transition: {
      duration: 0.2
    }
  }
};

const PackageGrid = ({ 
  options, 
  shipment, 
  onAdd, 
  onRemove, 
  onUpdateQuantity, 
  recommendedId,
  isSatchel = false,
  selectedPackageId = null
}) => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {options.map((option) => (
        <motion.div
          key={option.id}
          variants={itemVariants}
        >
          <PackageCard
            option={option}
            quantity={shipment[option.id] || 0}
            onAdd={() => onAdd(option.id)}
            onRemove={() => onRemove(option.id)}
            onUpdateQuantity={(quantity, playSound) => onUpdateQuantity(option.id, quantity, playSound)}
            isRecommended={option.id === recommendedId}
            isSatchel={isSatchel}
            isSelected={option.id === selectedPackageId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PackageGrid; 