import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '../hooks/useWarehouseContext';
import AnimatedBackground from '../components/AnimatedBackground';
import GameIcon from '../components/GameIcon';
import SearchBar from '../components/SearchBar';
import StockItemCard from '../components/StockItemCard';
import StockDetailPanel from '../components/StockDetailPanel';
import ParticleEffect from '../components/ParticleEffect';

const mockStockData = [
  { id: 'SKU-001', name: 'Standard Small Box', quantity: 187, location: 'Aisle 1, Bay 2', supplier: 'Global Packaging', lastUpdated: '2025-07-08T10:00:00Z', icon: 'box' },
  { id: 'SKU-002', name: 'Large Courier Bag', quantity: 4, location: 'Aisle 3, Bay 5', supplier: 'Speedy Satchels', lastUpdated: '2025-07-07T14:30:00Z', icon: 'satchel' },
  { id: 'SKU-003', name: 'Custom Pallet', quantity: 26, location: 'Bulk Area', supplier: 'Pallet Masters', lastUpdated: '2025-07-08T09:15:00Z', icon: 'pallet' },
  { id: 'SKU-004', name: 'Packing Tape', quantity: 0, location: 'Packing Station 1', supplier: 'Global Packaging', lastUpdated: '2025-07-06T11:00:00Z', icon: 'box' },
  { id: 'SKU-005', name: 'Bubble Wrap Roll', quantity: 15, location: 'Aisle 2, Bay 1', supplier: 'Protective Packaging', lastUpdated: '2025-07-08T08:30:00Z', icon: 'box' },
  { id: 'SKU-006', name: 'Extra Large Carton', quantity: 89, location: 'Aisle 1, Bay 4', supplier: 'Cardboard Solutions', lastUpdated: '2025-07-08T07:45:00Z', icon: 'carton' },
  { id: 'SKU-007', name: 'Shipping Labels', quantity: 2, location: 'Packing Station 2', supplier: 'Label World', lastUpdated: '2025-07-07T16:20:00Z', icon: 'box' },
  { id: 'SKU-008', name: 'Postal Bag Medium', quantity: 156, location: 'Aisle 2, Bay 3', supplier: 'Speedy Satchels', lastUpdated: '2025-07-08T11:15:00Z', icon: 'satchel' },
  { id: 'SKU-009', name: 'Fragile Stickers', quantity: 0, location: 'Packing Station 1', supplier: 'Label World', lastUpdated: '2025-07-06T13:00:00Z', icon: 'box' },
  { id: 'SKU-010', name: 'Wooden Crate', quantity: 8, location: 'Bulk Area', supplier: 'Timber Packaging', lastUpdated: '2025-07-07T10:30:00Z', icon: 'box' },
];

const InventoryDashboard = () => {
  const { user, addXP, playSound } = useWarehouse();
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockData, setStockData] = useState(mockStockData);

  // Filter stock data based on search term
  const filteredStockData = stockData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    playSound('click');
    addXP(3, 'Item Selected');
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    playSound('type');
  };

  // Get stock level for color coding
  const getStockLevel = (quantity) => {
    if (quantity === 0) return 'out';
    if (quantity <= 20) return 'low';
    return 'normal';
  };

  // Calculate summary stats
  const totalItems = stockData.length;
  const lowStockItems = stockData.filter(item => item.quantity > 0 && item.quantity <= 20).length;
  const outOfStockItems = stockData.filter(item => item.quantity === 0).length;
  const inStockItems = stockData.filter(item => item.quantity > 20).length;

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      <ParticleEffect />
      
      {/* Header */}
      <motion.div 
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GameIcon
                iconType="database"
                size={56}
                tier="legendary"
                quantity={totalItems}
                animated={true}
              />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Inventory Dashboard
              </h1>
              <p className="text-gray-400 mt-2">Manage and monitor your warehouse stock levels</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6">
            <motion.div 
              className="text-center group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => playSound('hover')}
              onClick={() => {
                playSound('click');
                addXP(5, 'Stats Review');
              }}
            >
              <div className="relative">
                <GameIcon
                  iconType="package"
                  size={32}
                  tier="common"
                  quantity={inStockItems}
                  animated={true}
                />
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {inStockItems}
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium mt-1">In Stock</div>
            </motion.div>
            <motion.div 
              className="text-center group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => playSound('hover')}
              onClick={() => {
                playSound('click');
                addXP(5, 'Stats Review');
              }}
            >
              <div className="relative">
                <GameIcon
                  iconType="package"
                  size={32}
                  tier="rare"
                  quantity={lowStockItems}
                  animated={true}
                />
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {lowStockItems}
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium mt-1">Low Stock</div>
            </motion.div>
            <motion.div 
              className="text-center group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => playSound('hover')}
              onClick={() => {
                playSound('click');
                addXP(5, 'Stats Review');
              }}
            >
              <div className="relative">
                <GameIcon
                  iconType="package"
                  size={32}
                  tier="epic"
                  quantity={outOfStockItems}
                  animated={true}
                />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {outOfStockItems}
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium mt-1">Out of Stock</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6">
        {/* Left Column - Stock Items List */}
        <motion.div 
          className="w-[35%] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar 
              searchTerm={searchTerm} 
              onSearch={handleSearch}
              placeholder="Search items or SKUs..."
            />
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {filteredStockData.map((item) => (
                <StockItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={() => handleItemSelect(item)}
                  stockLevel={getStockLevel(item.quantity)}
                />
              ))}
            </motion.div>
            
            {filteredStockData.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <GameIcon
                  iconType="package"
                  size={64}
                  tier="common"
                  quantity={0}
                  animated={true}
                />
                <p className="text-gray-400 mt-4">No items found matching your search</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right Column - Stock Detail Panel */}
        <motion.div 
          className="w-[65%] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <StockDetailPanel 
            selectedItem={selectedItem}
            onQuantityAdjust={(item, newQuantity) => {
              setStockData(prev => 
                prev.map(stock => 
                  stock.id === item.id 
                    ? { ...stock, quantity: newQuantity, lastUpdated: new Date().toISOString() }
                    : stock
                )
              );
              playSound('success');
              addXP(10, 'Quantity Adjusted');
            }}
            onViewHistory={(item) => {
              playSound('click');
              addXP(5, 'View History');
              // Handle view history logic
            }}
            onRequestRestock={(item) => {
              playSound('click');
              addXP(15, 'Restock Request');
              // Handle restock request logic
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryDashboard; 