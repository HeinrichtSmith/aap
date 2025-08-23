import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';

const CustomCursor = () => {
  const { settings } = useSettings();
  
  // Early return if we're on a touch device (custom cursor not needed on touch)
  if ('ontouchstart' in window) {
    return null;
  }
  const [isPointer, setIsPointer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isOverScrollbar, setIsOverScrollbar] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const mousePos = useRef({ x: 0, y: 0 });
  const pointerTimeout = useRef(null);
  const lastPointerState = useRef(false);
  
  // Much snappier spring config - less mass, higher stiffness, lower damping
  const springConfig = { damping: 20, stiffness: 800, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Cache for interactive element detection
  const interactiveCache = useRef(new WeakMap());

  // Optimized interactive element detection
  const checkInteractive = useCallback((element) => {
    if (!element) return false;
    
    // Check cache first
    if (interactiveCache.current.has(element)) {
      return interactiveCache.current.get(element);
    }

    // Quick checks first
    const tagName = element.tagName?.toUpperCase();
    const quickCheck = 
      tagName === 'BUTTON' ||
      tagName === 'A' ||
      tagName === 'INPUT' ||
      tagName === 'SELECT' ||
      tagName === 'TEXTAREA' ||
      element.classList?.contains('cursor-pointer') ||
      element.style?.cursor === 'pointer' ||
      element.getAttribute?.('role') === 'button' ||
      element.onclick !== null;

    if (quickCheck) {
      interactiveCache.current.set(element, true);
      return true;
    }

    // Check parent for cursor-pointer class (common pattern)
    const parent = element.closest?.('.cursor-pointer, [role="button"], button, a');
    const isInteractive = parent !== null;
    
    interactiveCache.current.set(element, isInteractive);
    return isInteractive;
  }, []);

  const updatePointerState = useCallback((newState) => {
    // Clear any pending timeout
    if (pointerTimeout.current) {
      clearTimeout(pointerTimeout.current);
    }

    // If switching from pointer to normal, add a tiny delay
    if (lastPointerState.current && !newState) {
      pointerTimeout.current = setTimeout(() => {
        setIsPointer(false);
        lastPointerState.current = false;
      }, 20); // 20ms delay when leaving interactive elements (reduced from 50ms)
    } else {
      // Immediate update when entering interactive elements
      setIsPointer(newState);
      lastPointerState.current = newState;
    }
  }, []);

  // Function to check if cursor is over scrollbar area
  const checkScrollbarArea = useCallback((e) => {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    for (const element of elements) {
      if (!element) continue;
      
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      // Check if element has scrollbars
      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight && 
        (style.overflowY === 'scroll' || style.overflowY === 'auto');
      const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth && 
        (style.overflowX === 'scroll' || style.overflowX === 'auto');
      
      if (hasVerticalScrollbar || hasHorizontalScrollbar) {
        // Check if cursor is in scrollbar area (right edge for vertical, bottom edge for horizontal)
        const scrollbarWidth = 16; // Slightly larger than CSS to ensure detection
        const isInVerticalScrollbar = hasVerticalScrollbar && 
          e.clientX >= rect.right - scrollbarWidth && e.clientX <= rect.right;
        const isInHorizontalScrollbar = hasHorizontalScrollbar && 
          e.clientY >= rect.bottom - scrollbarWidth && e.clientY <= rect.bottom;
        
        if (isInVerticalScrollbar || isInHorizontalScrollbar) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Expose cursor control globally and manage drag-specific CSS
  useEffect(() => {
    window.customCursor = {
      setDragging: setIsDragging,
      setPointer: setIsPointer,
      setHidden: setIsHidden
    };
    
    return () => {
      delete window.customCursor;
    };
  }, []);

  // Add/remove aggressive cursor hiding during drag operations
  useEffect(() => {
    if (isDragging) {
      // Add aggressive cursor hiding during drag
      const dragStyle = document.createElement('style');
      dragStyle.id = 'custom-cursor-drag-style';
      dragStyle.innerHTML = `
        * { 
          cursor: none !important; 
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        body { cursor: none !important; }
        html { cursor: none !important; }
      `;
      document.head.appendChild(dragStyle);
      
      // Also set cursor directly on elements and add dragging class
      document.body.style.setProperty('cursor', 'none', 'important');
      document.documentElement.style.setProperty('cursor', 'none', 'important');
      document.body.classList.add('custom-cursor-dragging');
      
      return () => {
        // Cleanup when dragging stops
        const existingStyle = document.getElementById('custom-cursor-drag-style');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
        document.body.style.removeProperty('cursor');
        document.documentElement.style.removeProperty('cursor');
        document.body.classList.remove('custom-cursor-dragging');
      };
    }
  }, [isDragging]);

  useEffect(() => {
    // Direct cursor updates for better responsiveness
    const moveCursor = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Check if we're over a scrollbar - hide custom cursor if so
      const overScrollbar = checkScrollbarArea(e);
      if (overScrollbar) {
        setIsHidden(true);
        return;
      } else {
        setIsHidden(false);
      }
      
      // Check if we're over an interactive element for snap behavior
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = target && checkInteractive(target);
      
      if (isInteractive && target) {
        // Get the center of the interactive element for stronger snap
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from cursor to element center
        const distance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + 
          Math.pow(e.clientY - centerY, 2)
        );
        
        // Stronger snap effect - snap to center if within 40px (increased from default)
        const snapRadius = 40;
        const snapStrength = 0.3; // How much to pull towards center (0-1)
        
        if (distance < snapRadius) {
          // Interpolate between actual position and element center
          const snapX = e.clientX + (centerX - e.clientX) * snapStrength;
          const snapY = e.clientY + (centerY - e.clientY) * snapStrength;
          
          cursorX.set(snapX);
          cursorY.set(snapY);
        } else {
          // Normal cursor movement
          cursorX.set(e.clientX);
          cursorY.set(e.clientY);
        }
      } else {
        // Normal cursor movement when not over interactive element
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    };

    const handleMouseOver = (e) => {
      // Don't change pointer state when dragging
      if (!isDragging) {
        const isInteractive = checkInteractive(e.target);
        updatePointerState(isInteractive);
      }
    };
    
    const handleMouseOut = () => {
      // Don't change pointer state when dragging
      if (!isDragging) {
        updatePointerState(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHidden(true);
    };

    const handleMouseEnter = () => {
      setIsHidden(false);
    };


    // Add event listeners
    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    // Hide default cursor but allow scrollbar cursors to work normally
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.innerHTML = `
      * { cursor: none !important; }
      *:hover { cursor: none !important; }
      *:active { cursor: none !important; }
      *:focus { cursor: none !important; }
      /* Force hide cursor during drag operations */
      [data-draggable="true"] { cursor: none !important; }
      [data-draggable="true"]:hover { cursor: none !important; }
      [data-draggable="true"]:active { cursor: none !important; }
      .dragging-active { cursor: none !important; }
      .dragging-active * { cursor: none !important; }
      .custom-cursor-dragging * { cursor: none !important; }
      .custom-cursor-dragging { cursor: none !important; }
      /* Allow default cursor on scrollbars */
      ::-webkit-scrollbar { cursor: auto !important; }
      ::-webkit-scrollbar-track { cursor: auto !important; }
      ::-webkit-scrollbar-thumb { cursor: auto !important; }
      ::-webkit-scrollbar-thumb:hover { cursor: auto !important; }
      ::-webkit-scrollbar-thumb:active { cursor: auto !important; }
      ::-webkit-scrollbar-corner { cursor: auto !important; }
      ::-webkit-scrollbar-button { cursor: auto !important; }
    `;
    document.head.appendChild(style);

    return () => {
      if (pointerTimeout.current) {
        clearTimeout(pointerTimeout.current);
      }
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
      document.head.removeChild(style);
    };
  }, [checkInteractive, updatePointerState, cursorX, cursorY, checkScrollbarArea]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[10001] will-change-transform"
      style={{
        x: settings?.showAnimations ? cursorXSpring : cursorX,
        y: settings?.showAnimations ? cursorYSpring : cursorY,
        opacity: isHidden ? 0 : 1
      }}
    >
      {isDragging ? (
        // Grabbing cursor - for dragging operations
        <motion.svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          animate={settings?.showAnimations ? { scale: 1.1, rotate: [0, -2, 2, 0] } : {}}
          transition={settings?.showAnimations ? { 
            scale: { type: "spring", stiffness: 400, damping: 15 },
            rotate: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
          } : {}}
          style={{ 
            filter: 'drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.4))'
          }}
        >
          {/* Closed fist/grabbing hand */}
          <path
            d="M18 5 L18 14 L16 14 L16 6 Q16 5 14.5 5 Q13 5 13 6 L13 15 
                L11 15 L11 7 Q11 6 9.5 6 Q8 6 8 7 L8 15 Q8 17 9 19 
                L14.5 25 Q16 26 18.5 26 L23.5 26 Q27 26 29 24 
                Q31 22 31 19 L31 12 Q31 10.5 29 10.5 Q27 10.5 27 12 
                L27 14 L25 14 L25 10.5 Q25 9 23 9 Q21 9 21 10.5 
                L21 14 L20 14 L20 6 Q20 5 18.5 5 Q18 5 18 6 Z
                M13 16 Q12 16 11 17 Q10 18 10 19 L10 15 Q10 14 11.5 14 Q13 14 13 15
                M8 16 Q7 16 6 17 Q5 18 5 19 L5 15 Q5 14 6.5 14 Q8 14 8 15"
            fill="#a855f7"
            stroke="#9333ea"
            strokeWidth="0.8"
          />
          {/* Grip lines for more "grabbing" effect */}
          <path
            d="M12 18 L12 20 M15 18 L15 20 M18 18 L18 20 M21 18 L21 20"
            stroke="#9333ea"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </motion.svg>
      ) : !isPointer ? (
        // Arrow cursor - slightly larger
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          style={{ 
            filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))'
          }}
        >
          <path
            d="M4 4 L28 15 L16 16 L15 28 Z"
            fill="#60a5fa"
            stroke="#2563eb"
            strokeWidth="0.5"
          />
        </svg>
      ) : (
        // Hand pointer cursor - slightly larger
        <motion.svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          animate={settings?.showAnimations ? { scale: 1.05 } : {}}
          transition={settings?.showAnimations ? { type: "spring", stiffness: 300, damping: 20 } : {}}
          style={{ 
            filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))'
          }}
        >
          <path
            d="M15 7 L15 16 L13 16 L13 8 Q13 7 11.5 7 Q10 7 10 8 L10 17 
                L8 17 L8 9 Q8 8 6.5 8 Q5 8 5 9 L5 17 Q5 19 6 21 
                L11.5 27 Q13 28 15.5 28 L20.5 28 Q24 28 26 26 
                Q28 24 28 21 L28 14 Q28 12.5 26 12.5 Q24 12.5 24 14 
                L24 16 L22 16 L22 12.5 Q22 11 20 11 Q18 11 18 12.5 
                L18 16 L17 16 L17 8 Q17 7 15.5 7 Q15 7 15 8 Z"
            fill="#60a5fa"
            stroke="#2563eb"
            strokeWidth="0.5"
          />
        </motion.svg>
      )}
    </motion.div>
  );
};

export default CustomCursor;