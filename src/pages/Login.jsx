import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Package, 
  Mail, 
  Lock, 
  AlertCircle, 
  Crown, 
  Truck, 
  PackageSearch,
  Settings,
  User,
  Star,
  Zap
} from 'lucide-react';
import { useWarehouse } from '../hooks/useWarehouseContext';
import ParticleEffect from '../components/ParticleEffect';

const Login = () => {
  const { login } = useWarehouse();
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  
  // Animation state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Refs
  const backgroundRef = useRef(null);
  const formRef = useRef(null);

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      const success = await login(email, password);
      if (!success) {
        throw new Error('Invalid credentials. Please try again.');
      }
      
      setLoginSuccess(true);
      
      // The navigation is now handled by the login function in useWarehouseContext
      // Just show success animation
      setTimeout(() => {
        setLoginSuccess(false);
        setEmail('');
        setPassword('');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { 
      email: 'admin@arrowhead.co.nz', 
      password: 'admin123', 
      role: 'Admin', 
      name: 'Heinrich Smith',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      description: 'Full system access'
    },
    { 
      email: 'picker@arrowhead.co.nz', 
      password: 'picker123', 
      role: 'Picker', 
      name: 'David Johnson',
      icon: PackageSearch,
      color: 'from-blue-500 to-cyan-500',
      description: 'Order picking specialist'
    },
    { 
      email: 'packer@arrowhead.co.nz', 
      password: 'packer123', 
      role: 'Packer', 
      name: 'Lois Williams',
      icon: Truck,
      color: 'from-green-500 to-emerald-500',
      description: 'Packing & shipping expert'
    }
  ];

  const quickLogin = (account) => {
    setError('');
    setSelectedProfile(account);
    
    // Animate credentials flying into form
    setTimeout(() => {
      setEmail(account.email);
      setEmailFocused(true);
    }, 300);
    
    setTimeout(() => {
      setPassword(account.password);
      setPasswordFocused(true);
    }, 600);
    
    setTimeout(() => {
      setEmailFocused(false);
      setPasswordFocused(false);
      setSelectedProfile(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 overflow-hidden relative">
      <ParticleEffect />
      {/* Dynamic Interactive Background */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(59, 130, 246, 0.15) 0%, 
              transparent 50%),
            radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, 
              rgba(14, 165, 233, 0.1) 0%, 
              transparent 50%),
            linear-gradient(45deg, 
              rgba(139, 92, 246, 0.05) 0%, 
              transparent 25%, 
              rgba(236, 72, 153, 0.05) 50%, 
              transparent 75%, 
              rgba(14, 165, 233, 0.05) 100%)
          `
        }}
      />
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-full blur-xl"
        />
      </div>

      <AnimatePresence mode="wait">
        {loginSuccess ? (
          <SuccessAnimation />
        ) : (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              x: shakeError ? [-10, 10, -10, 10, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: shakeError ? 0.5 : 0.6,
              ease: "easeOut"
            }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20,
                  delay: 0.2
                }}
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/25"
              >
                <Package size={40} className="text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-white mb-2 tracking-tight"
              >
                                  Arrowhead Polaris
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 font-medium"
              >
                Welcome back! Please login to continue.
              </motion.p>
            </div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubmit}
              className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
                >
                  <p className="text-red-400 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                  </p>
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Email Input */}
                <FloatingLabelInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  focused={emailFocused}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  icon={Mail}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />

                {/* Password Input */}
                <FloatingLabelInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  focused={passwordFocused}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  icon={Lock}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {loading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <div className="relative z-10">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </div>
                </motion.button>
              </div>
            </motion.form>

            {/* Character Profiles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 bg-gray-900/30 backdrop-blur p-6 rounded-xl border border-gray-800"
            >
              <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center">
                <Star size={16} className="mr-2" />
                Demo Characters
              </h3>
              <div className="space-y-3">
                {demoAccounts.map((account) => (
                  <CharacterProfile
                    key={account.email}
                    account={account}
                    isSelected={selectedProfile?.email === account.email}
                    onClick={() => quickLogin(account)}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Floating Label Input Component
const FloatingLabelInput = ({ 
  label, 
  type, 
  value, 
  onChange, 
  focused, 
  onFocus, 
  onBlur, 
  icon: Icon, 
  placeholder, 
  disabled, 
  required 
}) => {
  const hasValue = value.length > 0;
  const shouldFloat = focused || hasValue;

  return (
    <div className="relative">
      <motion.label
        animate={{
          y: shouldFloat ? -10 : 12,
          scale: shouldFloat ? 0.85 : 1,
          color: focused ? '#3b82f6' : '#9ca3af'
        }}
        transition={{ duration: 0.2 }}
        className="absolute left-12 font-medium pointer-events-none origin-left z-10"
      >
        {label}
      </motion.label>
      
      <div className="relative">
        <motion.div
          animate={{
            rotate: focused ? [0, 10, 0] : 0,
            scale: focused ? [1, 1.1, 1] : 1,
            color: focused ? '#3b82f6' : '#9ca3af'
          }}
          transition={{ duration: 0.3 }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
        >
          <Icon size={20} />
        </motion.div>
        
        <motion.input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-transparent focus:outline-none focus:border-blue-500 focus:bg-gray-800 transition-all ${
            shouldFloat ? 'pt-6 pb-2' : ''
          }`}
          placeholder={focused ? placeholder : ''}
          required={required}
          disabled={disabled}
          animate={{
            borderColor: focused ? '#3b82f6' : '#374151'
          }}
        />
      </div>
    </div>
  );
};

// Character Profile Component
const CharacterProfile = ({ account, isSelected, onClick }) => {
  const IconComponent = account.icon;
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isSelected ? [1, 1.05, 1] : 1,
        boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.3)' : '0 0 0px rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.3 }}
      className={`w-full text-left p-4 rounded-xl transition-all group relative overflow-hidden ${
        isSelected ? 'bg-blue-500/20 border border-blue-500/50' : 'hover:bg-gray-800/50 border border-transparent'
      }`}
    >
      {/* Animated Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${account.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        animate={{
          opacity: isSelected ? 0.15 : 0
        }}
      />
      
      <div className="relative z-10 flex items-center space-x-4">
        {/* Character Avatar */}
        <motion.div
          animate={{
            rotate: isSelected ? [0, 360] : 0
          }}
          transition={{ duration: 0.8 }}
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${account.color} flex items-center justify-center shadow-lg`}
        >
          <IconComponent size={24} className="text-white" />
        </motion.div>
        
        {/* Character Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-bold text-gray-200 group-hover:text-white">
              {account.name}
            </p>
            <motion.div
              animate={{
                scale: isSelected ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5 }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500 font-medium">{account.role}</p>
          <p className="text-xs text-gray-600 mt-1">{account.description}</p>
        </div>
        
        {/* Animated Credentials */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-xs text-blue-400 font-mono"
            >
              <div>📧 {account.email}</div>
              <div>🔑 {account.password}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Flying Animation Effect */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: 0, 
              scale: 0.5,
              x: [0, -200, -400],
              y: [0, -50, -100]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute top-4 right-4 text-xs text-blue-400 font-mono pointer-events-none"
          >
            ✨ Flying to form...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Success Animation Component
const SuccessAnimation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          delay: 0.2
        }}
        className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/25"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Package size={48} className="text-white" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
        <p className="text-gray-400">Taking you to your dashboard...</p>
      </motion.div>
      
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 400 - 200],
              y: [0, Math.random() * 300 - 150]
            }}
            transition={{ 
              duration: 2,
              delay: 0.8 + i * 0.1,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Login;