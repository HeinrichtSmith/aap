import React, { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const AnimatedPlaceholder = memo(() => {
  const placeholderTexts = useMemo(() => [
    "Scan item barcode",
    "Ready to scan",
    "Waiting for barcode",
    "Scan to continue"
  ], []);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  const WaveDots = memo(() => (
    <span className="inline-flex ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
          className="inline-block"
        >
          .
        </motion.span>
      ))}
    </span>
  ));

  WaveDots.displayName = 'WaveDots';

  return (
    <motion.span
      key={currentIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 0.9, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="absolute left-[80px] text-3xl text-blue-400 font-bold pointer-events-none flex items-center drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      style={{ top: 'calc(50% - 14px)', transform: 'translateY(-50%)' }}
    >
      {placeholderTexts[currentIndex]}<WaveDots />
    </motion.span>
  );
});

AnimatedPlaceholder.displayName = 'AnimatedPlaceholder';

export default AnimatedPlaceholder;