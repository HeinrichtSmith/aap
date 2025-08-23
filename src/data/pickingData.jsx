// src/data/pickingData.jsx
import ordersData from './orders.json';
import productsData from './products.json';

// Create a mapping of SKU to product details
const productMap = {};
productsData.products.forEach(product => {
  productMap[product.sku] = product;
});

// Transform orders.json format to picking format
const transformOrdersFromJson = () => {
  return ordersData.orders
    .filter(order => order.status === 'pending') // Only show pending orders in picking
    .map(order => ({
      id: `ORDER-${order.id}`,
      orderId: order.id,
      priority: order.priority,
      customer: order.customer.name,
      dueDate: order.requiredBy,
      items: order.items.map(item => {
        const product = productMap[item.sku] || {};
        return {
          id: product.barcode || item.sku,
          name: item.name || product.name || item.sku,
          quantity: item.quantity,
          binLocation: item.location,
          pickedQuantity: item.pickedQuantity || 0
        };
      }),
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      pickedItems: order.items.reduce((sum, item) => sum + (item.pickedQuantity || 0), 0),
      estimatedTime: Math.max(60, order.items.length * 30 + order.items.reduce((sum, item) => sum + item.quantity, 0) * 15) // Estimate based on items
    }));
};

// Original static orders for fallback
export const staticOrders = [
  { 
    id: 'ORDER-001', 
    orderId: 'SO5342', 
    priority: 'overnight', 
    customer: 'Auckland Security Systems', 
    dueDate: '2025-01-07T09:30:00',
    items: [
      { id: '9421234567890', name: 'PIR Motion Sensor', quantity: 2, binLocation: 'A-01-03', pickedQuantity: 0 }, 
      { id: '9421234567894', name: 'LCD Keypad', quantity: 1, binLocation: 'A-02-15', pickedQuantity: 0 }
    ],
    totalItems: 3,
    pickedItems: 0,
    estimatedTime: 180 // seconds
  },
  { 
    id: 'ORDER-002', 
    orderId: 'SO5343', 
    priority: 'normal', 
    customer: 'Wellington Safety Co', 
    dueDate: '2025-01-07T14:00:00',
    items: [
      { id: '9421234567896', name: 'HD Security Camera', quantity: 1, binLocation: 'B-03-07', pickedQuantity: 0 }, 
      { id: '9421234567893', name: 'Magnetic Door Contact', quantity: 3, binLocation: 'B-03-08', pickedQuantity: 0 },
      { id: '9421234567897', name: 'Wireless Panic Button', quantity: 2, binLocation: 'B-05-11', pickedQuantity: 0 }
    ],
    totalItems: 6,
    pickedItems: 0,
    estimatedTime: 240 // seconds
  },
  { 
    id: 'ORDER-003', 
    orderId: 'SO5344', 
    priority: 'overnight', 
    customer: 'Christchurch Electronics', 
    dueDate: '2025-01-07T10:00:00',
    items: [
      { id: '9421234567892', name: 'Smart Control Panel', quantity: 1, binLocation: 'C-05-12', pickedQuantity: 0 }, 
      { id: '9421234567891', name: 'Outdoor Siren 120dB', quantity: 2, binLocation: 'C-06-22', pickedQuantity: 0 },
      { id: '9421234567895', name: 'Photoelectric Smoke Detector', quantity: 4, binLocation: 'D-01-04', pickedQuantity: 0 }
    ],
    totalItems: 7,
    pickedItems: 0,
    estimatedTime: 300 // seconds
  },
  { 
    id: 'ORDER-004', 
    orderId: 'SO5345', 
    priority: 'urgent', 
    customer: 'Hamilton Tech Hub', 
    dueDate: '2025-01-07T08:00:00',
    items: [
      { id: '9421234567895', name: 'Photoelectric Smoke Detector', quantity: 3, binLocation: 'D-01-04', pickedQuantity: 0 }, 
      { id: '9421234567897', name: 'Wireless Panic Button', quantity: 3, binLocation: 'D-01-05', pickedQuantity: 0 },
      { id: '9421234567890', name: 'PIR Motion Sensor', quantity: 5, binLocation: 'A-01-03', pickedQuantity: 0 },
      { id: '9421234567893', name: 'Magnetic Door Contact', quantity: 10, binLocation: 'B-03-08', pickedQuantity: 0 }
    ],
    totalItems: 21,
    pickedItems: 0,
    estimatedTime: 600 // seconds
  },
  { 
    id: 'ORDER-005', 
    orderId: 'SO5346', 
    priority: 'normal', 
    customer: 'Dunedin Digital', 
    dueDate: '2025-01-07T16:00:00',
    items: [
      { id: '9421234567890', name: 'PIR Motion Sensor', quantity: 1, binLocation: 'A-01-03', pickedQuantity: 0 }, 
      { id: '9421234567893', name: 'Magnetic Door Contact', quantity: 2, binLocation: 'B-03-08', pickedQuantity: 0 }
    ],
    totalItems: 3,
    pickedItems: 0,
    estimatedTime: 120 // seconds
  },
  { 
    id: 'ORDER-006', 
    orderId: 'SO5347', 
    priority: 'overnight', 
    customer: 'Tauranga Security Services', 
    dueDate: '2025-01-07T11:00:00',
    items: [
      { id: '9421234567896', name: 'HD Security Camera', quantity: 4, binLocation: 'B-03-07', pickedQuantity: 0 }, 
      { id: '9421234567894', name: 'LCD Keypad', quantity: 2, binLocation: 'A-02-15', pickedQuantity: 0 },
      { id: '9421234567892', name: 'Smart Control Panel', quantity: 1, binLocation: 'C-05-12', pickedQuantity: 0 }
    ],
    totalItems: 7,
    pickedItems: 0,
    estimatedTime: 360 // seconds
  },
  { 
    id: 'ORDER-007', 
    orderId: 'SO5348', 
    priority: 'urgent', 
    customer: 'Palmerston North Electronics', 
    dueDate: '2025-01-07T07:30:00',
    items: [
      { id: '9421234567891', name: 'Outdoor Siren 120dB', quantity: 1, binLocation: 'C-06-22', pickedQuantity: 0 }
    ],
    totalItems: 1,
    pickedItems: 0,
    estimatedTime: 60 // seconds
  },
  { 
    id: 'ORDER-008', 
    orderId: 'SO5349', 
    priority: 'normal', 
    customer: 'Nelson Security Hub', 
    dueDate: '2025-01-07T15:00:00',
    items: [
      { id: '9421234567895', name: 'Photoelectric Smoke Detector', quantity: 6, binLocation: 'D-01-04', pickedQuantity: 0 }, 
      { id: '9421234567897', name: 'Wireless Panic Button', quantity: 2, binLocation: 'D-01-05', pickedQuantity: 0 },
      { id: '9421234567893', name: 'Magnetic Door Contact', quantity: 8, binLocation: 'B-03-08', pickedQuantity: 0 },
      { id: '9421234567890', name: 'PIR Motion Sensor', quantity: 3, binLocation: 'A-01-03', pickedQuantity: 0 }
    ],
    totalItems: 19,
    pickedItems: 0,
    estimatedTime: 480 // seconds
  }
];

// Export the transformed orders from JSON, falling back to static orders if needed
export const initialOrders = (() => {
  try {
    const transformedOrders = transformOrdersFromJson();
    return transformedOrders.length > 0 ? transformedOrders : staticOrders;
  } catch (error) {
    console.warn('Failed to load orders from JSON, using static orders:', error);
    return staticOrders;
  }
})();