import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Reveal from 'reveal.js';
import { 
  X, Play, ChevronRight, ChevronLeft, Package, TrendingUp, Users, Zap, Globe, 
  ArrowRight, Clock, AlertCircle, CheckCircle, Target, DollarSign,
  Smartphone, Settings, BarChart3, Shield, Rocket, Award, Activity,
  Sparkles, Code2, GitBranch, Database, Cloud, Lock, RefreshCw,
  Timer, Brain, Layers, Box, Calendar, Star, Heart, Cpu, Wifi
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

// Import Reveal.js CSS
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import '../presentation.css';

// Import GameIcon for visual consistency
import GameIcon from '../components/GameIcon';

// Import audio utilities
import { playSound, initializeAudio } from '../utils/audio';

// Import epic transition
import EpicTransition from '../components/EpicTransition';

// Floating Icon Component
const FloatingIcon = ({ icon: Icon, delay = 0, duration = 20, size = 24, className = "" }) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  
  return (
    <motion.div
      initial={{ 
        x: `${randomX}vw`, 
        y: `${randomY}vh`,
        opacity: 0,
        scale: 0
      }}
      animate={{ 
        x: [`${randomX}vw`, `${randomX + (Math.random() - 0.5) * 30}vw`, `${randomX}vw`],
        y: [`${randomY}vh`, `${randomY + (Math.random() - 0.5) * 30}vh`, `${randomY}vh`],
        opacity: [0, 0.3, 0.3, 0],
        scale: [0, 1, 1, 0],
        rotate: [0, 180, 360]
      }}
      transition={{ 
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <Icon size={size} className="text-white/20" />
    </motion.div>
  );
};

// Animated Card Component with hover effects
const AnimatedCard = ({ children, gradient, delay = 0, icon: Icon }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ 
        scale: 1.05, 
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] overflow-hidden">
        {/* Animated gradient background */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
          animate={isHovered ? {
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Floating icon in background */}
        {Icon && (
          <motion.div
            className="absolute -right-4 -top-4 opacity-5"
            animate={isHovered ? {
              rotate: 360,
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icon size={120} />
          </motion.div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-200%' }}
          animate={isHovered ? { x: '200%' } : {}}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
};

const Presentation = () => {
  const navigate = useNavigate();
  const deckRef = useRef(null);
  const revealRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCalculation, setShowCalculation] = useState({});
  const [isDemoHovered, setIsDemoHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [buttonParticles, setButtonParticles] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedModule, setSelectedModule] = useState(null);
  const ambienceControllerRef = useRef(null);
  const shouldPlayAmbienceRef = useRef(true);
  const moduleSelectionIntervalRef = useRef(null);

  // Global cleanup function for ambience
  const stopAmbience = () => {
    if (ambienceControllerRef.current) {
      console.log('Manual ambience stop called');
      ambienceControllerRef.current.stop();
      ambienceControllerRef.current = null;
      return true;
    }
    return false;
  };

  // Make stop function available globally for debugging
  window.stopAmbience = stopAmbience;

  // All module names for random selection
  const allModules = [
    "Inventory", "Picking", "Shipping", "Analytics", "Mobile App",
    "Packing", "Stock Control", "Inwards Goods", "Production", "Sales", 
    "SMT", "Tech", "Finance"
  ];

  // Function to start automatic module selection
  const startModuleSelection = () => {
    if (moduleSelectionIntervalRef.current) return;
    
    // Start with a random module
    const randomIndex = Math.floor(Math.random() * allModules.length);
    setSelectedModule(allModules[randomIndex]);
    
    // Set up interval for random selection
    moduleSelectionIntervalRef.current = setInterval(() => {
      // Only continue if we're still on the platform vision slide
      if (revealRef.current && revealRef.current.getState().indexh === 5) {
        setSelectedModule(current => {
          const currentIndex = allModules.indexOf(current);
          let nextIndex;
          
          // Ensure we select a different module
          do {
            nextIndex = Math.floor(Math.random() * allModules.length);
          } while (nextIndex === currentIndex);
          
          playSound('shimmer');
          return allModules[nextIndex];
        });
      } else {
        // Stop selection if we're not on the platform vision slide
        stopModuleSelection();
      }
    }, 3000); // Change selection every 3 seconds
  };

  // Function to stop automatic module selection
  const stopModuleSelection = () => {
    if (moduleSelectionIntervalRef.current) {
      clearInterval(moduleSelectionIntervalRef.current);
      moduleSelectionIntervalRef.current = null;
      setSelectedModule(null);
    }
  };

  useEffect(() => {
    if (!isInitialized && deckRef.current) {
      // Initialize Reveal.js with better settings
      revealRef.current = new Reveal(deckRef.current, {
        hash: false,
        controls: true,
        progress: true,
        center: false,
        transition: 'slide',
        backgroundTransition: 'fade',
        width: '100%',
        height: '100%',
        margin: 0,
        minScale: 1,
        maxScale: 1,
        keyboard: true,
        touch: true,
        loop: false,
        mouseWheel: true,
      });

      revealRef.current.initialize().then(() => {
        setIsInitialized(true);
        
        // Add slide change event listener for platform vision ambience
        revealRef.current.on('slidechanged', (event) => {
          console.log(`Slide changed to index: ${event.indexh}`);
          setCurrentSlide(event.indexh);
          
          // Stop existing ambience when leaving platform vision slide
          if (ambienceControllerRef.current && event.indexh !== 5) {
            console.log('Stopping ambience - leaving platform vision slide');
            shouldPlayAmbienceRef.current = true; // Reset flag for next time
            stopModuleSelection(); // Stop automatic selection
            try {
              ambienceControllerRef.current.stop();
              // Just stop the controller, don't suspend the context
            } catch (e) {
              console.log('Error stopping ambience:', e);
            }
            ambienceControllerRef.current = null;
          }
          
          // Check if we're on the platform vision slide (slide index 5, which is the 6th slide)
          if (event.indexh === 5 && !ambienceControllerRef.current) {
            console.log('Starting ambience - entering platform vision slide');
            // Start seamless looping ambience with a small delay to ensure we're actually on the slide
            setTimeout(() => {
              // Double-check we're still on slide 5
              if (revealRef.current && revealRef.current.getState().indexh === 5 && !ambienceControllerRef.current) {
                const startAmbience = async () => {
                  try {
                    const controller = await playSound('spaceAmbienceLoop');
                    if (controller && controller.start) {
                      controller.start();
                      ambienceControllerRef.current = controller;
                      console.log('Ambience controller started and stored');
                    }
                  } catch (e) {
                    console.log('Error starting ambience:', e);
                  }
                };
                startAmbience();
                
                // Start automatic module selection
                startModuleSelection();
              }
            }, 100);
          }
        });
        
        // Add custom keyboard handler for ESC and navigation fallback
        const handleKeyDown = (event) => {
          if (event.key === 'Escape' || event.keyCode === 27) {
            exitPresentation();
          }
          // Fallback navigation if Reveal.js keyboard isn't working
          else if (event.key === 'ArrowRight' || event.key === ' ' || event.keyCode === 32 || event.keyCode === 39) {
            event.preventDefault();
            revealRef.current.next();
          }
          else if (event.key === 'ArrowLeft' || event.keyCode === 37) {
            event.preventDefault();
            revealRef.current.prev();
          }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Store the handler for cleanup
        revealRef.current.customKeyHandler = handleKeyDown;
      });

      return () => {
        // Clean up ambience controller
        if (ambienceControllerRef.current) {
          console.log('Stopping ambience - reveal cleanup');
          ambienceControllerRef.current.stop();
          ambienceControllerRef.current = null;
        }
        
        if (revealRef.current) {
          if (revealRef.current.customKeyHandler) {
            document.removeEventListener('keydown', revealRef.current.customKeyHandler);
          }
          revealRef.current.destroy();
        }
      };
    }
  }, [isInitialized]);

  // Cleanup ambience on unmount, window unload, and visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (ambienceControllerRef.current) {
        console.log('Stopping ambience - window unloading');
        try {
          ambienceControllerRef.current.stop();
        } catch (e) {
          console.log('Error stopping ambience on unload:', e);
        }
        ambienceControllerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && ambienceControllerRef.current) {
        console.log('Stopping ambience - page hidden');
        shouldPlayAmbienceRef.current = false;
        try {
          ambienceControllerRef.current.stop();
        } catch (e) {
          console.log('Error stopping ambience on visibility change:', e);
        }
        ambienceControllerRef.current = null;
      } else if (!document.hidden && currentSlide === 4 && !ambienceControllerRef.current && shouldPlayAmbienceRef.current) {
        // Resume ambience if we're back on the platform vision slide
        console.log('Page visible again, checking if we should resume ambience');
        setTimeout(() => {
          if (revealRef.current && revealRef.current.getState().indexh === 4 && !ambienceControllerRef.current && shouldPlayAmbienceRef.current) {
            shouldPlayAmbienceRef.current = true;
            const startAmbience = async () => {
              try {
                const controller = await playSound('spaceAmbienceLoop');
                if (controller && controller.start) {
                  controller.start();
                  ambienceControllerRef.current = controller;
                  console.log('Ambience resumed after visibility change');
                }
              } catch (e) {
                console.log('Error resuming ambience:', e);
              }
            };
            startAmbience();
          }
        }, 200);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (ambienceControllerRef.current) {
        console.log('Stopping ambience - component unmounting');
        try {
          ambienceControllerRef.current.stop();
        } catch (e) {
          console.log('Error stopping ambience on unmount:', e);
        }
        ambienceControllerRef.current = null;
      }
      stopModuleSelection(); // Stop module selection on unmount
    };
  }, []);

  const exitPresentation = () => {
    // Stop ambience when exiting presentation
    if (ambienceControllerRef.current) {
      console.log('Stopping ambience - exiting presentation');
      try {
        ambienceControllerRef.current.stop();
      } catch (e) {
        console.log('Error stopping ambience on exit:', e);
      }
      ambienceControllerRef.current = null;
    }
    navigate(window.location.pathname);
  };

     const startLiveDemo = async () => {
     // Initialize audio on user interaction
     await initializeAudio();
     
     // Start charging phase
     setIsCharging(true);
     
     // Play initial charge sound
     await playSound('surgeClick');
     
     // Generate inward particles
     const particles = Array.from({ length: 30 }, (_, i) => ({
       id: i,
       angle: (i / 30) * Math.PI * 2,
       delay: Math.random() * 0.3,
       color: ['#60a5fa', '#c084fc', '#fbbf24'][i % 3],
     }));
     setButtonParticles(particles);
     
     // Short delay for charge effect
     setTimeout(() => {
       setIsCharging(false);
       setIsTransitioning(true);
     }, 500);
   };
  
  const handleTransitionComplete = () => {
    // Stop ambience when transitioning to dashboard
    if (ambienceControllerRef.current) {
      console.log('Stopping ambience - transitioning to dashboard');
      ambienceControllerRef.current.stop();
      ambienceControllerRef.current = null;
    }
    console.log('Transition complete, navigating to dashboard...');
    // Add small delay to ensure transition completes smoothly
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  return (
    <div className="presentation-mode fixed inset-0 z-[9999] bg-gray-950">
      {/* Custom Cursor */}
      <CustomCursor />
      
      {/* Epic Transition Component */}
      <EpicTransition 
        isActive={isTransitioning} 
        onComplete={handleTransitionComplete} 
      />
      {/* Navigation Controls with Glass Effect */}
      <div className="fixed top-4 right-4 z-[10000] flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exitPresentation}
          className="p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-white/20 group"
        >
          <X size={20} className="text-white/70 group-hover:text-white" />
        </motion.button>
      </div>

      {/* Side Navigation with Glass Effect */}
      {currentSlide > 0 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            await playSound('tick');
            revealRef.current?.prev();
          }}
          onHoverStart={() => playSound('hover')}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[10000] p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-white/20 group"
        >
          <ChevronLeft size={20} className="text-white/70 group-hover:text-white" />
        </motion.button>
      )}
      
      {currentSlide < 7 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            await playSound('tick');
            revealRef.current?.next();
          }}
          onHoverStart={() => playSound('hover')}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[10000] p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-white/20 group"
        >
          <ChevronRight size={20} className="text-white/70 group-hover:text-white" />
        </motion.button>
      )}

      <div ref={deckRef} className="reveal">
        <div className="slides">
          
          {/* Slide 1: Title - Apple Style */}
          <section data-background-color="#0a0a0f">
            {/* Full-screen gradient background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000 translate-x-1/2 translate-y-1/2"></div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-500 translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700 -translate-x-1/2 translate-y-1/2"></div>
              
              {/* Floating Icons */}
              <FloatingIcon icon={Package} delay={0} duration={25} size={32} />
              <FloatingIcon icon={Box} delay={2} duration={22} size={28} />
              <FloatingIcon icon={Rocket} delay={4} duration={28} size={30} />
              <FloatingIcon icon={Star} delay={6} duration={24} size={26} />
              <FloatingIcon icon={Zap} delay={8} duration={26} size={28} />
              <FloatingIcon icon={Database} delay={10} duration={23} size={30} />
              <FloatingIcon icon={Cloud} delay={12} duration={27} size={32} />
              <FloatingIcon icon={Cpu} delay={14} duration={25} size={28} />
            </div>

            <div className="relative text-center px-4 max-w-6xl mx-auto z-10 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, type: "spring", stiffness: 100 }}
                  className="mb-8"
                >
                  <motion.div 
                    className="relative"
                    animate={{
                      y: [0, -10, 0],
                      rotateY: [0, 180, 360]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-50"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-8 rounded-3xl overflow-hidden">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Package size={96} className="text-white relative z-10" />
                      </motion.div>
                      
                      {/* Sparkle effects */}
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.5
                        }}
                      >
                        <Sparkles size={20} className="text-white/80" />
                      </motion.div>
                      <motion.div
                        className="absolute bottom-2 left-2"
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 1.5
                        }}
                      >
                        <Star size={16} className="text-white/80" />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-7xl md:text-8xl lg:text-9xl font-bold mb-8 text-center"
                >
                  <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent block">
                    Introducing...
                  </span>
                  <motion.span 
                    className="text-8xl md:text-9xl lg:text-[10rem] leading-tight block"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      backgroundSize: '200% 200%',
                    }}
                  >
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Arrowhead</span>
                    {' '}
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Polaris</span>
                      <motion.span 
                        className="absolute -bottom-4 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"
                        animate={{
                          scaleX: [0.8, 1, 0.8],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </span>
                  </motion.span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-xl md:text-2xl text-gray-400 font-light text-center"
                >
                  Business Case for Development & Implementation
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="mt-12 text-gray-500 text-sm"
                >
                  <p>Press <kbd className="px-3 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-gray-400">Space</kbd> to continue</p>
                </motion.div>
              </div>
          </section>

          {/* Slide 2: Why "Arrowhead Polaris"? */}
          <section data-background-color="#0a0a0f">
            {/* Animated background with constellation effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* North Star glow effect */}
              <motion.div 
                className="absolute top-[20%] left-[50%] -translate-x-1/2"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl"></div>
              </motion.div>
              
              {/* Constellation dots */}
              <FloatingIcon icon={Star} delay={0} duration={20} size={16} className="opacity-30" />
              <FloatingIcon icon={Star} delay={2} duration={25} size={12} className="opacity-20" />
              <FloatingIcon icon={Star} delay={4} duration={22} size={14} className="opacity-25" />
              <FloatingIcon icon={Star} delay={6} duration={28} size={10} className="opacity-20" />
              <FloatingIcon icon={Star} delay={8} duration={24} size={18} className="opacity-30" />
            </div>
            
            <div className="relative text-center px-4 max-w-6xl mx-auto z-10">
              <motion.h2
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12"
              >
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Why "
                </span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Arrowhead Polaris
                </span>
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  "?
                </span>
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Arrowhead Explanation */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="mb-6"
                    >
                      <motion.svg width="80" height="80" viewBox="0 0 24 24" className="mx-auto">
                        <motion.path
                          d="M12 2L4 12L12 22L14 20L7.8 12L14 4L12 2Z"
                          fill="url(#arrowGradient)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                        <motion.path
                          d="M16 2L8 12L16 22L18 20L11.8 12L18 4L16 2Z"
                          fill="url(#arrowGradient2)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, delay: 0.8 }}
                        />
                        <defs>
                          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                          <linearGradient id="arrowGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </motion.svg>
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Arrowhead
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Named after our company, <span className="text-purple-400 font-semibold">Arrowhead</span> embodies our identity—
                      <span className="text-purple-400 font-semibold">sharp, precise, and purposeful</span>. 
                      Like an arrowhead, we cut through operational complexity with targeted efficiency, 
                      directing warehouse operations toward their goal with unwavering accuracy.
                    </p>
                  </div>
                </motion.div>
                
                {/* Polaris Explanation */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{
                        scale: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        },
                        rotate: {
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }
                      }}
                      className="mb-6"
                    >
                      <Star size={80} className="mx-auto text-cyan-400" fill="currentColor" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Polaris
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Polaris, the North Star, is <span className="text-cyan-400 font-semibold">the constant guide for navigation</span>. 
                      This WMS serves as our operational North Star—reliable, always visible, and guiding 
                      every decision toward true north: efficiency and accuracy.
                    </p>
                  </div>
                </motion.div>
              </div>
              
              {/* Combined Message */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-12 max-w-4xl mx-auto"
              >
                <div className="bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 rounded-3xl p-6 backdrop-blur-xl border border-white/5">
                  <p className="text-xl text-gray-300 text-center leading-relaxed">
                    Together, <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Arrowhead</span> and{' '}
                    <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Polaris</span> represent{' '}
                    <span className="text-white font-semibold">precision meeting guidance</span>—a system that not only 
                    executes flawlessly but also illuminates the path forward for our entire operation.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Slide 3: Strategic Advantage - Glass Cards */}
          <section data-background-color="#0a0a0f">
            {/* Floating background icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <FloatingIcon icon={Target} delay={0} duration={30} size={40} className="opacity-10" />
              <FloatingIcon icon={Rocket} delay={3} duration={25} size={36} className="opacity-10" />
              <FloatingIcon icon={Shield} delay={6} duration={28} size={38} className="opacity-10" />
              <FloatingIcon icon={Brain} delay={9} duration={32} size={42} className="opacity-10" />
              <FloatingIcon icon={Zap} delay={12} duration={26} size={35} className="opacity-10" />
              <FloatingIcon icon={TrendingUp} delay={15} duration={29} size={40} className="opacity-10" />
            </div>
            
            <div className="w-full h-full overflow-hidden relative">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-full flex flex-col">
              <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Strategic Advantage
                  </span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-400 font-light px-4 sm:px-0">
                  Why custom-built trumps subscription software
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 flex-1">
                {[
                  {
                    icon: Target,
                    title: "Perfect Fit",
                    text: "Built around our specific products, challenges, and processes. We don't adapt to it—it adapts to us.",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: Rocket,
                    title: "Competitive Edge",
                    text: "Incorporate unique processes that give us advantages others using generic software cannot replicate.",
                    gradient: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: TrendingUp,
                    title: "True Scalability",
                    text: "Scales with us without surprise fees for users, transactions, or features.",
                    gradient: "from-green-500 to-emerald-500"
                  },
                  {
                    icon: Shield,
                    title: "Asset Ownership",
                    text: "Development fee creates a permanent asset the company owns forever.",
                    gradient: "from-orange-500 to-red-500"
                  },
                  {
                    icon: Zap,
                    title: "Expert Support",
                    text: "Direct access to the developer who understands our business inside out.",
                    gradient: "from-yellow-500 to-orange-500"
                  },
                  {
                    icon: Brain,
                    title: "Future Platform",
                    text: "Foundation for AI integration and advanced automation capabilities.",
                    gradient: "from-indigo-500 to-purple-500"
                  }
                ].map((item, index) => (
                  <AnimatedCard
                    key={index}
                    gradient={item.gradient}
                    delay={0.1 * index}
                    icon={item.icon}
                  >
                    <motion.div 
                      className={`inline-flex p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} mb-3 sm:mb-4`}
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {item.text}
                    </p>
                  </AnimatedCard>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mt-4 sm:mt-6 lg:mt-8 text-sm sm:text-base lg:text-lg text-gray-500 italic font-light px-4 sm:px-0"
              >
                "Investing in our own efficiency and creating a platform for future growth"
              </motion.p>
                </div>
              </div>
            </div>
          </section>


          {/* Slide 3: Transform Your Operations - David's Solution vs Our Solution */}
          <section data-background-color="#0a0a0f">
            <div className="w-full h-full overflow-hidden">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-full flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
              >
                <motion.h2 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 leading-tight"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Transform Your
                  </span>
                  <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Operations
                  </span>
                </motion.h2>
                <motion.p 
                  className="text-base sm:text-lg md:text-xl text-gray-400 font-light px-4 sm:px-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Compare David's SuiteScript patches with our purpose-built solution
                </motion.p>
              </motion.div>

              {/* Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-1">
                {/* David's SuiteScript Way */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-yellow-500/20 p-4 sm:p-5 lg:p-6 rounded-3xl h-full flex flex-col">
                    <div className="text-center mb-3 sm:mb-4">
                      <motion.div
                        animate={{ rotate: [0, -5, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                        className="inline-block mb-2"
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full flex items-center justify-center backdrop-blur-xl border border-yellow-500/20">
                          <Settings className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl sm:text-2xl font-bold text-yellow-400">David's SuiteScript</h3>
                      <p className="text-xs sm:text-sm text-gray-400">Patching NetSuite's Limitations</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="bg-black/20 backdrop-blur border border-yellow-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">35+</p>
                        <p className="text-xs sm:text-sm text-gray-400">Hours to Build</p>
                      </div>
                      <div className="bg-black/20 backdrop-blur border border-yellow-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">Complex</p>
                        <p className="text-xs sm:text-sm text-gray-400">Implementation</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-gray-300">
                      {[
                        "Still requires NetSuite clicks & navigation",
                        "No barcode scan warnings (visual only)",
                        "Complex iPad login issues remain",
                        "API integrations cost 8-10 hours each", 
                        "Limited by NetSuite's UI constraints"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Arrowhead Polaris */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-green-500/20 p-4 sm:p-5 lg:p-6 rounded-3xl h-full flex flex-col">
                    <motion.div 
                      className="text-center mb-3 sm:mb-4 group cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playSound('success');
                        // Scroll to the last slide with the demo button
                        if (revealRef.current) {
                          revealRef.current.slide(7); // Navigate to the last slide
                        }
                      }}
                      onMouseEnter={() => playSound('hover')}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        className="inline-block mb-2 relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/50 to-emerald-500/50 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center backdrop-blur-xl border border-green-500/20">
                          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-400" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl sm:text-2xl font-bold text-green-400 group-hover:text-green-300 transition-all duration-300 group-hover:underline underline-offset-4">Arrowhead Polaris</h3>
                      <p className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Purpose-Built for Excellence</p>
                      <p className="text-xs text-green-400/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to see demo →</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="bg-black/20 backdrop-blur border border-green-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">Fast</p>
                        <p className="text-xs sm:text-sm text-gray-400">Implementation</p>
                      </div>
                      <div className="bg-black/20 backdrop-blur border border-green-500/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">100%</p>
                        <p className="text-xs sm:text-sm text-gray-400">Tailored to Us</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-gray-300">
                      {[
                        "Instant barcode scanning with audio alerts",
                        "Gamified interface staff actually love",
                        "Direct courier integration (no re-entry)",
                        "Smart packaging recommendations", 
                        "Real-time sync with all systems"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Comparison Metrics - David vs Custom */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
                {[
                  { 
                    icon: <Clock className="w-6 h-6" />, 
                    david: "Very slow", 
                    custom: "Streamlined & efficient",
                    label: "Process Speed", 
                    gradient: "from-blue-500 to-cyan-500" 
                  },
                  { 
                    icon: <DollarSign className="w-6 h-6" />, 
                    david: "Thousands in changes", 
                    custom: "One-time licensing",
                    label: "Investment", 
                    gradient: "from-green-500 to-emerald-500" 
                  },
                  { 
                    icon: <AlertCircle className="w-6 h-6" />, 
                    david: "Some sound", 
                    custom: "Full audio + visual",
                    label: "Error Alerts", 
                    gradient: "from-purple-500 to-pink-500" 
                  },
                  { 
                    icon: <RefreshCw className="w-6 h-6" />, 
                    david: "NetSuite limits", 
                    custom: "Unlimited potential",
                    label: "Future Growth", 
                    gradient: "from-orange-500 to-red-500" 
                  }
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl blur-xl"
                         style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center transition-all duration-300 group-hover:border-white/20 min-h-[140px] sm:min-h-[160px] lg:min-h-[180px] flex flex-col justify-center">
                      <div>
                        <motion.div 
                          className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${metric.gradient} mb-2 mx-auto`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {React.cloneElement(metric.icon, { className: "w-4 h-4" })}
                        </motion.div>
                        <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">{metric.label}</h4>
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm">
                            <p className="text-yellow-400 font-medium">David:</p>
                            <p className="text-gray-400">{metric.david}</p>
                          </div>
                          <div className="text-xs sm:text-sm">
                            <p className="text-green-400 font-medium">Ours:</p>
                            <p className="text-gray-300">{metric.custom}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
                </div>
              </div>
            </div>
          </section>

          {/* Slide 4: Complete Ownership & Protection - Merged */}
          <section data-background-color="#0a0a0f">
            <div className="w-full h-full overflow-hidden">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-full flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4 sm:mb-6"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Complete Ownership & Protection
                  </span>
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-400 font-light px-4 sm:px-0">
                  Your system, your code, your protected investment
                </p>
              </motion.div>

              {/* Comprehensive grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 flex-1">
                {/* Code Ownership Items */}
                {[
                  {
                    icon: <Code2 className="w-6 h-6" />,
                    title: "Full Source Code",
                    description: "Complete ownership of all code and assets upon payment",
                    details: ["Perpetual license", "No restrictions", "Modify freely"],
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: <GitBranch className="w-6 h-6" />,
                    title: "Shared Repository",
                    description: "Full admin access to GitHub repository",
                    details: ["Version control", "Collaboration ready", "Complete history"],
                    gradient: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: <Database className="w-6 h-6" />,
                    title: "Documentation",
                    description: "Comprehensive technical and user documentation",
                    details: ["API specs", "Setup guides", "Best practices"],
                    gradient: "from-green-500 to-emerald-500"
                  },
                  {
                    icon: <Lock className="w-6 h-6" />,
                    title: "IP Rights",
                    description: "Clear ownership and commercial rights",
                    details: ["Exclusive perpetual license", "Modify & commercialize", "No ongoing fees", "Written agreement"],
                    gradient: "from-orange-500 to-red-500"
                  },
                  {
                    icon: <RefreshCw className="w-6 h-6" />,
                    title: "Succession Plan",
                    description: "Smooth transition if personnel changes",
                    details: ["Complete handover package", "30-day transition period", "Technical documentation", "Remote support option"],
                    gradient: "from-indigo-500 to-purple-500"
                  },
                  {
                    icon: <Cloud className="w-6 h-6" />,
                    title: "Tech Stack",
                    description: "Future-proof technology choices",
                    details: ["Open-source foundation", "No vendor lock-in", "Transferable services", "Clear dependencies"],
                    gradient: "from-teal-500 to-cyan-500"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 h-full flex flex-col"
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      <div className={`p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br ${item.gradient} rounded-lg sm:rounded-xl mb-3 sm:mb-4`}>
                        {React.cloneElement(item.icon, { className: "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" })}
                      </div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">{item.title}</h3>
                      <p className="text-xs sm:text-xs lg:text-sm text-gray-400 mb-3 sm:mb-4 flex-grow">{item.description}</p>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
                        {item.details.map((detail, i) => (
                          <span key={i} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded-full text-gray-300">
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mt-4 sm:mt-6 text-xs sm:text-sm md:text-base text-gray-400 font-light px-4 sm:px-0"
              >
                Your investment remains protected regardless of personnel changes
              </motion.p>
                </div>
              </div>
            </div>
          </section>

          {/* Slide 5: Future Vision - Ecosystem */}
          <section data-background-color="#0a0a0f">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 relative z-40"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    The Platform Vision
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-gray-400 font-light">
                  Building an integrated business ecosystem
                </p>
              </motion.div>

              {/* Epic Visual Ecosystem */}
              <div className="absolute inset-0 flex items-center justify-center px-8 sm:px-12 lg:px-16 py-16 sm:py-20 lg:py-24">
                {/* Animated Background Effects */}
                <div className="absolute inset-0">
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                      background: [
                        'radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%)',
                        'radial-gradient(circle at 60% 40%, #8b5cf6 0%, transparent 50%)',
                        'radial-gradient(circle at 40% 60%, #3b82f6 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%)',
                      ]
                    }}
                    transition={{ 
                      duration: 10, 
                      repeat: Infinity,
                      ease: "linear",
                      times: [0, 0.33, 0.66, 1]
                    }}
                  />
                </div>

                {/* Rotating Orbit Rings */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] border border-blue-500/20 rounded-full" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-[50vw] h-[50vw] max-w-[550px] max-h-[550px] border border-purple-500/20 rounded-full" />
                </motion.div>
                
                {/* Outer ring for future modules */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-[78vw] h-[78vw] max-w-[780px] max-h-[780px] border border-yellow-500/50 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-[86vw] h-[86vw] max-w-[860px] max-h-[860px] border border-orange-500/40 rounded-full" />
                </motion.div>

                {/* Epic Center Core */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: 0,
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 1.5, type: "spring", stiffness: 100 }
                  }}
                  className="relative z-50 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 flex items-center justify-center outline-none"
                >
                  {/* Multi-layer glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-60 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-3xl blur-2xl opacity-40 animate-pulse animation-delay-1000"></div>
                  
                  {/* Core container with epic gradient */}
                  <motion.div 
                    className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-7 lg:p-8 rounded-3xl shadow-2xl overflow-hidden"
                    animate={{
                      background: [
                        'linear-gradient(to bottom right, #2563eb, #7c3aed, #ec4899)',
                        'linear-gradient(to bottom right, #7c3aed, #ec4899, #2563eb)',
                        'linear-gradient(to bottom right, #ec4899, #2563eb, #7c3aed)',
                        'linear-gradient(to bottom right, #2563eb, #7c3aed, #ec4899)',
                      ]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      ease: "linear",
                      times: [0, 0.33, 0.66, 1]
                    }}
                  >
                    {/* Inner shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: [-200, 200] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Animated icon */}
                    <motion.div
                      animate={{ 
                        rotateY: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Layers className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white relative z-10" />
                    </motion.div>
                  </motion.div>
                  
                  {/* Orbiting particles around core */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute inset-0"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.4
                      }}
                    >
                      <div 
                        className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"
                        style={{
                          top: '-5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    </motion.div>
                  ))}
                  
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center z-40">
                    <motion.p 
                      className="text-white font-bold text-base sm:text-lg"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Core Polaris
                    </motion.p>
                    <p className="text-gray-400 text-xs sm:text-sm">Intelligence Platform</p>
                  </div>
                </motion.div>



                {/* Enhanced Orbiting Modules with Dynamic Connections */}
                <div className="absolute inset-0 z-30">
                  {[
                    // Active modules - inner orbit (8 modules now)
                    { name: "Inventory", icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 0, gradient: "from-blue-500 to-cyan-500", delay: 0, orbitSpeed: 120, radius: 28 },
                    { name: "Picking", icon: <Box className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 45, gradient: "from-purple-500 to-pink-500", delay: 0.1, orbitSpeed: 120, radius: 28 },
                    { name: "Packing", icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 90, gradient: "from-cyan-500 to-blue-500", delay: 0.2, orbitSpeed: 120, radius: 28 },
                    { name: "Shipping", icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 135, gradient: "from-green-500 to-emerald-500", delay: 0.3, orbitSpeed: 120, radius: 28 },
                    { name: "Stock Control", icon: <Database className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 180, gradient: "from-emerald-500 to-teal-500", delay: 0.4, orbitSpeed: 120, radius: 28 },
                    { name: "Inwards Goods", icon: <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 225, gradient: "from-teal-500 to-cyan-500", delay: 0.5, orbitSpeed: 120, radius: 28 },
                    { name: "Analytics", icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 270, gradient: "from-orange-500 to-red-500", delay: 0.6, orbitSpeed: 120, radius: 28 },
                    { name: "Mobile App", icon: <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 315, gradient: "from-indigo-500 to-purple-500", delay: 0.7, orbitSpeed: 120, radius: 28 },
                    // Future modules - outer orbit
                    { name: "Production", icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 0, gradient: "from-yellow-500 to-orange-500", delay: 1.2, future: true, orbitSpeed: 180, radius: 40 },
                    { name: "Sales", icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 72, gradient: "from-orange-500 to-amber-500", delay: 1.4, future: true, orbitSpeed: 180, radius: 40 },
                    { name: "SMT", icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 144, gradient: "from-amber-500 to-yellow-500", delay: 1.6, future: true, orbitSpeed: 180, radius: 40 },
                    { name: "Tech", icon: <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 216, gradient: "from-yellow-600 to-orange-600", delay: 1.8, future: true, orbitSpeed: 180, radius: 40 },
                    { name: "Finance", icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />, angle: 288, gradient: "from-yellow-500 to-amber-600", delay: 2.0, future: true, orbitSpeed: 180, radius: 40 }
                  ].map((module, index) => {
                    return (
                    <motion.div
                      key={index}
                      className="absolute w-full h-full pointer-events-none"
                      style={{
                        left: 0,
                        top: 0,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        rotate: [0, 360]
                      }}
                      transition={{ 
                        opacity: { delay: 0.5 + module.delay, duration: 0.8 },
                        rotate: { 
                          duration: module.orbitSpeed, 
                          repeat: Infinity, 
                          ease: "linear",
                          delay: module.delay
                        }
                      }}
                    >
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `rotate(${module.angle}deg) translateX(${module.radius}vh)`,
                        }}
                      >
                        <motion.div
                          className="absolute pointer-events-auto"
                          style={{
                            transform: 'translate(-50%, -50%)'
                          }}
                          animate={{
                            rotate: [-module.angle, -module.angle - 360]
                          }}
                          transition={{
                            duration: module.orbitSpeed,
                            repeat: Infinity,
                            ease: "linear",
                            delay: module.delay
                          }}
                        >
                      <motion.div 
                        animate={{
                          boxShadow: selectedModule === module.name
                            ? module.future
                              ? "0 0 40px rgba(250, 204, 21, 0.6), 0 0 80px rgba(250, 204, 21, 0.3), 0 0 120px rgba(250, 204, 21, 0.2)"
                              : "0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.2)"
                            : module.future
                              ? [
                                  "0 0 20px rgba(250, 204, 21, 0.2)",
                                  "0 0 30px rgba(250, 204, 21, 0.3)",
                                  "0 0 20px rgba(250, 204, 21, 0.2)"
                                ]
                              : [
                                  "0 0 20px rgba(59, 130, 246, 0.2)",
                                  "0 0 30px rgba(139, 92, 246, 0.3)",
                                  "0 0 20px rgba(59, 130, 246, 0.2)"
                                ],
                          scale: selectedModule === module.name ? 1.1 : 1,
                        }}
                        transition={{
                          boxShadow: { duration: selectedModule === module.name ? 0.3 : 3, repeat: selectedModule === module.name ? 0 : Infinity, ease: "easeInOut" },
                          scale: { duration: 0.3 }
                        }}
                        whileHover={{ 
                          scale: selectedModule === module.name ? 1.1 : 1.15,
                          boxShadow: module.future 
                            ? "0 0 50px rgba(250, 204, 21, 0.5), 0 0 100px rgba(250, 204, 21, 0.3)"
                            : "0 0 50px rgba(59, 130, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)",
                          transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => playSound('shimmer')}
                        className={`${
                          selectedModule === module.name 
                            ? module.future 
                              ? 'bg-gradient-to-br from-yellow-400/30 to-orange-400/30 backdrop-blur-xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' 
                              : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-xl border-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                            : module.future 
                              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-yellow-400/60 border-dashed shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
                              : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-xl border border-white/20'
                        } p-3 sm:p-4 rounded-xl hover:border-white/40 transition-all duration-300 group relative overflow-hidden`}
                      >
                        {/* Shimmer effect on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          initial={{ x: -200 }}
                          whileHover={{ x: 200 }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        <div className="flex flex-col items-center space-y-2 relative z-10">
                          <motion.div 
                            className={`p-2 bg-gradient-to-br ${module.gradient} rounded-lg shadow-lg relative`}
                            animate={{ 
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                              duration: 4,
                              repeat: Infinity,
                              delay: index * 0.2
                            }}
                          >
                            {/* Glowing effect behind icon */}
                            <motion.div
                              className="absolute inset-0 rounded-xl blur-xl opacity-50"
                              style={{
                                background: `linear-gradient(to bottom right, ${module.gradient.includes('blue') ? '#3b82f6' : module.gradient.includes('yellow') ? '#facc15' : '#8b5cf6'}, transparent)`
                              }}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: module.future ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity
                              }}
                            />
                            <div className="relative z-10">{module.icon}</div>
                          </motion.div>
                          <motion.div 
                            className="text-center"
                            animate={{
                              y: [0, -2, 0]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: index * 0.1
                            }}
                          >
                            <p className={`text-xs sm:text-sm ${module.future ? 'text-yellow-300 font-bold' : 'text-white font-medium'} whitespace-nowrap`}>
                              {module.name}
                            </p>
                            {module.future && (
                              <motion.span 
                                className="block text-[10px] sm:text-xs text-yellow-400/80 mt-0.5"
                                animate={{
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity
                                }}
                              >
                                Coming Soon
                              </motion.span>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                  })}
                </div>


              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
                className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 z-40 pointer-events-none"
              >
                <div className="flex flex-col gap-4 text-xs">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">Module Status</h3>
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex-shrink-0"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className={`${
                      selectedModule && ["Inventory", "Picking", "Packing", "Shipping", "Stock Control", "Inwards Goods", "Analytics", "Mobile App"].includes(selectedModule)
                        ? "text-purple-400 font-semibold" 
                        : "text-gray-400"
                    }`}>Active Modules</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 border-2 border-dashed border-yellow-400 rounded-full bg-yellow-400/10 flex-shrink-0"></div>
                    <span className={`${
                      selectedModule && ["Production", "Sales", "SMT", "Tech", "Finance"].includes(selectedModule)
                        ? "text-yellow-400 font-semibold" 
                        : "text-gray-400"
                    }`}>Future Modules</span>
                  </div>
                  {selectedModule && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 pt-3 border-t border-white/10"
                    >
                      <div className="text-xs text-gray-400 mb-1">Selected:</div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {React.createElement(
                          [
                            { name: "Inventory", icon: Package },
                            { name: "Picking", icon: Box },
                            { name: "Packing", icon: Package },
                            { name: "Shipping", icon: Rocket },
                            { name: "Stock Control", icon: Database },
                            { name: "Inwards Goods", icon: ArrowRight },
                            { name: "Analytics", icon: BarChart3 },
                            { name: "Mobile App", icon: Smartphone },
                            { name: "Production", icon: Settings },
                            { name: "Sales", icon: TrendingUp },
                            { name: "SMT", icon: Activity },
                            { name: "Tech", icon: Code2 },
                            { name: "Finance", icon: DollarSign }
                          ].find(m => m.name === selectedModule)?.icon || Package,
                          { className: "w-4 h-4" }
                        )}
                        {selectedModule}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              </div>
            </div>
          </section>

          {/* Slide 6: Requirements - Clean Checklist */}
          <section data-background-color="#0a0a0f">
            <div className="w-full h-full overflow-hidden">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 min-h-full flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 sm:mb-10 lg:mb-12"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Ready to Begin?
                  </span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-400 font-light px-4 sm:px-0">
                  Requirements for the next phase
                </p>
              </motion.div>

              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    title: "API Credentials",
                    description: "NetSuite, NZ Couriers, and Mainfreight (sandbox preferred)",
                    icon: <Cloud className="w-6 h-6" />
                  },
                  {
                    title: "Product Images Permission",
                    description: "Permission to use product images from website/NetSuite",
                    icon: <Database className="w-6 h-6" />
                  },
                  {
                    title: "AWS Account",
                    description: "Company-owned account for hosting",
                    icon: <Globe className="w-6 h-6" />
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ x: 10 }}
                    onHoverStart={() => playSound('hover')}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                      <div className="flex-shrink-0">
                        <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                          {React.cloneElement(item.icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">{item.title}</h3>
                        <p className="text-sm sm:text-base text-gray-400">{item.description}</p>
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
                </div>
              </div>
            </div>
          </section>

          {/* Slide 7: Summary - Call to Action */}
          <section data-background-color="#0a0a0f">
            <div className="w-full h-full overflow-hidden">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 min-h-full flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 sm:mb-10 lg:mb-12"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Transform Your Operations
                  </span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-400 font-light px-4 sm:px-0">
                  Invest in a high-value, custom-built asset
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10 lg:mb-12 max-w-md mx-auto">
                {[
                  { icon: "🎯", title: "Perfect Fit", text: "Built for our workflows" }
                ].map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl"
                  >
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{point.icon}</div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>{point.title}</h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-400">{point.text}</p>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm sm:text-base md:text-lg text-gray-400 font-light mb-8 sm:mb-10 lg:mb-12 italic px-4 sm:px-0"
              >
                "I'm deeply committed to this project and confident in its ability to create measurable value"
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="relative"
              >
                {/* Particle effects */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full"
                      initial={{ 
                        x: 0, 
                        y: 0,
                        opacity: 0
                      }}
                      animate={{ 
                        x: Math.random() * 400 - 200,
                        y: Math.random() * 200 - 100,
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                    />
                  ))}
                </div>
                
                <motion.button
                  onClick={startLiveDemo}
                  className={`group relative px-8 sm:px-12 md:px-16 py-6 sm:py-7 md:py-8 overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 ${isCharging ? 'scale-95' : ''}`}
                  whileHover={{ scale: isCharging ? 0.95 : 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onHoverStart={async () => {
                    if (!isCharging) {
                      setIsDemoHovered(true);
                      await playSound('surgeHover');
                    }
                  }}
                  onHoverEnd={() => setIsDemoHovered(false)}
                  animate={{
                    boxShadow: isCharging 
                      ? [
                          '0 0 20px rgba(96, 165, 250, 0.5), 0 0 40px rgba(192, 132, 252, 0.3)',
                          '0 0 40px rgba(96, 165, 250, 0.8), 0 0 80px rgba(192, 132, 252, 0.6)',
                          '0 0 20px rgba(96, 165, 250, 0.5), 0 0 40px rgba(192, 132, 252, 0.3)',
                        ]
                      : isDemoHovered 
                        ? '0 0 30px rgba(96, 165, 250, 0.6), 0 0 60px rgba(192, 132, 252, 0.4), 0 0 90px rgba(251, 191, 36, 0.2)'
                        : '0 0 20px rgba(96, 165, 250, 0.3), 0 0 40px rgba(192, 132, 252, 0.2)',
                  }}
                  transition={{ 
                    boxShadow: isCharging ? { duration: 0.5, repeat: Infinity } : { duration: 0.3 }
                  }}
                >
                  {/* Multi-layer animated background */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"
                    animate={{
                      opacity: isCharging ? [0.8, 1, 0.8] : isDemoHovered ? 0.9 : 0.8,
                    }}
                    transition={{ duration: 0.5, repeat: isCharging ? Infinity : 0 }}
                  />
                  
                  {/* Pulsing energy layer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                    animate={{
                      opacity: isCharging ? [0, 0.6, 0] : isDemoHovered ? [0.3, 0.5, 0.3] : 0,
                      scale: isCharging ? [0.8, 1.1, 0.8] : 1,
                    }}
                    transition={{ duration: isDemoHovered ? 2 : 0.7, repeat: Infinity }}
                  />
                  
                  {/* Glowing aura - appears on hover, intensifies on click */}
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-3xl blur-2xl"
                    animate={{
                      opacity: isCharging ? 0.8 : isDemoHovered ? 0.5 : 0,
                      scale: isCharging ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ 
                      duration: isCharging ? 0.5 : 0.3,
                      repeat: isCharging ? Infinity : 0,
                    }}
                  />
                  
                  {/* Shimmer effect - more intense when charging */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    animate={{ 
                      x: isCharging ? [-200, 200, -200] : [-200, 200],
                      opacity: isCharging ? [0.3, 0.6, 0.3] : [0.1, 0.3, 0.1],
                    }}
                    transition={{ 
                      duration: isCharging ? 0.8 : 1.5, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  />
                  
                  {/* Charging particles - drawn inward */}
                  {isCharging && (
                    <div className="absolute inset-0">
                      {buttonParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            backgroundColor: particle.color,
                            boxShadow: `0 0 6px ${particle.color}`,
                          }}
                          initial={{
                            x: Math.cos(particle.angle) * 200,
                            y: Math.sin(particle.angle) * 200,
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            x: 0,
                            y: 0,
                            scale: [0, 1.5, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 0.8,
                            delay: particle.delay,
                            ease: "easeIn",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Button content with enhanced glow */}
                  <div className="relative flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4">
                    <motion.div
                      animate={{ 
                        rotate: isCharging ? 720 : isDemoHovered ? [0, 360] : 360,
                        scale: isCharging ? [1, 1.2, 1] : isDemoHovered ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ 
                        duration: isCharging ? 0.5 : isDemoHovered ? 1.5 : 2, 
                        repeat: Infinity,
                        ease: "linear" 
                      }}
                    >
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </motion.div>
                    
                    <motion.span 
                      className="text-lg sm:text-2xl md:text-3xl font-bold tracking-wider text-white relative"
                      animate={{
                        textShadow: isCharging
                          ? [
                              '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(96,165,250,0.6), 0 0 30px rgba(192,132,252,0.4)',
                              '0 0 20px rgba(255,255,255,1), 0 0 40px rgba(96,165,250,0.8), 0 0 60px rgba(192,132,252,0.6)',
                              '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(96,165,250,0.6), 0 0 30px rgba(192,132,252,0.4)',
                            ]
                          : isDemoHovered
                            ? '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(96,165,250,0.6)'
                            : '0 0 10px rgba(255,255,255,0.5)',
                      }}
                      transition={{ duration: isCharging ? 0.5 : 0.3, repeat: isCharging ? Infinity : 0 }}
                    >
                      VIEW LIVE DEMO
                    </motion.span>
                    
                    <motion.div
                      animate={{ 
                        x: isCharging ? [0, -10, 0] : [0, 10, 0],
                        scale: isCharging ? [1, 0.8, 1] : 1,
                      }}
                      transition={{ 
                        duration: isCharging ? 0.5 : 1, 
                        repeat: Infinity 
                      }}
                    >
                      <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </motion.div>
                  </div>
                  
                  {/* Enhanced sparkle overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={`sparkle-${i}`}
                        className="absolute rounded-full"
                        style={{
                          left: `${10 + (i % 4) * 25}%`,
                          top: `${10 + Math.floor(i / 4) * 35}%`,
                          width: isCharging ? '4px' : '2px',
                          height: isCharging ? '4px' : '2px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 6px #ffffff',
                        }}
                        animate={{
                          scale: isDemoHovered || isCharging ? [0, 1.5, 0] : 0,
                          opacity: isDemoHovered || isCharging ? [0, 1, 0] : 0,
                        }}
                        transition={{
                          duration: isCharging ? 0.6 : 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Energy ripples on hover */}
                  {isDemoHovered && !isCharging && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: [0.8, 1.1, 0.8],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      style={{
                        border: '2px solid rgba(255,255,255,0.3)',
                        filter: 'blur(1px)',
                      }}
                    />
                  )}
                </motion.button>
              </motion.div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 100, 0, 0],
            y: [0, 0, -100, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1]
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, -100, 0, 0],
            y: [0, 0, 100, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1]
          }}
        />
      </div>
    </div>
  );
};

export default Presentation;