import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';

const BinSelector = ({ onSelect, currentBin, availableBins }) => {
  const [search, setSearch] = useState('');
  const [filteredBins, setFilteredBins] = useState(availableBins || []);

  useEffect(() => {
    if (!availableBins) return;
    
    const filtered = availableBins.filter(bin =>
      bin.id.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredBins(filtered);
  }, [search, availableBins]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bins..."
          className="input-field w-full pl-10"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {filteredBins.map((bin) => {
          const isSelected = currentBin === bin.id;
          const utilization = bin.currentStock.reduce((sum, stock) => sum + stock.quantity, 0) / bin.capacity;
          
          return (
            <motion.button
              key={bin.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(bin)}
              className={`p-4 rounded-lg border transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{bin.id}</span>
                <MapPin size={16} className="text-gray-400" />
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-full rounded-full ${
                    utilization > 0.8 ? 'bg-red-500' : 
                    utilization > 0.5 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${utilization * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round(utilization * 100)}% full
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BinSelector;