import React, { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion } from 'framer-motion';

const VirtualStockGrid = memo(({ 
  items, 
  viewMode = 'grid', 
  onItemClick, 
  onQuickAdjust,
  containerHeight = 600,
  StockItemCard
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  // Calculate responsive columns and dimensions
  const { columnCount, columnWidth, rowHeight } = useMemo(() => {
    const baseWidth = 320; // minimum card width
    const gap = 24; // gap between cards
    const padding = 48; // container padding
    
    let availableWidth = containerWidth - padding;
    let columns = Math.max(1, Math.floor(availableWidth / (baseWidth + gap)));
    
    // Responsive breakpoints
    if (availableWidth >= 1600) columns = Math.min(columns, 5);
    else if (availableWidth >= 1200) columns = Math.min(columns, 4);
    else if (availableWidth >= 900) columns = Math.min(columns, 3);
    else if (availableWidth >= 600) columns = Math.min(columns, 2);
    else columns = 1;
    
    const actualColumnWidth = Math.floor((availableWidth - (gap * (columns - 1))) / columns);
    const actualRowHeight = viewMode === 'list' ? 120 : 380;
    
    return {
      columnCount: columns,
      columnWidth: actualColumnWidth,
      rowHeight: actualRowHeight
    };
  }, [containerWidth, viewMode]);

  // Calculate row count
  const rowCount = Math.ceil(items.length / columnCount);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      handleResize(); // Initial measurement
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Memoized cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const item = items[index];
    
    if (!item) return <div style={style} />;
    
    const adjustedStyle = {
      ...style,
      padding: '12px',
      left: style.left + 12,
      top: style.top + 12,
      width: style.width - 24,
      height: style.height - 24,
    };
    
    return (
      <div style={adjustedStyle}>
        <StockItemCard
          item={item}
          index={index}
          viewMode={viewMode}
          onClick={() => onItemClick(item)}
          onQuickAdjust={(adjustment) => onQuickAdjust(item, adjustment)}
        />
      </div>
    );
  }, [items, columnCount, viewMode, onItemClick, onQuickAdjust, StockItemCard]);

  // Show loading state while measuring
  if (containerWidth === 0) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: containerHeight }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={containerWidth}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 #1f2937'
        }}
        className="custom-scrollbar"
      >
        {Cell}
      </Grid>
    </div>
  );
});

VirtualStockGrid.displayName = 'VirtualStockGrid';

export default VirtualStockGrid;