import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Package, FileText, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      
      try {
        // Load all data sources
        const [ordersData, productsData, purchaseOrdersData] = await Promise.all([
          import('../data/orders.json'),
          import('../data/products.json'),
          import('../data/purchaseOrders.json')
        ]);

        const searchResults = [];
        const lowerQuery = query.toLowerCase();

        // Search orders
        ordersData.orders.forEach(order => {
          if (
            order.id.toLowerCase().includes(lowerQuery) ||
            order.customer.name.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              type: 'order',
              id: order.id,
              title: `Order ${order.id}`,
              subtitle: order.customer.name,
              icon: Package,
              path: `/picking`
            });
          }
        });

        // Search products
        productsData.products.forEach(product => {
          if (
            product.sku.toLowerCase().includes(lowerQuery) ||
            product.name.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              type: 'product',
              id: product.sku,
              title: product.name,
              subtitle: `SKU: ${product.sku}`,
              icon: Package,
              path: `/products?sku=${product.sku}`
            });
          }
        });

        // Search purchase orders
        purchaseOrdersData.purchaseOrders.forEach(po => {
          if (
            po.id.toLowerCase().includes(lowerQuery) ||
            po.supplier.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              type: 'purchaseOrder',
              id: po.id,
              title: `PO ${po.id}`,
              subtitle: po.supplier,
              icon: Truck,
              path: `/inwards`
            });
          }
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result) => {
    navigate(result.path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="modal-content w-full max-w-2xl"
      >
        <div className="p-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, products, or purchase orders..."
              className="input-field w-full pl-12 pr-12 text-sm"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="mt-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition-colors flex items-center space-x-4"
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <result.icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-400">{result.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-500 uppercase">
                      {result.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-8 text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Start typing to search...
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SearchModal;