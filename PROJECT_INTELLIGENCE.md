# 🧠 Arrowhead WMS - Project Intelligence Guide

## 🎯 **Core Architecture Patterns**

### State Management Strategy
- **Global State**: `useWarehouse()` for user, orders, XP, achievements
- **Local State**: `useState` for UI components, form data, animations
- **Custom Hooks**: Extract complex logic into reusable hooks
- **Context Pattern**: WarehouseProvider for cross-component communication

### Component Architecture
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Props-Driven**: Highly configurable components with extensive prop interfaces
- **Self-Contained**: Logic stays within components unless shared globally
- **Gamified UI**: Game-like interactions with Framer Motion animations

### Performance Optimization
- **Virtual Scrolling**: For large lists (VirtualStockGrid, VirtualGrid)
- **Debounced Search**: 300ms delay for search inputs
- **Throttled Updates**: Prevent excessive re-renders
- **Memoization**: React.memo, useMemo, useCallback for expensive operations

## 🎮 **Gamification System**

### XP & Leveling
```javascript
// XP Calculation Formula
const calculateXPForNextLevel = (level) => {
  return Math.floor(1000 * Math.pow(1.5, level - 1));
};

// Achievement Rewards
const achievementRewards = {
  'first-pick': 50,
  'speed-demon': 100,
  'accuracy-master': 75,
  'streak-builder': 25
};
```

### Tier System (GameIcon)
- **Brown**: 1-4 items (basic)
- **Blue**: 5-24 items (common)
- **Gold**: 25-49 items (rare)
- **Purple**: 125-249 items (epic)
- **Cosmic**: 250+ items (legendary)

### Sound System
- **Success**: High-pitched success sound
- **Error**: Low-pitched error sound
- **Complete**: Achievement unlock sound
- **Confetti**: Celebration sound

## 🎨 **UI/UX Patterns**

### Animation Standards
```javascript
// Standard Framer Motion variants
const standardVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Page transitions
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};
```

### Color Scheme
- **Primary**: Blue gradients (#3B82F6 to #1D4ED8)
- **Accent**: Green for success (#10B981)
- **Warning**: Orange for alerts (#F59E0B)
- **Error**: Red for errors (#EF4444)
- **Background**: Dark theme (#0F172A to #1E293B)

### Component Styling
- **Glass Cards**: `glass-card` class with backdrop blur
- **Gradients**: Vibrant gradients for buttons and cards
- **Shadows**: Colored shadows matching element colors
- **Rounded Corners**: Consistent 8px-16px border radius

## 🔧 **Development Patterns**

### Error Handling
```javascript
// Standard error boundary pattern
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <ErrorFallback onReset={() => setHasError(false)} />;
  }
  
  return children;
};
```

### Loading States
- **Skeleton Loaders**: For data fetching
- **Spinner Animations**: For async operations
- **Progressive Loading**: Load critical content first

### Form Validation
- **Real-time Validation**: As user types
- **Visual Feedback**: Success/error states
- **Accessibility**: Screen reader support

## 📊 **Data Flow Patterns**

### Order Management
```javascript
// Order lifecycle
const orderStates = {
  pending: 'Available for picking',
  picking: 'Currently being picked',
  picked: 'Ready for packing',
  packing: 'Currently being packed',
  packed: 'Ready for shipping',
  shipped: 'Completed'
};
```

### Inventory Management
- **Stock Levels**: Real-time updates
- **Location Tracking**: Bin assignments
- **Audit Trails**: Complete history tracking

## 🎯 **Performance Metrics**

### User Performance Tracking
- **Pick Time**: Average time per order
- **Accuracy**: Percentage of correct picks
- **Efficiency**: Items per hour
- **Streaks**: Consecutive perfect orders

### System Performance
- **Render Optimization**: Component memoization
- **Bundle Size**: Code splitting strategies
- **Memory Usage**: Cleanup and garbage collection

## 🔄 **Workflow Patterns**

### Picking Workflow
1. **Order Selection**: Priority-based sorting
2. **Picking Process**: Item-by-item verification
3. **Confirmation**: Stats and validation
4. **Print List**: Physical documentation
5. **Transfer to Packing**: Order state update

### Packing Workflow
1. **Order Selection**: From picked orders
2. **Package Selection**: Multiple package types
3. **Quantity Management**: Dynamic cart system
4. **Label Printing**: Shipping documentation
5. **Order Completion**: Final state update

## 🛠 **Technical Debt & Improvements**

### Known Issues
- [ ] Optimize large list rendering
- [ ] Implement proper error boundaries
- [ ] Add comprehensive unit tests
- [ ] Improve accessibility compliance

### Future Enhancements
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] API integration for live data

## 📝 **Code Standards**

### Naming Conventions
- **Components**: PascalCase (OrderCard, PickingScreen)
- **Hooks**: camelCase with 'use' prefix (useWarehouse, useDebounce)
- **Files**: camelCase for components, kebab-case for utilities
- **Constants**: UPPER_SNAKE_CASE for magic numbers

### File Organization
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # Route components
├── utils/         # Utility functions
├── data/          # Static data and mock APIs
├── config/        # Configuration constants
└── styles/        # Global styles and themes
```

### Import Order
1. React and core libraries
2. Third-party libraries
3. Internal components
4. Hooks and utilities
5. Types and constants
6. Styles and assets

This document serves as the central intelligence for understanding and extending the Arrowhead WMS codebase. 