/**
 * COURIER SERVICE
 * 
 * Handles label generation and tracking across multiple couriers.
 * Supports: NZ Couriers, NZ Post, Mainfreight, Post Haste
 */

import logger from '../utils/logger.js';
import axios from 'axios';

// Courier base URLs (can be configured via environment)
const COURIER_BASE_URLS = {
  'nz-couriers': process.env.NZCOURIERS_API_URL || 'http://localhost:8002/nzcouriers/v1',
  'nz-post': process.env.NZPOST_API_URL || 'http://localhost:8002/nzpost/v1',
  'mainfreight': process.env.MAINFREIGHT_API_URL || 'http://localhost:8002/mainfreight/v1',
  'post-haste': process.env.POSTHASTE_API_URL || 'http://localhost:8002/posthaste/v1',
};

// Courier API keys
const COURIER_API_KEYS = {
  'nz-couriers': process.env.NZCOURIERS_API_KEY || 'test-key',
  'nz-post': process.env.NZPOST_API_KEY || 'test-key',
  'mainfreight': process.env.MAINFREIGHT_API_KEY || 'test-key',
  'post-haste': process.env.POSTHASTE_API_KEY || 'test-key',
};

/**
 * Generate shipping label
 */
export async function generateLabel(order, courier) {
  try {
    const baseUrl = COURIER_BASE_URLS[courier];
    const apiKey = COURIER_API_KEYS[courier];

    if (!baseUrl) {
      throw new Error(`Unknown courier: ${courier}`);
    }

    // Map order to courier request format
    const shipmentData = mapOrderToShipment(order, courier);

    const response = await axios.post(`${baseUrl}/shipment`, shipmentData, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Label generated for order ${order.id} via ${courier}: ${response.data.trackingNumber}`);

    return {
      success: true,
      trackingNumber: response.data.trackingNumber,
      labelUrl: response.data.labelUrl,
      pdfData: response.data.pdfData,
      courier: courier,
      cost: response.data.cost,
      estimatedDelivery: response.data.estimatedDelivery,
    };
  } catch (error) {
    logger.error(`Error generating label for order ${order.id}:`, error.message);
    return {
      success: false,
      error: error.message,
      courier: courier,
    };
  }
}

/**
 * Get tracking information
 */
export async function getTrackingStatus(trackingNumber, courier) {
  try {
    const baseUrl = COURIER_BASE_URLS[courier];
    const apiKey = COURIER_API_KEYS[courier];

    const response = await axios.get(`${baseUrl}/tracking/${trackingNumber}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    return {
      success: true,
      trackingNumber,
      status: response.data.status,
      location: response.data.location,
      estimatedDelivery: response.data.estimatedDelivery,
      history: response.data.history || [],
      courier: courier,
    };
  } catch (error) {
    logger.error(`Error getting tracking for ${trackingNumber}:`, error.message);
    return {
      success: false,
      error: error.message,
      trackingNumber,
      courier: courier,
    };
  }
}

/**
 * Cancel shipment
 */
export async function cancelShipment(trackingNumber, courier, reason) {
  try {
    const baseUrl = COURIER_BASE_URLS[courier];
    const apiKey = COURIER_API_KEYS[courier];

    await axios.post(`${baseUrl}/shipment/${trackingNumber}/cancel`, {
      reason: reason || 'Requested by customer',
    }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Shipment cancelled: ${trackingNumber} (${courier})`);

    return {
      success: true,
      trackingNumber,
      courier: courier,
    };
  } catch (error) {
    logger.error(`Error cancelling shipment ${trackingNumber}:`, error.message);
    return {
      success: false,
      error: error.message,
      trackingNumber,
      courier: courier,
    };
  }
}

/**
 * Get shipping rate estimate
 */
export async function getRateEstimate(order, courier) {
  try {
    const baseUrl = COURIER_BASE_URLS[courier];
    const apiKey = COURIER_API_KEYS[courier];

    const shipmentData = mapOrderToShipment(order, courier);

    const response = await axios.post(`${baseUrl}/rate`, shipmentData, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      courier: courier,
      baseRate: response.data.baseRate,
      tax: response.data.tax || 0,
      total: response.data.total,
      estimatedDays: response.data.estimatedDays,
      options: response.data.options || [],
    };
  } catch (error) {
    logger.error(`Error getting rate estimate for ${courier}:`, error.message);
    return {
      success: false,
      error: error.message,
      courier: courier,
    };
  }
}

/**
 * Map order to courier-specific shipment format
 */
function mapOrderToShipment(order, courier) {
  // Common fields
  const shipment = {
    reference: order.id,
    service: 'standard', // Could be 'express', 'overnight', etc.
    sender: {
      name: order.company?.name || 'Sender',
      email: order.company?.email || 'sender@example.com',
      phone: order.company?.phone || '+6491234567',
      address: {
        street: order.shippingAddress?.street || '123 Warehouse St',
        city: order.shippingAddress?.city || 'Auckland',
        state: order.shippingAddress?.state || 'Auckland',
        postcode: order.shippingAddress?.postcode || '1010',
        country: 'NZ',
      },
    },
    recipient: {
      name: order.customerName || 'Recipient',
      email: order.customerEmail || 'recipient@example.com',
      phone: order.customerPhone || '+6491234567',
      address: {
        street: order.shippingAddress?.street || '456 Delivery Rd',
        city: order.shippingAddress?.city || 'Wellington',
        state: order.shippingAddress?.state || 'Wellington',
        postcode: order.shippingAddress?.postcode || '6011',
        country: 'NZ',
      },
    },
    parcels: order.items?.map(item => ({
      weight: item.quantity * (item.product?.weight || 0.5), // kg
      length: item.product?.length || 20, // cm
      width: item.product?.width || 15, // cm
      height: item.product?.height || 10, // cm
      description: item.name || 'Item',
      value: item.quantity * (item.product?.price || 10), // NZD
    })) || [],
  };

  // Courier-specific adjustments
  if (courier === 'nz-couriers') {
    shipment.service = order.priority === 'URGENT' ? 'overnight' : 'standard';
    shipment.accountCode = process.env.NZCOURIERS_ACCOUNT;
  }

  if (courier === 'nz-post') {
    shipment.service = order.priority === 'URGENT' ? 'overnight' : 'tracked';
    shipment.signatureRequired = order.priority === 'URGENT';
  }

  if (courier === 'mainfreight') {
    shipment.service = 'economy';
    shipment.pallet = false;
  }

  if (courier === 'post-haste') {
    shipment.service = 'sameday';
    shipment.pickupTime = new Date().toISOString();
  }

  return shipment;
}

/**
 * Get supported couriers
 */
export function getSupportedCouriers() {
  return Object.keys(COURIER_BASE_URLS);
}

/**
 * Get courier display name
 */
export function getCourierDisplayName(courier) {
  const names = {
    'nz-couriers': 'NZ Couriers',
    'nz-post': 'NZ Post',
    'mainfreight': 'Mainfreight',
    'post-haste': 'Post Haste',
  };
  return names[courier] || courier;
}

// Export service
export const courierService = {
  generateLabel,
  getTrackingStatus,
  cancelShipment,
  getRateEstimate,
  getSupportedCouriers,
  getCourierDisplayName,
};
