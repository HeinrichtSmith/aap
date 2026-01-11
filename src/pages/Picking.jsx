import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import OrderSelectionScreen from '../components/picking/OrderSelectionScreen';
// PickingScreen temporarily disabled - component being recreated
// import PickingScreen from '../components/picking/PickingScreen';
import PickingConfirmation from '../components/picking/PickingConfirmation';
import AnimatedBackground from '../components/AnimatedBackground';
import { initialOrders } from '../data/pickingData';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '../hooks/useWarehouseContext';
import { formatTime } from '../utils/formatters';
import api from '../services/api';

const Picking = () => {
  const { availablePickingOrders, setAvailablePickingOrders, pickedOrders, setPickedOrders, updateStats, user } = useWarehouse();
  const [currentScreen, setCurrentScreen] = useState('orderSelection');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickingTime, setPickingTime] = useState(null);
  const [orders, setOrders] = useState(availablePickingOrders);
  const [pickingStats, setPickingStats] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [pickedItems, setPickedItems] = useState([]);
  const [isPickConfirmed, setIsPickConfirmed] = useState(false);
  const [shouldUndoLastPick, setShouldUndoLastPick] = useState(false);
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState(0);
  const [statsUpdatedForOrder, setStatsUpdatedForOrder] = useState(false);

  // Sync with warehouse context
  useEffect(() => {
    setOrders(availablePickingOrders);
  }, [availablePickingOrders]);

  // Set navbar data when on confirmation screen
  useEffect(() => {
    if (currentScreen === 'confirmation' && selectedOrder) {
      window.pickingPageData = {
        // FIX: Prioritize human-readable SO number fields over transformed orderId
        orderId: selectedOrder?.soNumber || selectedOrder?.salesOrderNumber || selectedOrder?.id,
        soNumber: selectedOrder?.salesOrderNumber || selectedOrder?.soNumber,
        customer: selectedOrder?.customer,
        timerDisplay: formatTime(currentTimerSeconds),
        timerActive: false,
        totalPicked: pickedItems.length,
        totalItems: selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        remainingItems: 0,
        orderProgress: 100,
        onBack: () => setCurrentScreen('orderSelection'),
        isPickingScreen: false
      };
    }
    // Clear picking data when not in picking or confirmation screen
    else if (currentScreen === 'orderSelection') {
      delete window.pickingPageData;
    }
  }, [currentScreen, selectedOrder, currentTimerSeconds, pickedItems]);

  // Ensure body has the correct background class
  useEffect(() => {
    // The body background should be handled by app.css
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Clear picking data when on order selection screen
  useEffect(() => {
    if (currentScreen === 'orderSelection') {
      // Clear picking data from window
      if (window.pickingPageData) {
        delete window.pickingPageData;
      }
    }
  }, [currentScreen]);

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setStartTime(Date.now()); // Start the timer
    setPickedItems([]); // Reset picked items for new order
    setIsPickConfirmed(false); // Reset confirmation flag
    setStatsUpdatedForOrder(false); // Reset stats update flag for new order
    setCurrentTimerSeconds(0); // Reset timer for new order
    setCurrentScreen('picking');
  };

  const handlePickingComplete = (stats) => {
    setPickingTime({ time: stats.time });
    setCurrentTimerSeconds(stats.time); // Save current timer value
    setPickingStats(stats);
    setPickedItems(stats.pickedItems || []); // Save picked items
    setIsPickConfirmed(false); // Reset confirmation flag
    setCurrentScreen('confirmation');
  };

  const handlePrintPickingList = () => {
    console.log('Printing picking list for order:', selectedOrder.orderId);
    
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    document.body.appendChild(printFrame);
    
    const pickingListHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Picking List - ${selectedOrder.orderId}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .priority {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
          .priority-urgent {
            background: #fee2e2;
            color: #dc2626;
          }
          .priority-overnight {
            background: #fed7aa;
            color: #ea580c;
          }
          .priority-normal {
            background: #dbeafe;
            color: #2563eb;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .items-table th {
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .bin-location {
            font-weight: bold;
            font-size: 16px;
            color: #2563eb;
          }
          .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #9ca3af;
            border-radius: 4px;
            display: inline-block;
          }
          .summary {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PICKING LIST</h1>
          <div class="info-row">
            <span><strong>Order ID:</strong> ${selectedOrder.orderId}</span>
            <span><strong>Customer:</strong> ${selectedOrder.customer}</span>
          </div>
          <div class="info-row">
            <span><strong>Due Date:</strong> ${new Date(selectedOrder.dueDate).toLocaleString('en-NZ')}</span>
            <span class="priority priority-${selectedOrder.priority}">${selectedOrder.priority}</span>
          </div>
          <div class="info-row">
            <span><strong>Printed:</strong> ${new Date().toLocaleString('en-NZ')}</span>
            <span><strong>Picker:</strong> _________________</span>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th width="15%">Bin Location</th>
              <th width="20%">SKU</th>
              <th width="35%">Item Description</th>
              <th width="10%">Qty</th>
              <th width="10%">Picked</th>
              <th width="10%">✓</th>
            </tr>
          </thead>
          <tbody>
            ${selectedOrder.items
              .sort((a, b) => a.binLocation.localeCompare(b.binLocation))
              .map(item => `
                <tr>
                  <td><span class="bin-location">${item.binLocation}</span></td>
                  <td>${item.sku || 'UNKNOWN'}</td>
                  <td>${item.name}</td>
                  <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td style="text-align: center;">____</td>
                  <td style="text-align: center;"><div class="checkbox"></div></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="info-row">
            <span><strong>Total Items:</strong> ${selectedOrder.totalItems}</span>
            <span><strong>Total SKUs:</strong> ${selectedOrder.items.length}</span>
          </div>
          <div class="info-row" style="margin-top: 20px;">
            <span><strong>Start Time:</strong> _________</span>
            <span><strong>End Time:</strong> _________</span>
          </div>
          <div class="info-row">
            <span><strong>Total Time:</strong> _________</span>
            <span><strong>Verified By:</strong> _________________</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Notes: _________________________________________________________________</p>
          <p style="margin-top: 20px;">_______________________________________________________________________</p>
          <p style="margin-top: 20px; text-align: center;">
            Arrowhead WMS v6 - Picking List - ${new Date().toLocaleDateString('en-NZ')}
          </p>
        </div>
      </body>
      </html>
    `;
    
    printFrame.contentDocument.open();
    printFrame.contentDocument.write(pickingListHTML);
    printFrame.contentDocument.close();
    
    printFrame.onload = function() {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleConfirmPick = async () => {
    // Prevent duplicate confirmations
    if (isPickConfirmed) return;
    
    try {
      // Get order ID - handle both 'id' and 'orderId' field names
      const orderId = selectedOrder.id || selectedOrder.orderId;
      
      if (!orderId) {
        console.error('No order ID found:', selectedOrder);
        alert('Error: Unable to identify order. Please try selecting the order again.');
        return;
      }
      
      // Update order status to READY_TO_PACK via API
      await api.orders.updateStatus(orderId, 'READY_TO_PACK');
      
      // Reload orders from backend - this is the single source of truth
      // The getAvailable() API already filters by status=PENDING,PICKING
      // so orders with status=READY_TO_PACK won't be included
      const freshOrders = await api.orders.getAvailable();
      setAvailablePickingOrders(freshOrders);
      setOrders(freshOrders);
      
      // Create picked order data for packing station
      const pickedOrder = {
        ...selectedOrder,
        pickedDate: new Date().toISOString(),
        status: 'picked',
        pickedItems: pickedItems,
        pickingTime: pickingTime?.time || 0,
        pickingStats: pickingStats
      };

      // Add to picked orders for packing station
      setPickedOrders(prev => [...prev, pickedOrder]);
      
      // Update user stats (only once per order)
      // Note: ordersProcessed is only incremented when order is SHIPPED, not picked
      if (user && pickedItems.length > 0 && !statsUpdatedForOrder) {
        const itemsPicked = pickedItems.reduce((total, item) => total + (item.quantity ||1), 0);
        const newStats = {
          itemsPicked: (user.stats?.itemsPicked || 0) + itemsPicked
        };
        
        // Update average pick time if we have a time recorded
        if (pickingTime?.time) {
          const currentAvg = user.stats?.averagePickTime || 50;
          const totalOrders = user.stats?.ordersProcessed || 0;
          const newAvg = Math.round(((currentAvg * totalOrders) + pickingTime.time) / (totalOrders + 1));
          newStats.averagePickTime = newAvg;
        }
        
        updateStats(newStats);
        setStatsUpdatedForOrder(true); // Mark stats as updated for this order
      }

      // Mark as confirmed
      setIsPickConfirmed(true);
    } catch (error) {
      console.error('Error confirming pick:', error);
      alert('Failed to update order status. Please check your connection and try again.');
      // Don't fall back to local state - backend must be single source of truth
      // User can retry the confirmation
    }
  };

  const handleNewOrder = () => {
    // Sort remaining orders by priority (the order has already been confirmed/removed by handleConfirmPick)
    const sortedOrders = [...orders].sort((a, b) => {
      const priorityOrder = { urgent: 0, overnight: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Check if there are any orders left
    if (sortedOrders.length > 0) {
      // Automatically select the next highest priority order
      const nextOrder = sortedOrders[0];
      setSelectedOrder(nextOrder);
      setPickingTime(null);
      setPickingStats(null);
      setPickedItems([]); // Reset picked items for new order
      setIsPickConfirmed(false); // Reset confirmation flag for new order
      setStatsUpdatedForOrder(false); // Reset stats update flag for new order
      setStartTime(Date.now()); // Start timer for new order
      setCurrentTimerSeconds(0); // Reset timer for new order
      setCurrentScreen('picking'); // Go directly to picking screen
    } else {
      // No more orders available
      setSelectedOrder(null);
      setPickingTime(null);
      setPickingStats(null);
      setPickedItems([]); // Reset picked items
      setCurrentScreen('orderSelection'); // Go back to selection screen when no orders left
    }
  };

  const handleEdit = () => {
    // Set a flag to undo last pick when returning to picking screen
    setShouldUndoLastPick(true);
    setCurrentScreen('picking');
  };

  const handleCloseConfirmation = () => {
    // Return to order selection screen
    setCurrentScreen('orderSelection');
  };

  return (
    <>
      {/* Show "No More Orders" screen when there are no orders left */}
      {currentScreen === 'orderSelection' && orders.length === 0 && (
        <div className="min-h-screen w-full p-8 flex items-center justify-center relative">
          <AnimatedBackground />
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-6 shadow-lg shadow-green-500/50">
              <CheckCircle className="text-white" size={64} />
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">All Orders Picked!</h2>
            <p className="text-xl text-gray-400">Great job! There are no more orders to pick.</p>
          </div>
        </div>
      )}
      
      {currentScreen === 'orderSelection' && orders.length > 0 && (
        <OrderSelectionScreen orders={orders} onSelectOrder={handleOrderSelect} />
      )}
      
      {currentScreen === 'picking' && selectedOrder && (
        <div className="min-h-screen w-full p-8 flex items-center justify-center relative">
          <AnimatedBackground />
          <div className="text-center relative z-10 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-12 border border-white/10 max-w-2xl">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg">
              <AlertTriangle className="text-white" size={64} />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Picking Screen Unavailable</h2>
            <p className="text-xl text-gray-400 mb-6">The picking interface is currently being rebuilt.</p>
            <p className="text-lg text-gray-500 mb-8">Please use the printed picking list or try again later.</p>
            <button
              onClick={() => setCurrentScreen('orderSelection')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/50"
            >
              Back to Order Selection
            </button>
            <div className="mt-8 pt-8 border-t border-white/10">
              <button
                onClick={handlePrintPickingList}
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Print Picking List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {currentScreen === 'confirmation' && selectedOrder && pickingTime && (
          <PickingConfirmation
            order={selectedOrder}
            pickingTime={pickingTime}
            onPrintList={handlePrintPickingList}
            onConfirm={handleConfirmPick}
            onContinue={handleNewOrder}
            onEdit={handleEdit}
            onClose={handleCloseConfirmation}
            pickingStats={pickingStats}
            pickedItems={pickedItems}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Picking;