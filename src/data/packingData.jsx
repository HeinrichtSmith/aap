// src/data/packingData.js

export const boxOptions = [
  {
    id: 'box-s',
    name: 'Small Box',
    dimensions: '300×200×150mm',
    iconType: 'box',
    iconSize: 'small',
    iconCount: 1, // Small = 1 bar filled
    courier: 'NZ Couriers'
  },
  {
    id: 'box-m',
    name: 'Medium Box',
    dimensions: '400×300×200mm',
    iconType: 'box',
    iconSize: 'medium',
    iconCount: 2, // Medium = 2 bars filled
    courier: 'NZ Couriers'
  },
  {
    id: 'box-l',
    name: 'Large Box',
    dimensions: '500×400×300mm',
    iconType: 'box',
    iconSize: 'large',
    iconCount: 3, // Large = 3 bars filled
    courier: 'NZ Couriers'
  }
];

export const courierBagOptions = [
  {
    id: 'nzc-a4',
    name: 'A4 Satchel',
    dimensions: '325×230mm',
    iconType: 'satchel',
    iconSize: 'small',
    iconCount: 1, // Small = 1 bar filled
    courier: 'NZ Couriers'
  },
  {
    id: 'nzc-a3',
    name: 'A3 Satchel',
    dimensions: '440×320mm',
    iconType: 'satchel',
    iconSize: 'medium',
    iconCount: 2, // Medium = 2 bars filled
    courier: 'NZ Couriers'
  },
  {
    id: 'nzc-a2',
    name: 'A2 Satchel',
    dimensions: '610×460mm',
    iconType: 'satchel',
    iconSize: 'large',
    iconCount: 3, // Large = 3 bars filled
    courier: 'NZ Post'
  }
];

export const palletOptions = [
  {
    id: 'pallet-custom',
    name: 'Custom Freight',
    dimensions: 'Variable',
    iconType: 'pallet',
    iconSize: 'large',
    iconCount: 3, // Custom freight = 3 bars filled (maximum capacity)
    courier: 'Mainfreight',
    requiresWeight: true,
    isCustom: true
  }
];

export const initialTotes = [];