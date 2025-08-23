import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Package, 
  MapPin,
  DollarSign,
  Weight,
  Ruler,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  ShoppingCart,
  FileText,
  Calendar,
  BarChart3,
  Layers,
  Target,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Grid,
  AlignJustify,
  Zap,
  MousePointer
} from 'lucide-react';

import { useWarehouse } from '../hooks/useWarehouseContext';
import BackButton from '../components/BackButton';
import ParticleEffect from '../components/ParticleEffect';

// Mock data and hooks
const useSearchParams = () => {
  const [params] = useState(new URLSearchParams(window.location.search));
  return [params];
};

const Products = () => {
  const [searchParams] = useSearchParams();
  const { user, addXP, playSound } = useWarehouse();
  
  // Core state
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('sku') || '');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [hoveredBin, setHoveredBin] = useState(null);
  
  // View and layout state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    category: 'all',
    supplier: 'all',
    stockStatus: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Product intelligence data
  const [productAnalytics, setProductAnalytics] = useState({});
  const [recentActivity, setRecentActivity] = useState({});
  
  useEffect(() => {
    loadData();
    generateMockAnalytics();
  }, []);

  useEffect(() => {
    // Auto-select product if SKU provided in URL
    if (searchParams.get('sku') && products.length > 0) {
      const product = products.find(p => p.sku === searchParams.get('sku'));
      if (product) {
        handleProductSelect(product);
      }
    }
  }, [searchParams, products]);

  const loadData = () => {
    // Generate comprehensive mock product data
    const mockProducts = Array.from({ length: 50 }, (_, i) => {
      const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Tools'];
      const suppliers = ['Acme Corp', 'Global Supplies', 'Tech Solutions', 'Premium Goods', 'Value Plus'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      
      return {
        id: `prod-${i + 1}`,
        sku: `SKU-${String(i + 1).padStart(4, '0')}`,
        name: `Product ${i + 1} - ${category} Item`,
        description: `High-quality ${category.toLowerCase()} product with excellent features and reliable performance. Perfect for both personal and professional use.`,
        category,
        supplier,
        price: Math.floor(Math.random() * 50000) / 100 + 9.99,
        cost: Math.floor(Math.random() * 30000) / 100 + 5.99,
        barcode: `${Math.floor(Math.random() * 100000000000000)}`,
        weight: Math.floor(Math.random() * 500) / 100 + 0.1,
        dimensions: {
          length: Math.floor(Math.random() * 50) + 10,
          width: Math.floor(Math.random() * 30) + 5,
          height: Math.floor(Math.random() * 20) + 2
        },
        reorderPoint: Math.floor(Math.random() * 50) + 10,
        maxStock: Math.floor(Math.random() * 500) + 100,
        image: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=400&fit=crop`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    // Generate mock bin data with stock
    const zones = ['A', 'B', 'C', 'D', 'E'];
    const mockBins = [];
    
    zones.forEach(zone => {
      for (let aisle = 1; aisle <= 4; aisle++) {
        for (let rack = 1; rack <= 6; rack++) {
          for (let level = 1; level <= 3; level++) {
            const binId = `${zone}-${aisle.toString().padStart(2, '0')}-${rack.toString().padStart(2, '0')}-${level}`;
            
            // Randomly assign products to bins
            const binProducts = [];
            mockProducts.forEach(product => {
              if (Math.random() < 0.15) { // 15% chance of product being in this bin
                binProducts.push({
                  sku: product.sku,
                  quantity: Math.floor(Math.random() * 50) + 1,
                  lastCounted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                });
              }
            });
            
            mockBins.push({
              id: binId,
              zone,
              aisle,
              rack,
              level,
              type: level === 1 ? 'floor' : level === 3 ? 'high' : 'standard',
              position: {
                x: (zones.indexOf(zone) * 160) + (aisle - 1) * 40 + 50,
                y: (rack - 1) * 25 + 40
              },
              currentStock: binProducts,
              capacity: 100,
              isEmpty: binProducts.length === 0
            });
          }
        }
      }
    });
    
    setProducts(mockProducts);
    setBins(mockBins);
  };

  const generateMockAnalytics = () => {
    const analytics = {};
    const activities = {};
    
    products.forEach(product => {
      // Generate sales velocity data (30 days)
      const salesData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 20)
      }));
      
      // Generate stock history data
      const stockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        stock: Math.floor(Math.random() * 200) + 50
      }));
      
      analytics[product.sku] = {
        salesVelocity: salesData,
        stockHistory: stockData,
        avgDailySales: salesData.reduce((sum, day) => sum + day.sales, 0) / 30,
        totalSales: salesData.reduce((sum, day) => sum + day.sales, 0),
        daysOfStock: Math.floor(Math.random() * 60) + 10
      };
      
      // Generate recent activity
      const activityTypes = ['Picked for order', 'Received in PO', 'Transferred between bins', 'Cycle counted', 'Adjusted quantity'];
      activities[product.sku] = Array.from({ length: 5 }, (_, i) => ({
        id: `act-${i}`,
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        description: `${activityTypes[Math.floor(Math.random() * activityTypes.length)]} - ${product.sku}`,
        user: ['John Doe', 'Jane Smith', 'Mike Johnson'][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: Math.floor(Math.random() * 10) + 1
      }));
    });
    
    setProductAnalytics(analytics);
    setRecentActivity(activities);
  };

  const getProductStock = (sku) => {
    return bins.reduce((total, bin) => {
      const stock = bin.currentStock.find(s => s.sku === sku);
      return total + (stock?.quantity || 0);
    }, 0);
  };

  const getProductLocations = (sku) => {
    return bins
      .filter(bin => bin.currentStock.some(s => s.sku === sku))
      .map(bin => ({
        binId: bin.id,
        zone: bin.zone,
        position: bin.position,
        quantity: bin.currentStock.find(s => s.sku === sku).quantity,
        lastCounted: bin.currentStock.find(s => s.sku === sku).lastCounted
      }));
  };

  const getUniqueCategories = () => {
    return [...new Set(products.map(p => p.category))];
  };

  const getUniqueSuppliers = () => {
    return [...new Set(products.map(p => p.supplier))];
  };

  const getStockStatus = (product) => {
    const stock = getProductStock(product.sku);
    if (stock === 0) return 'out-of-stock';
    if (stock <= product.reorderPoint) return 'low-stock';
    return 'in-stock';
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setExpandedProduct(product);
    playSound('select');
  };

  const handleProductClose = () => {
    setSelectedProduct(null);
    setExpandedProduct(null);
  };

  const handleQuickAction = (action, product) => {
    switch (action) {
      case 'generate-po':
        console.log('Generating PO for', product.sku);
        addXP(50, 'Generated Purchase Order');
        break;
      case 'view-stock-control':
        console.log('Navigating to stock control for', product.sku);
        break;
      case 'start-cycle-count':
        console.log('Starting cycle count for', product.sku);
        addXP(25, 'Started Cycle Count');
        break;
      case 'view-analytics':
        console.log('Viewing analytics for', product.sku);
        break;
      default:
        break;
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesSupplier = filters.supplier === 'all' || product.supplier === filters.supplier;
      
      const stockStatus = getStockStatus(product);
      const matchesStockStatus = filters.stockStatus === 'all' || 
                                 (filters.stockStatus === 'in-stock' && stockStatus === 'in-stock') ||
                                 (filters.stockStatus === 'low-stock' && stockStatus === 'low-stock') ||
                                 (filters.stockStatus === 'out-of-stock' && stockStatus === 'out-of-stock');
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesStockStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'sku':
          aValue = a.sku;
          bValue = b.sku;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = getProductStock(a.sku);
          bValue = getProductStock(b.sku);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <ParticleEffect />
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Digital Product Catalog</h1>
            <p className="text-gray-400 text-sm">Explore products with live inventory and analytics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-500">{products.length}</div>
              <div className="text-xs text-gray-400">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-500">
                {products.filter(p => getStockStatus(p) === 'in-stock').length}
              </div>
              <div className="text-xs text-gray-400">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-500">
                {products.filter(p => getStockStatus(p) === 'low-stock').length}
              </div>
              <div className="text-xs text-gray-400">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-500">
                {products.filter(p => getStockStatus(p) === 'out-of-stock').length}
              </div>
              <div className="text-xs text-gray-400">Out of Stock</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Filters Sidebar */}
        <div className="w-80 bg-gray-800/30 border-r border-gray-700 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Grid size={18} className="mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <AlignJustify size={18} className="mx-auto" />
            </button>
          </div>

          {/* Sort Controls */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-300">Sort & Filter</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600"
              >
                <option value="name">Name</option>
                <option value="sku">SKU</option>
                <option value="price">Price</option>
                <option value="stock">Stock Level</option>
                <option value="category">Category</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortOrder('asc')}
                className={`flex-1 p-2 rounded-lg transition-colors ${
                  sortOrder === 'asc' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <SortAsc size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`flex-1 p-2 rounded-lg transition-colors ${
                  sortOrder === 'desc' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <SortDesc size={18} className="mx-auto" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-300">Filters</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({...filters, supplier: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600"
              >
                <option value="all">All Suppliers</option>
                {getUniqueSuppliers().map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600"
              >
                <option value="all">All Stock Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-300">Quick Stats</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Showing:</span>
                <span className="font-medium">{filteredAndSortedProducts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-medium">
                  ${filteredAndSortedProducts.reduce((sum, p) => sum + (p.price * getProductStock(p.sku)), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {/* Product Grid/List */}
          <div className="p-6 overflow-y-auto h-full">
            <motion.div
              layout
              className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                  : 'space-y-2'
              }`}
            >
              <AnimatePresence>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard
                    key={product.sku}
                    product={product}
                    isExpanded={expandedProduct?.sku === product.sku}
                    isSelected={selectedProduct?.sku === product.sku}
                    stockLevel={getProductStock(product.sku)}
                    stockStatus={getStockStatus(product)}
                    viewMode={viewMode}
                    onClick={() => handleProductSelect(product)}
                    onClose={handleProductClose}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Expanded Product Detail Panel */}
        <AnimatePresence>
          {expandedProduct && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[600px] bg-gray-800 border-l border-gray-700 overflow-y-auto"
            >
              <ProductDetailPanel
                product={expandedProduct}
                stockLevel={getProductStock(expandedProduct.sku)}
                locations={getProductLocations(expandedProduct.sku)}
                analytics={productAnalytics[expandedProduct.sku]}
                recentActivity={recentActivity[expandedProduct.sku]}
                hoveredBin={hoveredBin}
                onHoverBin={setHoveredBin}
                onClose={handleProductClose}
                onQuickAction={handleQuickAction}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ 
  product, 
  isExpanded, 
  isSelected, 
  stockLevel, 
  stockStatus, 
  viewMode, 
  onClick, 
  onClose 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return 'bg-green-500/20 text-green-400';
      case 'low-stock': return 'bg-yellow-500/20 text-yellow-400';
      case 'out-of-stock': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gray-800/50 p-4 rounded-lg border transition-all cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{product.name}</h3>
            <p className="text-sm text-gray-400">{product.sku}</p>
            <p className="text-xs text-gray-500">{product.category}</p>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stockStatus)}`}>
                {stockLevel} units
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
      className={`bg-gray-800/50 p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded-full z-10"
        >
          <X size={16} />
        </button>
      )}
      
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{product.sku}</p>
      <p className="text-xs text-gray-500 mb-3">{product.category}</p>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stockStatus)}`}>
          {stockLevel} units
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{getStatusText(stockStatus)}</span>
        <span>{product.supplier}</span>
      </div>
    </motion.div>
  );
};

// Product Detail Panel Component
const ProductDetailPanel = ({ 
  product, 
  stockLevel, 
  locations, 
  analytics, 
  recentActivity, 
  hoveredBin, 
  onHoverBin, 
  onClose, 
  onQuickAction 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p className="text-gray-400">{product.sku}</p>
          <p className="text-sm text-gray-500">{product.category} • {product.supplier}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Product Image */}
      <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <Package className="text-blue-500" size={20} />
            <span className="text-2xl font-bold">{stockLevel}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Current Stock</p>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <DollarSign className="text-green-500" size={20} />
            <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Unit Price</p>
        </div>
      </div>

      {/* Product Intelligence Panel */}
      {analytics && (
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 text-purple-500" size={20} />
            Product Intelligence
          </h3>
          
          <div className="space-y-4">
            {/* Sales Velocity Sparkline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Sales Velocity (30 days)</span>
                <span className="text-sm font-medium">{analytics.avgDailySales.toFixed(1)}/day avg</span>
              </div>
              <div className="flex items-end space-x-1 h-8">
                {analytics.salesVelocity.slice(-7).map((day, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${(day.sales / Math.max(...analytics.salesVelocity.map(d => d.sales), 1)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Days of Stock</p>
                <p className="font-semibold">{analytics.daysOfStock} days</p>
              </div>
              <div>
                <p className="text-gray-400">Total Sales (30d)</p>
                <p className="font-semibold">{analytics.totalSales} units</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Warehouse Map */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center">
          <MapPin className="mr-2 text-orange-500" size={20} />
          Warehouse Locations
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mini Map */}
          <div className="bg-gray-800 rounded-lg p-4">
            <svg className="w-full h-32" viewBox="0 0 800 200">
              {/* Zone backgrounds */}
              {['A', 'B', 'C', 'D', 'E'].map((zone, index) => (
                <rect
                  key={zone}
                  x={index * 160 + 10}
                  y={10}
                  width={150}
                  height={180}
                  fill="#374151"
                  stroke="#4b5563"
                  strokeWidth="1"
                  rx="4"
                />
              ))}
              
              {/* Zone labels */}
              {['A', 'B', 'C', 'D', 'E'].map((zone, index) => (
                <text
                  key={zone}
                  x={index * 160 + 85}
                  y={30}
                  textAnchor="middle"
                  className="fill-white text-xs font-bold"
                >
                  Zone {zone}
                </text>
              ))}
              
              {/* Location markers */}
              {locations.map((location, index) => (
                <circle
                  key={location.binId}
                  cx={location.position.x}
                  cy={location.position.y}
                  r={hoveredBin === location.binId ? "6" : "4"}
                  fill={hoveredBin === location.binId ? "#3b82f6" : "#10b981"}
                  stroke={hoveredBin === location.binId ? "#1d4ed8" : "#059669"}
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              ))}
            </svg>
          </div>
          
          {/* Location List */}
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.binId}
                className={`p-2 rounded-lg cursor-pointer transition-all ${
                  hoveredBin === location.binId ? 'bg-blue-500/20' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onMouseEnter={() => onHoverBin(location.binId)}
                onMouseLeave={() => onHoverBin(null)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{location.binId}</span>
                  <span className="text-sm text-gray-400">{location.quantity} units</span>
                </div>
                <p className="text-xs text-gray-500">
                  Last counted: {formatDate(location.lastCounted)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && (
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4 flex items-center">
            <Activity className="mr-2 text-cyan-500" size={20} />
            Recent Activity
          </h3>
          
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Product Details</h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Barcode</p>
              <p className="font-mono">{product.barcode}</p>
            </div>
            <div>
              <p className="text-gray-400">Reorder Point</p>
              <p className="font-medium">{product.reorderPoint} units</p>
            </div>
            <div>
              <p className="text-gray-400">Weight</p>
              <p className="font-medium">{product.weight} kg</p>
            </div>
            <div>
              <p className="text-gray-400">Cost</p>
              <p className="font-medium">${product.cost.toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm mb-1">Dimensions</p>
            <p className="font-medium">
              {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
            </p>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm mb-1">Description</p>
            <p className="text-sm">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Contextual Quick Actions */}
      <div className="space-y-2">
        <h3 className="font-semibold">Quick Actions</h3>
        
        {stockLevel <= product.reorderPoint && (
          <button
            onClick={() => onQuickAction('generate-po', product)}
            className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all flex items-center justify-center"
          >
            <ShoppingCart className="mr-2" size={18} />
            Generate Purchase Order
          </button>
        )}
        
        <button
          onClick={() => onQuickAction('view-stock-control', product)}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center"
        >
          <Eye className="mr-2" size={18} />
          View in Stock Control
        </button>
        
        <button
          onClick={() => onQuickAction('start-cycle-count', product)}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all flex items-center justify-center"
        >
          <Target className="mr-2" size={18} />
          Start Cycle Count
        </button>
        
        <button
          onClick={() => onQuickAction('view-analytics', product)}
          className="w-full p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all flex items-center justify-center"
        >
          <BarChart3 className="mr-2" size={18} />
          View Full Analytics
        </button>
      </div>
    </div>
  );
};

export default Products;