import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle, AlertCircle } from 'lucide-react';

const ScanInput = forwardRef(({ onScan, placeholder = "Scan or enter barcode...", autoFocus = true, onValidationResult = null }, ref) => {
  const [value, setValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    clear: () => {
      setValue('');
    },
    getValue: () => value
  }), [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleScan = (scanValue) => {
    setScanning(true);
    setTimeout(() => {
      onScan(scanValue);
      
      if (onValidationResult) {
        const isValid = onValidationResult(scanValue);
        setResult(isValid ? 'success' : 'error');
      } else {
        setResult(null);
      }

      setScanning(false);
      
      setTimeout(() => {
        setResult(null);
        setValue('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      handleScan(value.trim());
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value.toUpperCase();
    setValue(newValue);
    
    if (newValue.length >= 8 && /^[A-Z0-9-]+$/.test(newValue)) {
      setTimeout(() => {
        if (value === newValue && newValue.trim()) {
          handleScan(newValue.trim());
        }
      }, 50);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <ScanLine className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
          scanning ? 'text-blue-500 animate-pulse' : result === 'error' ? 'text-red-400' : 'text-blue-400'
        }`} size={20} />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white transition-all ${
            scanning ? 'border-blue-500 bg-blue-500/10' : ''
          } ${
            result === 'error' ? 'border-red-500 bg-red-500/10' : result === 'success' ? 'border-green-500 bg-green-500/10' : 'border-blue-500/30'
          }`}
          disabled={scanning}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        
        {scanning && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!scanning && !result && (
          <motion.div
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
          </motion.div>
        )}

        {result && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {result === 'success' ? (
              <CheckCircle className="text-green-500" size={32} />
            ) : (
              <AlertCircle className="text-red-500" size={24} />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ScanInput.displayName = 'ScanInput';

export default ScanInput;