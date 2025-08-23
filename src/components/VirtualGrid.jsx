import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const VirtualGrid = ({ 
  items, 
  renderItem, 
  itemHeight = 200, 
  containerHeight = 600,
  itemsPerRow = 3,
  gap = 16,
  rowGap = null, // Optional separate row gap
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  // Calculate dimensions
  const itemWidth = useMemo(() => {
    return `calc((100% - ${gap * (itemsPerRow - 1)}px - 32px) / ${itemsPerRow})`;
  }, [gap, itemsPerRow]);
  
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const verticalGap = rowGap !== null ? rowGap : gap;
  const totalHeight = totalRows * (itemHeight + verticalGap) - verticalGap + 100; // Add extra buffer for bottom items
  
  // Calculate visible range
  const visibleItems = useMemo(() => {
    const adjustedScrollTop = Math.max(0, scrollTop - 16);
    const startRow = Math.floor(adjustedScrollTop / (itemHeight + verticalGap));
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((adjustedScrollTop + containerHeight - 64) / (itemHeight + verticalGap))
    );
    
    const visibleStartRow = Math.max(0, startRow - overscan);
    const visibleEndRow = Math.min(totalRows - 1, endRow + overscan);
    
    const visibleItems = [];
    
    for (let row = visibleStartRow; row <= visibleEndRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemIndex = row * itemsPerRow + col;
        if (itemIndex < items.length) {
          visibleItems.push({
            index: itemIndex,
            item: items[itemIndex],
            row,
            col,
            top: row * (itemHeight + verticalGap) + 16,
            left: `calc(16px + ${col * (100 / itemsPerRow)}%)`,
            width: itemWidth
          });
        }
      }
    }
    
    return visibleItems;
  }, [items, scrollTop, containerHeight, itemHeight, gap, itemsPerRow, overscan, totalRows, itemWidth, verticalGap]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  // Handle scroll events with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let ticking = false;
    
    const throttledScroll = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll(e);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    container.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', throttledScroll);
    };
  }, [handleScroll]);
  
  return (
    <div
      ref={containerRef}
      className="overflow-auto h-full"
      style={{ height: containerHeight || '100%' }}
      data-scroll-container
    >
      <div
        className="relative pt-4 pb-16 px-4"
        style={{ height: totalHeight + 80 }}
      >
        {visibleItems.map(({ index, item, top, left, width }) => (
          <div
            key={item.id || index}
            className="absolute"
            style={{
              top: `${top}px`,
              left,
              width,
              height: `${itemHeight}px`,
              padding: gap / 2 + 'px'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualGrid;