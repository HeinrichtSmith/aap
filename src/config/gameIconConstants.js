import BoxIcon from '../components/icons/BoxIcon';
import SatchelIcon from '../components/icons/SatchelIcon';
import PalletIcon from '../components/icons/PalletIcon';
import CartonIcon from '../components/icons/CartonIcon';
import LargeItemIcon from '../components/icons/LargeItemIcon';
import CameraIcon from '../components/icons/CameraIcon';
import SwitchIcon from '../components/icons/SwitchIcon';
import TouchKitIcon from '../components/icons/TouchKitIcon';
import OrderIcon from '../components/icons/OrderIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import ActivityIcon from '../components/icons/ActivityIcon';
import PIRIcon from '../components/icons/PIRIcon';
import ControlPanelIcon from '../components/icons/ControlPanelIcon';
import KeypadIcon from '../components/icons/KeypadIcon';
import SirenIcon from '../components/icons/SirenIcon';
import DoorContactIcon from '../components/icons/DoorContactIcon';
import SmokeDetectorIcon from '../components/icons/SmokeDetectorIcon';
import PanicButtonIcon from '../components/icons/PanicButtonIcon';
import VanIcon from '../components/icons/VanIcon';
import CheckIcon from '../components/icons/CheckIcon';
import HandPinchIcon from '../components/icons/HandPinchIcon';

// Size multipliers based on iconSize prop
export const sizeMultipliers = {
  small: 0.7,
  medium: 1.0,
  large: 1.3
};

// Determine tier style
export const getTierStyle = (boxType) => {
  switch(boxType) {
    case 'cosmic':
      return {
        gradient: 'from-purple-400 via-pink-500 to-cyan-400',
        glowColor: 'rgba(34, 211, 238, 0.9)',
        badgeColor: 'from-purple-600 via-pink-600 to-cyan-600',
        animate: true,
        holographic: true
      };
    case 'mega':
      return {
        gradient: 'from-purple-400 via-pink-500 to-red-500',
        glowColor: 'rgba(236, 72, 153, 0.7)',
        badgeColor: 'from-purple-600 via-pink-600 to-red-600',
        animate: true
      };
    case 'super':
      return {
        gradient: 'from-orange-400 to-orange-600',
        glowColor: 'rgba(251, 146, 60, 0.6)',
        badgeColor: 'from-orange-500 to-orange-700'
      };
    case 'standard':
      return {
        gradient: 'from-blue-400 to-blue-600',
        glowColor: 'rgba(59, 130, 246, 0.5)',
        badgeColor: 'from-blue-500 to-blue-700'
      };
    default:
      return {
        gradient: 'from-gray-400 to-gray-600',
        glowColor: 'rgba(107, 114, 128, 0.3)',
        badgeColor: 'from-gray-600 to-gray-700'
      };
  }
};

export const getItemIconType = (itemName = '', sku = '', context = 'default') => {
  const name = itemName.toLowerCase();
  const skuLower = sku.toLowerCase();
  
  // Dashboard-specific contexts
  if (context === 'order' || context === 'sales_order') {
    return 'order';
  }
  
  if (context === 'user_level' || context === 'achievement' || context === 'trophy') {
    return 'trophy';
  }
  
  if (context === 'activity' || context === 'live_activity') {
    return 'activity';
  }
  
  // Specific Security Equipment
  
  // PIR Motion Sensors
  if (name.includes('pir') || name.includes('motion') || name.includes('sensor') ||
      skuLower.includes('sens') || skuLower.includes('pir')) {
    return 'pir';
  }
  
  // Sirens
  if (name.includes('siren') || name.includes('alarm') || name.includes('outdoor siren') ||
      skuLower.includes('siren')) {
    return 'siren';
  }
  
  // Control Panels
  if (name.includes('control panel') || name.includes('smart control') || name.includes('alarm panel') ||
      skuLower.includes('ctrl') || skuLower.includes('control')) {
    return 'controlPanel';
  }
  
  // Door Contacts
  if (name.includes('door contact') || name.includes('magnetic') || name.includes('door sensor') ||
      name.includes('window contact') || skuLower.includes('door')) {
    return 'doorContact';
  }
  
  // Keypads
  if (name.includes('keypad') || name.includes('lcd keypad') || name.includes('proximity reader') ||
      skuLower.includes('key') || skuLower.includes('keypad')) {
    return 'keypad';
  }
  
  // Smoke Detectors
  if (name.includes('smoke') || name.includes('detector') || name.includes('photoelectric') ||
      skuLower.includes('smoke')) {
    return 'smokeDetector';
  }
  
  // Cameras
  if (name.includes('camera') || name.includes('dome') || name.includes('security camera') || 
      name.includes('cctv') || name.includes('surveillance') || 
      skuLower.includes('cam') || skuLower.includes('dome')) {
    return 'camera';
  }
  
  // Panic Buttons
  if (name.includes('panic') || name.includes('emergency') || name.includes('panic button') ||
      skuLower.includes('panic')) {
    return 'panicButton';
  }
  
  // Network Equipment
  if (name.includes('switch') || name.includes('network') || name.includes('ethernet') || 
      name.includes('router') || name.includes('hub') || name.includes('poe') ||
      skuLower.includes('switch') || skuLower.includes('sw') || skuLower.includes('net')) {
    return 'switch';
  }
  
  // Touch/Interface Equipment
  if (name.includes('touch') || name.includes('kit') || name.includes('interface') || 
      name.includes('panel') || name.includes('display') ||
      skuLower.includes('ec-kit') || skuLower.includes('touch') || skuLower.includes('kit')) {
    return 'touchKit';
  }
  
  // Physical size-based icons
  if (name.includes('pallet') || name.includes('skid') || name.includes('platform')) {
    return 'pallet';
  }
  
  if (name.includes('large') || name.includes('bulk') || name.includes('oversized') || 
      name.includes('heavy')) {
    return 'largeItem';
  }
  
  if (name.includes('satchel') || name.includes('bag') || name.includes('pouch')) {
    return 'satchel';
  }
  
  if (name.includes('carton') || name.includes('cardboard')) {
    return 'carton';
  }
  
  if (name.includes('box') || name.includes('package') || name.includes('container')) {
    return 'box';
  }
  
  // Default fallback
  return 'box';
};

// Map icon types to components
export const iconComponents = {
  box: BoxIcon,
  satchel: SatchelIcon,
  pallet: PalletIcon,
  carton: CartonIcon,
  largeItem: LargeItemIcon,
  camera: CameraIcon,
  switch: SwitchIcon,
  touchKit: TouchKitIcon,
  order: OrderIcon,
  trophy: TrophyIcon,
  activity: ActivityIcon,
  pir: PIRIcon,
  controlPanel: ControlPanelIcon,
  keypad: KeypadIcon,
  siren: SirenIcon,
  doorContact: DoorContactIcon,
  smokeDetector: SmokeDetectorIcon,
  panicButton: PanicButtonIcon,
  van: VanIcon,
  check: CheckIcon,
  handPinch: HandPinchIcon,
}; 