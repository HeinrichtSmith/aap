import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playSound } from '../utils/audio';

const BackButton = ({ 
  onClick, 
  text = "Back to Dashboard", 
  className = "",
  ...props 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    playSound('transition'); // Transition sound effect
    if (onClick) {
      onClick();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onMouseEnter={() => playSound('hover')}
      className={`flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-lg ${className}`}
      {...props}
    >
      <ArrowLeft size={24} />
      {text && <span>{text}</span>}
    </motion.button>
  );
};

export default BackButton; 