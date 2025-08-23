import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';

const SearchBar = ({ searchTerm, onSearch, placeholder = "Search..." }) => {
  const { playSound } = useWarehouse();

  const handleClear = () => {
    onSearch('');
    playSound('click');
  };

  return (
    <motion.div 
      className="relative"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => playSound('focus')}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
        />
        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-gray-400 hover:text-white" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default SearchBar; 