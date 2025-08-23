import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { CheckCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ToteSelectionScreen from '../components/packing/ToteSelectionScreen';
import PackingScreen from '../components/packing/PackingScreen';
import AnimatedBackground from '../components/AnimatedBackground';
import ParticleEffect from '../components/ParticleEffect';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '../hooks/useWarehouseContext';
import { useBatchedUpdates } from '../hooks/useBatchedUpdates';

// Lazy load heavy components
const PackagingSelectionScreen = lazy(() => import('../components/packing/PackagingSelectionScreen'));
const ConfirmationScreen = lazy(() => import('../components/packing/ConfirmationScreen'));

const Packing = () => {
  const { pickedOrders, setPickedOrders, setPackedOrders, updateStats, addXP, user } = useWarehouse();
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('toteSelection');
  const [selectedTote, setSelectedTote] = useState(null);
  const [packingTime, setPackingTime] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [totes, setTotes] = useState([]);
  const [packingStats, setPackingStats] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  
  const batchUpdates = useBatchedUpdates();

  // Sync picked orders with local totes state - memoized
  const sortedTotes = useMemo(() => {
    const sortedTotes = [...pickedOrders].sort((a, b) => {
      const priorityOrder = { urgent: 0, overnight: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    return sortedTotes;
  }, [pickedOrders]);
  
  useEffect(() => {
    setTotes(sortedTotes);
  }, [sortedTotes]);

  // Ensure body has the correct background class
  useEffect(() => {
    // The body background should be handled by app.css
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleToteSelect = useCallback((tote) => {
    batchUpdates(() => {
      setSelectedTote(tote);
      setStartTime(Date.now());
      setScannedItems([]);
      setCurrentScreen('packing');
    });
  }, [batchUpdates]);

  const handlePackingComplete = useCallback((stats) => {
    batchUpdates(() => {
      setPackingTime({ time: stats.time });
      setPackingStats(stats);
      setScannedItems(stats.scannedItems || []);
      setCurrentScreen('packageSelection');
    });
  }, [batchUpdates]);

  const handlePackageSelect = useCallback((pkg, finalTime) => {
    batchUpdates(() => {
      if (finalTime !== undefined) {
        setPackingTime({ time: finalTime });
      } else if (startTime) {
        const calculatedTime = Math.floor((Date.now() - startTime) / 1000);
        setPackingTime({ time: calculatedTime });
      }
      setSelectedPackage(pkg);
      setCurrentScreen('confirmation');
    });
  }, [batchUpdates, startTime]);

  const handlePrintLabel = () => {
    console.log('Printing label for order:', selectedTote.orderId);
    
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    document.body.appendChild(printFrame);
    
    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${selectedTote.orderId}</title>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .label-container {
            border: 2px solid #000;
            padding: 20px;
            height: calc(6in - 40px);
            box-sizing: border-box;
          }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .barcode {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 10px;
            background: #f0f0f0;
          }
          .info-row {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
          }
          .info-label {
            font-weight: bold;
          }
          .customer-info {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 20px;
          }
          .items-list {
            margin-top: 20px;
            font-size: 12px;
          }
          .weight-info {
            margin-top: 15px;
            padding: 10px;
            background: #fffee0;
            border: 1px solid #ffd700;
            font-weight: bold;
          }
          .footer {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h2 style="margin: 0; text-align: center;">${selectedPackage.courier || 'SHIPPING LABEL'}</h2>
          </div>
          
          <div class="barcode">${selectedTote.orderId}</div>
          
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span>${selectedTote.orderId}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Package:</span>
            <span>${selectedPackage.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Priority:</span>
            <span style="text-transform: uppercase; color: ${
              selectedTote.priority === 'urgent' ? 'red' : 
              selectedTote.priority === 'overnight' ? 'orange' : 'blue'
            };">${selectedTote.priority}</span>
          </div>
          
          ${selectedPackage.weight ? `
            <div class="weight-info">
              WEIGHT: ${selectedPackage.weight} kg
            </div>
          ` : ''}
          
          <div class="customer-info">
            <h3 style="margin: 0 0 10px 0;">Ship To:</h3>
            <div style="font-size: 14px;">
              ${selectedTote.customer}<br>
              Auckland, New Zealand
            </div>
          </div>
          
          <div class="items-list">
            <strong>Items (${selectedTote.items.reduce((sum, item) => sum + item.quantity, 0)} total):</strong><br>
            ${selectedTote.items.map(item => 
              `${item.quantity}x ${item.name} (${item.id})`
            ).join('<br>')}
          </div>
          
          <div class="footer">
            Packed: ${new Date().toLocaleString('en-NZ')}
          </div>
        </div>
      </body>
      </html>
    `;
    
    printFrame.contentDocument.open();
    printFrame.contentDocument.write(labelHTML);
    printFrame.contentDocument.close();
    
    printFrame.onload = function() {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleNewOrder = useCallback(() => {
    // Create packed order data
    const packedOrder = {
      id: `PACK-${Date.now()}`,
      orderId: selectedTote.orderId,
      customer: selectedTote.customer,
      priority: selectedTote.priority,
      pickedDate: selectedTote.pickedDate,
      packedDate: new Date().toISOString(),
      items: selectedTote.items,
      packaging: selectedPackage,
      trackingNumber: `NZ${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'ready_to_ship'
    };
    
    // Remove the completed tote from local state
    const remainingTotes = totes.filter(t => t.id !== selectedTote.id);
    
    // Sort remaining totes by priority
    const sortedTotes = [...remainingTotes].sort((a, b) => {
      const priorityOrder = { urgent: 0, overnight: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Batch all state updates
    batchUpdates(() => {
      // Add to packed orders
      setPackedOrders(prev => [...prev, packedOrder]);
      
      // Remove from picked orders
      setPickedOrders(prev => prev.filter(t => t.id !== selectedTote.id));
      
      // Update local totes
      setTotes(sortedTotes);
      
      // Update user stats for packing
      if (user) {
        const itemsPacked = selectedTote.items.reduce((total, item) => total + item.quantity, 0);
        const newStats = {
          itemsPacked: (user.stats?.itemsPacked || 0) + itemsPacked
        };
        
        // Update average pack time if we have a time recorded
        if (packingTime?.time) {
          const currentAvg = user.stats?.averagePackTime || 120;
          const totalPacked = Math.floor((user.stats?.itemsPacked || 0) / 12) || 0; // Estimate orders from items
          const newAvg = Math.round(((currentAvg * totalPacked) + packingTime.time) / (totalPacked + 1));
          newStats.averagePackTime = newAvg;
        }
        
        updateStats(newStats);
        
        // Award XP for packing
        const baseXP = 40; // Base XP for packing an order
        const speedBonus = packingTime?.time < 120 ? 15 : 0; // Bonus for fast packing
        const totalXP = baseXP + speedBonus;
        
        addXP(totalXP, `Packed order ${selectedTote.orderId}`);
      }
      
      // Check if there are any totes left
      if (sortedTotes.length > 0) {
        // Automatically select the next highest priority tote
        const nextTote = sortedTotes[0];
        setSelectedTote(nextTote);
        setPackingTime(null);
        setSelectedPackage(null);
        setPackingStats(null);
        setScannedItems([]);
        setStartTime(Date.now());
        setCurrentScreen('packing');
      } else {
        // No more orders available
        setSelectedTote(null);
        setPackingTime(null);
        setSelectedPackage(null);
        setPackingStats(null);
        setScannedItems([]);
        setCurrentScreen('toteSelection');
      }
    });
  }, [selectedTote, selectedPackage, totes, batchUpdates, setPackedOrders, setPickedOrders, user, packingTime, updateStats, addXP]);

  const handleEdit = useCallback(() => {
    setCurrentScreen('packing');
  }, []);

  const handleCloseConfirmation = useCallback(() => {
    setCurrentScreen('packageSelection');
  }, []);

  const handleBackToPacking = useCallback(() => {
    batchUpdates(() => {
      if (scannedItems.length > 0) {
        const updatedScannedItems = [...scannedItems];
        updatedScannedItems.pop();
        setScannedItems(updatedScannedItems);
      }
      setCurrentScreen('packing');
    });
    playSound('click');
  }, [batchUpdates, scannedItems]);

  return (
    <>
      <ParticleEffect />
      {/* Show "No More Orders" screen when there are no orders left */}
      {currentScreen === 'toteSelection' && totes.length === 0 && (
        <div className="min-h-screen w-full p-8 flex items-center justify-center relative">
          <AnimatedBackground />
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-6 shadow-lg shadow-green-500/50">
              <CheckCircle className="text-white" size={64} />
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">All Orders Packed!</h2>
            <p className="text-xl text-gray-400 mb-8">Great job! There are no more orders to pack.</p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                navigate('/dashboard');
              }}
              onMouseEnter={() => playSound('hover')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2 mx-auto"
            >
              <Home size={20} />
              <span>Back to Dashboard</span>
            </motion.button>
          </div>
        </div>
      )}
      
      {currentScreen === 'toteSelection' && totes.length > 0 && (
        <ToteSelectionScreen totes={totes} onSelectTote={handleToteSelect} />
      )}
      
      {currentScreen === 'packing' && selectedTote && (
        <PackingScreen 
          tote={selectedTote} 
          onComplete={handlePackingComplete} 
          initialScannedItems={scannedItems}
          onBack={() => setCurrentScreen('toteSelection')}
        />
      )}
      
      {currentScreen === 'packageSelection' && selectedTote && (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-white text-xl">Loading packaging options...</div>
          </div>
        }>
          <PackagingSelectionScreen 
            onSelect={handlePackageSelect} 
            items={selectedTote.items}
            packingTime={packingTime}
            startTime={startTime}
            tote={selectedTote}
            onBack={handleBackToPacking}
          />
        </Suspense>
      )}

      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {currentScreen === 'confirmation' && selectedTote && packingTime && selectedPackage && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="text-white text-xl">Loading confirmation...</div>
            </div>
          }>
            <ConfirmationScreen
              order={selectedTote}
              packingTime={packingTime}
              selectedPackage={selectedPackage}
              onPrintLabel={handlePrintLabel}
              onNewOrder={handleNewOrder}
              onEdit={handleEdit}
              onClose={handleCloseConfirmation}
              packingStats={packingStats}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default Packing;
