# Comprehensive Prompt for Creating a Picking Page

## 🎯 Mission
Create a comprehensive picking page for the Arrowhead Polaris that follows the exact same principles, patterns, and assets as the existing packing system. The picking page should provide a gamified, audio-enhanced, warehouse picking experience with the same visual style and user experience patterns.

## 🏗️ Architecture Requirements

### File Structure
Create these files following the existing patterns:
```
src/
├── pages/
│   └── Picking.jsx                    # Main picking page (like Packing.jsx)
├── components/
│   └── picking/                       # New picking-specific components
│       ├── OrderSelectionScreen.jsx   # Like ToteSelectionScreen.jsx
│       ├── PickingScreen.jsx          # Like PackingScreen.jsx
│       ├── PickingTimer.jsx           # Like PackingTimer.jsx
│       └── PickingConfirmation.jsx    # Like ConfirmationScreen.jsx
└── data/
    └── pickingData.jsx                # Like packingData.jsx
```

### Core Technologies & Patterns
- **React 18+** with Functional Components and Hooks
- **Framer Motion** for ALL animations (page transitions, micro-interactions)
- **Tailwind CSS** for styling (dark theme, gradients, responsive)
- **Audio System** integration with `playSound()` from `utils/audio`
- **GameIcon** components for visual representation
- **Scan Input** for barcode scanning workflow
- **Error Boundaries** and graceful error handling

## 🎮 UI/UX Requirements

### Visual Style
- **Dark Theme**: Use `bg-gray-950`, `bg-gray-900/50` backgrounds
- **Gamified Interface**: Vibrant colors, juicy animations, game-like feedback
- **Chunky Elements**: Large buttons, rounded corners, satisfying hover effects
- **Audio Feedback**: Success, error, combo, complete sounds for all interactions

### Animation Patterns
```javascript
// Use these Framer Motion patterns consistently
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
  whileHover={{ scale: 1.05 }}
>
```

### Audio Integration
```javascript
// Always use this pattern for audio
import { playSound, initializeAudio, isAudioInitialized } from '../../utils/audio';

// Initialize audio on user interaction
useEffect(() => {
  const handleInteraction = async (e) => {
    if (isAudioInitialized()) return;
    await initializeAudio();
    document.removeEventListener('click', handleInteraction);
  };
  
  if (!isAudioInitialized()) {
    document.addEventListener('click', handleInteraction);
  }
}, []);
```

## 📋 Component Specifications

### 1. Picking.jsx (Main Page)
**Location**: `src/pages/Picking.jsx`
**Pattern**: Follow `src/pages/Packing.jsx` exactly

**Features**:
- Multi-screen workflow: Order Selection → Picking → Confirmation
- State management for current screen, selected order, picking time, stats
- Audio initialization and sound feedback
- Error boundary integration
- Animated background support

**State Management**:
```javascript
const [currentScreen, setCurrentScreen] = useState('orderSelection');
const [selectedOrder, setSelectedOrder] = useState(null);
const [pickingTime, setPickingTime] = useState(null);
const [pickingStats, setPickingStats] = useState(null);
const [startTime, setStartTime] = useState(null);
const [scannedItems, setScannedItems] = useState([]);
```

### 2. OrderSelectionScreen.jsx
**Location**: `src/components/picking/OrderSelectionScreen.jsx`
**Pattern**: Follow `src/components/packing/ToteSelectionScreen.jsx` exactly

**Features**:
- Display list of orders to pick with GameIcon representations
- Scan-to-select functionality (scan order number)
- Priority badges (urgent, overnight, normal)
- Search functionality
- Audio feedback for selection
- Visual highlighting and animations

**Data Structure** (create in `pickingData.jsx`):
```javascript
export const initialOrders = [
  { 
    id: 'ORDER-001', 
    orderId: 'SO5342', 
    priority: 'overnight', 
    customer: 'Auckland Security Systems', 
    dueDate: '2025-01-07T09:30:00',
    items: [
      { id: '9421234567890', name: 'PIR Motion Sensor', quantity: 2, binLocation: 'A-01-03' }, 
      { id: '9421234567894', name: 'LCD Keypad', quantity: 1, binLocation: 'A-02-15' }
    ],
    totalItems: 3,
    estimatedTime: 180 // seconds
  }
];
```

### 3. PickingScreen.jsx
**Location**: `src/components/picking/PickingScreen.jsx`
**Pattern**: Follow `src/components/packing/PackingScreen.jsx` exactly

**Features**:
- Item-by-item picking workflow
- Scan validation against order items
- Progress tracking with visual feedback
- Combo system for consecutive correct picks
- Timer integration
- Error handling for invalid scans
- Quantity management (pick multiple of same item)
- Visual item cards with GameIcon representations

**Key Functions**:
```javascript
const handleItemScan = (scannedSKU) => {
  // Validate scan against order items
  // Update progress
  // Handle combos
  // Play audio feedback
  // Update visual state
};

const handleItemClick = (itemId) => {
  // Select item for picking
  // Visual feedback
  // Audio feedback
};
```

### 4. PickingTimer.jsx
**Location**: `src/components/picking/PickingTimer.jsx`
**Pattern**: Follow `src/components/PackingTimer.jsx` exactly

**Features**:
- Countdown timer for picking session
- Visual progress ring
- Audio feedback for time milestones
- Pause/resume functionality
- Integration with picking stats

### 5. PickingConfirmation.jsx
**Location**: `src/components/picking/PickingConfirmation.jsx`
**Pattern**: Follow `src/components/packing/ConfirmationScreen.jsx` exactly

**Features**:
- Summary of picked items
- Time taken
- Performance metrics
- XP rewards
- Achievement unlocks
- Print picking list option
- Return to order selection

## 🎯 Game Mechanics Integration

### XP & Achievement System
- **XP Rewards**: Base XP for completion, bonus for speed, combo bonuses
- **Achievements**: Perfect picks, speed records, combo streaks
- **Visual Feedback**: XP bars, level-up animations, achievement badges

### Combo System
- **Consecutive Correct Picks**: Build combo multiplier
- **Visual Feedback**: Combo counter, animations
- **Audio Feedback**: Combo sounds, streak sounds
- **Bonus XP**: Higher combos = more XP

### Progress Tracking
- **Visual Progress**: Progress bars, item completion indicators
- **Real-time Updates**: Live progress updates
- **Completion Celebration**: Confetti, sounds, animations

## 🎨 Visual Design Requirements

### Color Palette
- **Primary**: `#3b82f6` (Blue)
- **Secondary**: `#1e40af` (Dark Blue)
- **Accent**: `#60a5fa` (Light Blue)
- **Success**: Green variants
- **Error**: Red variants
- **Warning**: Yellow/Orange variants

### GameIcon Integration
Use the existing GameIcon system with proper icon type mapping:
```javascript
const getItemIconType = (item) => {
  // Use the same logic as in ToteSelectionScreen.jsx
  // Map items to appropriate icon types (pir, siren, camera, etc.)
};
```

### Responsive Design
- **Mobile-First**: Touch-friendly interface
- **Tablet Support**: Optimized for warehouse tablets
- **Desktop Support**: Full-featured desktop experience

## 🔊 Audio System Integration

### Sound Types
- **success**: Correct item picked
- **error**: Invalid scan, wrong item
- **combo**: Combo milestone reached
- **complete**: Order fully picked
- **click**: Button interactions
- **hover**: Hover effects
- **tick**: Timer ticks
- **confetti**: Completion celebration

### Audio Patterns
```javascript
// Success feedback
playSound('success');

// Error feedback
playSound('error');

// Combo feedback
if (combo > 0 && combo % 5 === 0) {
  playSound('combo');
}

// Completion feedback
playSound('complete');
```

## 📊 Data Management

### Order Data Structure
```javascript
{
  id: 'ORDER-001',
  orderId: 'SO5342',
  priority: 'overnight',
  customer: 'Auckland Security Systems',
  dueDate: '2025-01-07T09:30:00',
  items: [
    {
      id: '9421234567890',
      name: 'PIR Motion Sensor',
      quantity: 2,
      binLocation: 'A-01-03',
      pickedQuantity: 0
    }
  ],
  totalItems: 3,
  pickedItems: 0,
  estimatedTime: 180
}
```

### Progress Tracking
- **Individual Item Progress**: Track picked vs required quantities
- **Overall Order Progress**: Track completion percentage
- **Time Tracking**: Elapsed time vs estimated time
- **Accuracy Tracking**: Correct picks vs errors

## 🔧 Error Handling & Validation

### Scan Validation
```javascript
const validateScan = (scannedSKU) => {
  const item = order.items.find(i => i.id === scannedSKU);
  if (!item) return false;
  
  const pickedCount = pickedItems.filter(id => id === scannedSKU).length;
  if (pickedCount >= item.quantity) return false;
  
  return true;
};
```

### Error Feedback
- **Invalid Item**: Clear error message with audio
- **Already Picked**: Inform user item is complete
- **Wrong Order**: Redirect to correct order
- **Network Errors**: Graceful degradation

## 🎮 User Experience Flow

### 1. Order Selection
- User sees list of orders to pick
- Can scan order number or click to select
- Visual priority indicators
- Search functionality
- Audio feedback for selection

### 2. Picking Process
- User scans items one by one
- Visual confirmation for each pick
- Progress tracking
- Combo system for consecutive correct picks
- Timer running in background
- Error handling for invalid scans

### 3. Completion
- Summary of picked items
- Time taken vs estimated
- Performance metrics
- XP rewards
- Achievement unlocks
- Option to print picking list

## 📱 Responsive Patterns

### Mobile Layout
```javascript
className="w-full md:w-1/2 lg:w-1/3"
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"
```

### Touch Interactions
- **Large Touch Targets**: Minimum 44px
- **Swipe Gestures**: Support for swipe navigation
- **Tap Feedback**: Visual and audio feedback for taps

## 🚀 Performance Requirements

### Optimization
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Lazy Loading**: Code splitting for large components
- **Bundle Size**: Keep dependencies minimal
- **Rendering**: Avoid unnecessary re-renders

### Audio Performance
- **Lazy Initialization**: Audio only initializes after user interaction
- **Graceful Degradation**: App works without audio
- **Memory Management**: Proper cleanup of audio resources

## 🎯 Quality Standards

### Code Quality
- **Clean Code**: Readable, well-structured TypeScript/JavaScript
- **Error Handling**: Comprehensive error boundaries
- **Accessibility**: Keyboard navigation, screen reader support
- **Documentation**: Clear comments and JSDoc

### User Experience Quality
- **Responsiveness**: Fast, smooth interactions
- **Reliability**: Consistent behavior across devices
- **Accessibility**: Inclusive design for all users
- **Usability**: Intuitive and efficient workflows

## 🎮 Remember: This is a Game-Like Platform

Every interaction should feel satisfying and rewarding. The goal is to make warehouse picking feel less like work and more like an engaging game, while maintaining the efficiency and accuracy required for real warehouse operations.

The picking page should feel like a natural extension of the packing system, with the same visual style, audio feedback, and gamified experience that makes warehouse work enjoyable and efficient. 