import { useState } from 'react';
import { playSound } from '../utils/audio';
import { MAX_QUANTITY } from './useTierSystem';

export const usePackageManagement = () => {
  const [shipment, setShipment] = useState({});

  // Add package to shipment or increment quantity
  const addToShipment = (packageId) => {
    setShipment(prev => ({
      ...prev,
      [packageId]: Math.min((prev[packageId] || 0) + 1, MAX_QUANTITY)
    }));
    playSound('success');
  };

  // Remove package from shipment or decrement quantity
  const removeFromShipment = (packageId) => {
    setShipment(prev => {
      const newShipment = { ...prev };
      if (newShipment[packageId] > 1) {
        newShipment[packageId]--;
      } else {
        delete newShipment[packageId];
      }
      return newShipment;
    });
    playSound('click');
  };

  // Update quantity for a specific package
  const updateShipmentQuantity = (packageId, quantity, playClickSound = true) => {
    if (quantity <= 0) {
      setShipment(prev => {
        const newShipment = { ...prev };
        delete newShipment[packageId];
        return newShipment;
      });
    } else {
      setShipment(prev => ({
        ...prev,
        [packageId]: Math.min(MAX_QUANTITY, quantity)
      }));
    }
    if (playClickSound) {
      playSound('click');
    }
  };

  // Remove all of a specific package type
  const removeItemFromShipment = (packageId) => {
    setShipment(prev => {
      const newShipment = { ...prev };
      delete newShipment[packageId];
      return newShipment;
    });
  };

  // Calculate total packages in shipment
  const getTotalPackages = () => {
    return Object.values(shipment).reduce((sum, quantity) => sum + quantity, 0);
  };

  return {
    shipment,
    addToShipment,
    removeFromShipment,
    updateShipmentQuantity,
    removeItemFromShipment,
    getTotalPackages
  };
}; 