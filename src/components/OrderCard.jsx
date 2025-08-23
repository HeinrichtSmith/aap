import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, AlertCircle, MapPin, Truck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const OrderCard = ({ order, onClick, showActions = true }) => {
  const priorityColors = {
    high: 'border-red-500 bg-red-500/10',
    urgent: 'border-red-500 bg-red-500/10',
    normal: 'border-primary bg-primary/10',
    low: 'border-gray-500 bg-gray-500/10'
  };

  const statusColors = {
    pending: 'text-gray-400',
    picking: 'text-yellow-500',
    ready_to_pack: 'text-blue-500',
    packed: 'text-green-500',
    shipped: 'text-purple-500'
  };

  // Safe date formatting
  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return null;
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  };

  // Get the most relevant date
  const getOrderDate = () => {
    const dateToUse = order.requiredBy || order.readyAt || order.createdAt;
    const date = formatDate(dateToUse);
    
    if (!date) return 'No date specified';
    
    // If the date is in the past, show how long ago
    if (date < new Date()) {
      return `Ready ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
    
    // If future date, show the due date
    return `Due: ${format(date, 'dd MMM HH:mm')}`;
  };

  // Calculate if order is overdue
  const isOverdue = () => {
    const dateToUse = order.readyAt || order.createdAt;
    const date = formatDate(dateToUse);
    if (!date) return false;
    
    const ageInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return ageInHours > 24;
  };

  const overdue = isOverdue();
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`glass-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-all ${
        overdue ? 'border-orange-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center">
            {order.id}
            {overdue && (
              <AlertCircle size={16} className="ml-2 text-orange-400" />
            )}
          </h3>
          <p className="text-sm text-gray-400">{order.customer?.name || 'Unknown Customer'}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs ${priorityColors[order.priority || 'normal']}`}>
          {(order.priority || 'normal').toUpperCase()}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-400">
          <Package size={16} className="mr-2" />
          {order.items?.length || 0} items ({totalItems} units)
        </div>
        
        <div className={`flex items-center text-sm ${overdue ? 'text-orange-400' : 'text-gray-400'}`}>
          <Clock size={16} className="mr-2" />
          {getOrderDate()}
        </div>

        {order.shippingAddress && (
          <div className="flex items-center text-sm text-gray-400">
            <MapPin size={16} className="mr-2" />
            {order.shippingAddress.city}, {order.shippingAddress.country}
          </div>
        )}

        {order.shippingMethod && (
          <div className="flex items-center text-sm text-gray-400">
            <Truck size={16} className="mr-2" />
            <span className="capitalize">{order.shippingMethod}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${statusColors[order.status || 'pending']}`}>
          {(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
        </span>
        {showActions && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              order.priority === 'overnight' || order.priority === 'urgent'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'btn-primary'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onClick(order);
            }}
          >
            {order.status === 'ready_to_pack' ? 'Pack' : 'Process'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default OrderCard;