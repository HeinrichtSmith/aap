// Global audio context management
let globalAudioContext = null;
let audioInitialized = false;
let masterGainNode = null;

// Expose audio context globally for emergency cleanup
if (typeof window !== 'undefined') {
  window.globalAudioContext = null;
}

// Helper function to get current volume setting
const getVolumeMultiplier = () => {
  const savedSettings = localStorage.getItem('warehouseSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    return (settings.volumeLevel || 75) / 100; // Default to 75%
  }
  return 0.75; // Default volume
};

export const initializeAudio = async () => {
  if (audioInitialized || globalAudioContext) return true;
  
  try {
    // Don't create context until user gesture
    globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node for volume control
    masterGainNode = globalAudioContext.createGain();
    masterGainNode.connect(globalAudioContext.destination);
    masterGainNode.gain.setValueAtTime(getVolumeMultiplier(), globalAudioContext.currentTime);
    
    // Expose globally for emergency cleanup
    window.globalAudioContext = globalAudioContext;
    window.masterGainNode = masterGainNode;
    
    // Resume if suspended
    if (globalAudioContext.state === 'suspended') {
      await globalAudioContext.resume();
    }
    
    audioInitialized = true;
    console.log('Audio initialized successfully');
    return true;
  } catch (error) {
    console.log('Audio initialization failed:', error);
    return false;
  }
};

export const playSound = async (type) => {
  // Check if sound effects are enabled in settings
  const savedSettings = localStorage.getItem('warehouseSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (!settings.soundEffects) {
      return; // Don't play sound if sound effects are disabled
    }
  }
  
  // Try to initialize audio if it hasn't been initialized yet
  if (!audioInitialized || !globalAudioContext) {
    const initialized = await initializeAudio();
    if (!initialized) return;
  }
  
  // Ensure audio context is resumed
  if (globalAudioContext && globalAudioContext.state === 'suspended') {
    try {
      await globalAudioContext.resume();
    } catch (error) {
      console.log('Failed to resume audio context:', error);
      return;
    }
  }
  
  try {
    // Check if context is in a good state
    if (!globalAudioContext || globalAudioContext.state === 'closed') {
      audioInitialized = false;
      globalAudioContext = null;
      return;
    }
    
    // Special case for seamless loop - return controller directly
    if (type === 'spaceAmbienceLoop') {
      return createSpaceAmbienceLoop(globalAudioContext);
    }
    
    switch (type) {
      case 'success':
        createSparklyChime(globalAudioContext);
        break;
      case 'error':
        createWobbleError(globalAudioContext);
        break;
      case 'combo':
        createComboMagic(globalAudioContext);
        break;
      case 'complete':
        createVictoryFanfare(globalAudioContext);
        break;
      case 'click':
        createBubblePop(globalAudioContext);
        break;
      case 'hover':
        createShimmer(globalAudioContext);
        break;
      case 'tick':
        createCrystalTick(globalAudioContext);
        break;
      case 'confetti':
        createConfettiSound(globalAudioContext);
        break;
      case 'print':
        createPrintSound(globalAudioContext);
        break;
      case 'transition':
        createTransitionSound(globalAudioContext);
        break;
      case 'epicLaunch':
        createEpicLaunchSound(globalAudioContext);
        break;
      case 'surgeHover':
        createSurgeHoverSound(globalAudioContext);
        break;
      case 'surgeClick':
        createSurgeClickSound(globalAudioContext);
        break;
      case 'levelUp':
        createLevelUpSound(globalAudioContext);
        break;
      case 'levelUp1':
        createLevelUpSound(globalAudioContext, 0.7);
        break;
      case 'levelUp2':
        createLevelUpSound(globalAudioContext, 0.85);
        break;
      case 'levelUp3':
        createLevelUpSound(globalAudioContext, 1.0);
        break;
      case 'levelUp4':
        createLevelUpSound(globalAudioContext, 1.3);
        break;
      case 'shimmer':
        createShimmer(globalAudioContext);
        break;
      case 'spaceAmbience':
        createSpaceAmbience(globalAudioContext);
        break;

      default:
        createBubblePop(globalAudioContext);
    }
  } catch (error) {
    console.log('Sound playback error:', error);
  }
};

// Soft crystalline tick
export const createCrystalTick = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainNode || audioContext.destination);
    
    osc.type = 'triangle';
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    
    osc.frequency.setValueAtTime(1500, audioContext.currentTime);
    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    // Silently fail
  }
};

// Sparkly rising chime for success
export const createSparklyChime = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      filter.Q.setValueAtTime(1, audioContext.currentTime);
      
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0, audioContext.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.08 + 0.6);
      
      osc.start(audioContext.currentTime + i * 0.08);
      osc.stop(audioContext.currentTime + i * 0.08 + 0.6);
    });
  } catch (error) {
    // Silently fail
  }
};

// Gentle wobble for errors
export const createWobbleError = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const wobble = audioContext.createOscillator();
    const wobbleGain = audioContext.createGain();
    
    wobble.connect(wobbleGain);
    wobbleGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'sine';
    wobble.type = 'sine';
    
    osc.frequency.setValueAtTime(220, audioContext.currentTime);
    wobble.frequency.setValueAtTime(6, audioContext.currentTime);
    wobbleGain.gain.setValueAtTime(15, audioContext.currentTime);
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    
    wobble.start(audioContext.currentTime);
    osc.start(audioContext.currentTime);
    wobble.stop(audioContext.currentTime + 0.4);
    osc.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    // Silently fail
  }
};

// Magical cascade for combos
export const createComboMagic = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66, 1396.91];
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        try {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = 'triangle';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
          filter.Q.setValueAtTime(3, audioContext.currentTime);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.12, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          // Silently fail
        }
      }, i * 60);
    });
  } catch (error) {
    // Silently fail
  }
};

// Victory fanfare with sparkles
export const createVictoryFanfare = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Main fanfare melody
    const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    melody.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.12 + 0.4);
      
      osc.start(audioContext.currentTime + i * 0.12);
      osc.stop(audioContext.currentTime + i * 0.12 + 0.4);
    });
    
    // Sparkle layer
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        try {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1500 + Math.random() * 1000, audioContext.currentTime);
          gain.gain.setValueAtTime(0.08, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          // Silently fail
        }
      }, i * 80);
    }
  } catch (error) {
    // Silently fail
  }
};

// Satisfying bubble pop
export const createBubblePop = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Silently fail
  }
};

// Ultra-simple hover sound with minimal processing
export const createShimmer = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.08);
    
  } catch (error) {
    // Silently fail
  }
};

// Enhanced Candy Crush-style confetti celebration
export const createConfettiSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Main celebration fanfare
    const celebrationNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6
    celebrationNotes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = 'triangle';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, audioContext.currentTime + i * 0.08);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.08 + 0.6);
      
      osc.start(audioContext.currentTime + i * 0.08);
      osc.stop(audioContext.currentTime + i * 0.08 + 0.6);
    });
    
    // Magical sparkle bursts - 3 waves of sparkles
    for (let wave = 0; wave < 3; wave++) {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (audioContext.state !== 'running') return;
          
          try {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.type = 'sine';
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, audioContext.currentTime);
            
            const sparkleFreq = 1500 + Math.random() * 2000; // Random high frequencies
            osc.frequency.setValueAtTime(sparkleFreq, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(sparkleFreq * 1.5, audioContext.currentTime + 0.2);
            
            gain.gain.setValueAtTime(0.06, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          } catch (error) {
            // Silently fail
          }
        }, wave * 200 + i * 25); // Staggered sparkles across 3 waves
      }
    }
    
    // Deep celebration bass boom
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    const bassFilter = audioContext.createBiquadFilter();
    
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(audioContext.destination);
    
    bassOsc.type = 'sine';
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(200, audioContext.currentTime);
    
    bassOsc.frequency.setValueAtTime(80, audioContext.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.4);
    bassGain.gain.setValueAtTime(0.2, audioContext.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    bassOsc.start(audioContext.currentTime);
    bassOsc.stop(audioContext.currentTime + 0.5);
    
    // Victory chimes - crystalline bells
    const chimeFreqs = [2093, 2637, 3136, 3729]; // High C to high F#
    chimeFreqs.forEach((freq, i) => {
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        try {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.08, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.0);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 1.0);
        } catch (error) {
          // Silently fail
        }
      }, 300 + i * 100); // Delayed chimes for extended celebration
    });
  } catch (error) {
    // Silently fail
  }
};

// Smooth transition whoosh for navigation
export const createTransitionSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Create a smooth ascending tone for navigation
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    // Set up oscillators
    osc1.type = 'sine';
    osc2.type = 'triangle';
    filter.type = 'lowpass';
    
    // Ascending frequency sweep
    osc1.frequency.setValueAtTime(330, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
    
    osc2.frequency.setValueAtTime(220, audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(550, audioContext.currentTime + 0.3);
    
    // Filter sweep for whoosh effect
    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);
    osc2.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Silently fail
  }
};

// Print sound simulation
export const createPrintSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Mechanical printer sound with digital beeps
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(audioContext.destination);
    
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    
    // Mechanical whir
    osc1.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, audioContext.currentTime);
    
    osc1.frequency.setValueAtTime(120, audioContext.currentTime);
    gain1.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
    
    // Digital beep confirmation
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, audioContext.currentTime + 0.6);
    osc2.frequency.setValueAtTime(1500, audioContext.currentTime + 0.7);
    gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.6);
    gain2.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.62);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.9);
    
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime + 0.6);
    osc1.stop(audioContext.currentTime + 0.8);
    osc2.stop(audioContext.currentTime + 0.9);
  } catch (error) {
    // Silently fail
  }
};

// Epic launch sound for demo transition
export const createEpicLaunchSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Bass drop
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    const bassFilter = audioContext.createBiquadFilter();
    
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(audioContext.destination);
    
    bassOsc.type = 'sawtooth';
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(100, audioContext.currentTime);
    bassFilter.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
    
    bassOsc.frequency.setValueAtTime(55, audioContext.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(27.5, audioContext.currentTime + 0.5);
    bassGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    
    // Rising sweep
    const sweepOsc = audioContext.createOscillator();
    const sweepGain = audioContext.createGain();
    
    sweepOsc.connect(sweepGain);
    sweepGain.connect(audioContext.destination);
    
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(200, audioContext.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 1.2);
    sweepGain.gain.setValueAtTime(0.1, audioContext.currentTime);
    sweepGain.gain.setValueAtTime(0.2, audioContext.currentTime + 0.8);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    
    // Sparkle layer
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 to E6
    notes.forEach((freq, i) => {
      const sparkleOsc = audioContext.createOscillator();
      const sparkleGain = audioContext.createGain();
      
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(audioContext.destination);
      
      sparkleOsc.type = 'triangle';
      sparkleOsc.frequency.setValueAtTime(freq * 2, audioContext.currentTime + i * 0.1);
      sparkleGain.gain.setValueAtTime(0, audioContext.currentTime + i * 0.1);
      sparkleGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + i * 0.1 + 0.05);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.1 + 0.8);
      
      sparkleOsc.start(audioContext.currentTime + i * 0.1);
      sparkleOsc.stop(audioContext.currentTime + i * 0.1 + 0.8);
    });
    
    // Impact sound
    setTimeout(() => {
      if (audioContext.state !== 'running') return;
      
      const impactOsc = audioContext.createOscillator();
      const impactGain = audioContext.createGain();
      const impactFilter = audioContext.createBiquadFilter();
      
      impactOsc.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(audioContext.destination);
      
      impactOsc.type = 'sine';
      impactFilter.type = 'lowpass';
      impactFilter.frequency.setValueAtTime(200, audioContext.currentTime);
      
      impactOsc.frequency.setValueAtTime(60, audioContext.currentTime);
      impactGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      impactGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      impactOsc.start(audioContext.currentTime);
      impactOsc.stop(audioContext.currentTime + 0.3);
    }, 800);
    
    bassOsc.start(audioContext.currentTime);
    sweepOsc.start(audioContext.currentTime);
    bassOsc.stop(audioContext.currentTime + 1.5);
    sweepOsc.stop(audioContext.currentTime + 1.5);
  } catch (error) {
    // Silently fail
  }
};

// Intense surge hover sound - building energy
export const createSurgeHoverSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Low frequency rumble
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    const bassFilter = audioContext.createBiquadFilter();
    
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(audioContext.destination);
    
    bassOsc.type = 'sawtooth';
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(100, audioContext.currentTime);
    bassFilter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    bassFilter.Q.setValueAtTime(10, audioContext.currentTime);
    
    bassOsc.frequency.setValueAtTime(40, audioContext.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.3);
    bassGain.gain.setValueAtTime(0, audioContext.currentTime);
    bassGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
    bassGain.gain.setValueAtTime(0.15, audioContext.currentTime + 0.2);
    bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    
    // Energy surge sweep
    const sweepOsc = audioContext.createOscillator();
    const sweepGain = audioContext.createGain();
    const sweepFilter = audioContext.createBiquadFilter();
    
    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(audioContext.destination);
    
    sweepOsc.type = 'sine';
    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(300, audioContext.currentTime);
    sweepFilter.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.3);
    sweepFilter.Q.setValueAtTime(5, audioContext.currentTime);
    
    sweepOsc.frequency.setValueAtTime(200, audioContext.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
    sweepGain.gain.setValueAtTime(0.08, audioContext.currentTime);
    sweepGain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
    
    // Electric crackle
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.02;
    }
    
    const noise = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    
    noise.buffer = noiseBuffer;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, audioContext.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 0.2);
    noiseFilter.Q.setValueAtTime(10, audioContext.currentTime);
    
    noiseGain.gain.setValueAtTime(0.05, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    bassOsc.start(audioContext.currentTime);
    sweepOsc.start(audioContext.currentTime);
    noise.start(audioContext.currentTime);
    
    bassOsc.stop(audioContext.currentTime + 0.4);
    sweepOsc.stop(audioContext.currentTime + 0.35);
    noise.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Silently fail
  }
};

// Explosive surge click - blast off feeling
export const createSurgeClickSound = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Deep impact bass
    const impactOsc = audioContext.createOscillator();
    const impactGain = audioContext.createGain();
    const impactFilter = audioContext.createBiquadFilter();
    
    impactOsc.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(audioContext.destination);
    
    impactOsc.type = 'sine';
    impactFilter.type = 'lowpass';
    impactFilter.frequency.setValueAtTime(150, audioContext.currentTime);
    impactFilter.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
    
    impactOsc.frequency.setValueAtTime(80, audioContext.currentTime);
    impactOsc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.4);
    impactGain.gain.setValueAtTime(0.4, audioContext.currentTime);
    impactGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    // Rising energy blast
    const blastOsc1 = audioContext.createOscillator();
    const blastOsc2 = audioContext.createOscillator();
    const blastGain = audioContext.createGain();
    const blastFilter = audioContext.createBiquadFilter();
    
    blastOsc1.connect(blastFilter);
    blastOsc2.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(audioContext.destination);
    
    blastOsc1.type = 'sawtooth';
    blastOsc2.type = 'square';
    blastFilter.type = 'bandpass';
    blastFilter.frequency.setValueAtTime(500, audioContext.currentTime);
    blastFilter.frequency.exponentialRampToValueAtTime(3000, audioContext.currentTime + 0.6);
    blastFilter.Q.setValueAtTime(2, audioContext.currentTime);
    
    blastOsc1.frequency.setValueAtTime(100, audioContext.currentTime);
    blastOsc1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.6);
    blastOsc2.frequency.setValueAtTime(150, audioContext.currentTime);
    blastOsc2.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.6);
    
    blastGain.gain.setValueAtTime(0, audioContext.currentTime);
    blastGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
    blastGain.gain.setValueAtTime(0.25, audioContext.currentTime + 0.3);
    blastGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
    
    // Laser zap layer
    const laserOsc = audioContext.createOscillator();
    const laserGain = audioContext.createGain();
    const laserFilter = audioContext.createBiquadFilter();
    
    laserOsc.connect(laserFilter);
    laserFilter.connect(laserGain);
    laserGain.connect(audioContext.destination);
    
    laserOsc.type = 'sine';
    laserFilter.type = 'highpass';
    laserFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
    
    laserOsc.frequency.setValueAtTime(2000, audioContext.currentTime);
    laserOsc.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 0.2);
    laserOsc.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.4);
    
    laserGain.gain.setValueAtTime(0.15, audioContext.currentTime);
    laserGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    // White noise burst
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    
    noise.buffer = noiseBuffer;
    noise.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    noiseGain.gain.setValueAtTime(0.1, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
    
    impactOsc.start(audioContext.currentTime);
    blastOsc1.start(audioContext.currentTime);
    blastOsc2.start(audioContext.currentTime);
    laserOsc.start(audioContext.currentTime);
    noise.start(audioContext.currentTime);
    
    impactOsc.stop(audioContext.currentTime + 0.5);
    blastOsc1.stop(audioContext.currentTime + 0.8);
    blastOsc2.stop(audioContext.currentTime + 0.8);
    laserOsc.stop(audioContext.currentTime + 0.5);
    noise.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Silently fail
  }
};

// Epic level up transition - like entering a new dimension
export const createLevelUpSound = (audioContext, pitchMultiplier = 1.0) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Dimensional warp bass
    const warpOsc = audioContext.createOscillator();
    const warpGain = audioContext.createGain();
    const warpFilter = audioContext.createBiquadFilter();
    
    warpOsc.connect(warpFilter);
    warpFilter.connect(warpGain);
    warpGain.connect(audioContext.destination);
    
    warpOsc.type = 'sine';
    warpFilter.type = 'lowpass';
    warpFilter.frequency.setValueAtTime(50, audioContext.currentTime);
    warpFilter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    warpFilter.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 1.5);
    
    warpOsc.frequency.setValueAtTime(30 * pitchMultiplier, audioContext.currentTime);
    warpOsc.frequency.setValueAtTime(30 * pitchMultiplier, audioContext.currentTime + 0.5);
    warpOsc.frequency.exponentialRampToValueAtTime(15 * pitchMultiplier, audioContext.currentTime + 1.5);
    
    warpGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    warpGain.gain.setValueAtTime(0.3, audioContext.currentTime + 1.0);
    warpGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);
    
    // Ascending energy sweep
    const ascendOsc1 = audioContext.createOscillator();
    const ascendOsc2 = audioContext.createOscillator();
    const ascendGain = audioContext.createGain();
    const ascendFilter = audioContext.createBiquadFilter();
    
    ascendOsc1.connect(ascendFilter);
    ascendOsc2.connect(ascendFilter);
    ascendFilter.connect(ascendGain);
    ascendGain.connect(audioContext.destination);
    
    ascendOsc1.type = 'sawtooth';
    ascendOsc2.type = 'triangle';
    ascendFilter.type = 'bandpass';
    ascendFilter.frequency.setValueAtTime(200, audioContext.currentTime);
    ascendFilter.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 1.5);
    ascendFilter.Q.setValueAtTime(1, audioContext.currentTime);
    ascendFilter.Q.linearRampToValueAtTime(5, audioContext.currentTime + 1.5);
    
    ascendOsc1.frequency.setValueAtTime(100 * pitchMultiplier, audioContext.currentTime);
    ascendOsc1.frequency.exponentialRampToValueAtTime(2000 * pitchMultiplier, audioContext.currentTime + 1.5);
    ascendOsc2.frequency.setValueAtTime(150 * pitchMultiplier, audioContext.currentTime);
    ascendOsc2.frequency.exponentialRampToValueAtTime(3000 * pitchMultiplier, audioContext.currentTime + 1.5);
    
    ascendGain.gain.setValueAtTime(0.1, audioContext.currentTime);
    ascendGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.8);
    ascendGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);
    
    // Victory fanfare - high pitched celebration
    const victoryNotes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02]; // C6 to E7
    victoryNotes.forEach((freq, i) => {
      const adjustedFreq = freq * pitchMultiplier;
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(adjustedFreq * 2, audioContext.currentTime);
        filter.Q.setValueAtTime(5, audioContext.currentTime);
        
        osc.frequency.setValueAtTime(adjustedFreq, audioContext.currentTime);
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.8);
      }, 800 + i * 100);
    });
    
    // Sparkle burst
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        const sparkleOsc = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        
        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(audioContext.destination);
        
        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime((3000 + Math.random() * 2000) * pitchMultiplier, audioContext.currentTime);
        sparkleGain.gain.setValueAtTime(0.05, audioContext.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        sparkleOsc.start(audioContext.currentTime);
        sparkleOsc.stop(audioContext.currentTime + 0.3);
      }, 500 + i * 50);
    }
    
    // Power up completion chime
    setTimeout(() => {
      if (audioContext.state !== 'running') return;
      
      const chimeOsc1 = audioContext.createOscillator();
      const chimeOsc2 = audioContext.createOscillator();
      const chimeGain = audioContext.createGain();
      
      chimeOsc1.connect(chimeGain);
      chimeOsc2.connect(chimeGain);
      chimeGain.connect(audioContext.destination);
      
      chimeOsc1.type = 'sine';
      chimeOsc2.type = 'sine';
      
      chimeOsc1.frequency.setValueAtTime(2093.00 * pitchMultiplier, audioContext.currentTime); // C7
      chimeOsc2.frequency.setValueAtTime(3135.96 * pitchMultiplier, audioContext.currentTime); // G7
      
      chimeGain.gain.setValueAtTime(0.2, audioContext.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
      
      chimeOsc1.start(audioContext.currentTime);
      chimeOsc2.start(audioContext.currentTime);
      chimeOsc1.stop(audioContext.currentTime + 1.5);
      chimeOsc2.stop(audioContext.currentTime + 1.5);
    }, 1200);
    
    warpOsc.start(audioContext.currentTime);
    ascendOsc1.start(audioContext.currentTime);
    ascendOsc2.start(audioContext.currentTime);
    
    warpOsc.stop(audioContext.currentTime + 2.0);
    ascendOsc1.stop(audioContext.currentTime + 2.0);
    ascendOsc2.stop(audioContext.currentTime + 2.0);
  } catch (error) {
    // Silently fail
  }
};

// Game-like surreal orbital ambience - matches the circular platform vision theme
export const createSpaceAmbience = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return;
  
  try {
    // Mystical orbital drone - pulsing like a heartbeat of the system
    const orbitalOsc = audioContext.createOscillator();
    const orbitalGain = audioContext.createGain();
    const orbitalFilter = audioContext.createBiquadFilter();
    const orbitalLFO = audioContext.createOscillator();
    const orbitalLFOGain = audioContext.createGain();
    
    orbitalLFO.connect(orbitalLFOGain);
    orbitalLFOGain.connect(orbitalGain.gain);
    orbitalOsc.connect(orbitalFilter);
    orbitalFilter.connect(orbitalGain);
    orbitalGain.connect(audioContext.destination);
    
    orbitalOsc.type = 'sawtooth';
    orbitalFilter.type = 'lowpass';
    orbitalFilter.frequency.setValueAtTime(150, audioContext.currentTime);
    orbitalFilter.Q.setValueAtTime(8, audioContext.currentTime);
    
    orbitalOsc.frequency.setValueAtTime(55, audioContext.currentTime); // Deep, mystical tone
    orbitalLFO.type = 'sine';
    orbitalLFO.frequency.setValueAtTime(0.3, audioContext.currentTime); // Slow pulsing
         orbitalLFOGain.gain.setValueAtTime(0.005, audioContext.currentTime);
     orbitalGain.gain.setValueAtTime(0.01, audioContext.currentTime);
    
    // Ethereal ring resonance - like energy flowing through the orbits
    const ringOsc1 = audioContext.createOscillator();
    const ringOsc2 = audioContext.createOscillator();
    const ringGain = audioContext.createGain();
    const ringFilter = audioContext.createBiquadFilter();
    const ringLFO = audioContext.createOscillator();
    const ringLFOGain = audioContext.createGain();
    
    ringLFO.connect(ringLFOGain);
    ringLFOGain.connect(ringFilter.frequency);
    ringOsc1.connect(ringFilter);
    ringOsc2.connect(ringFilter);
    ringFilter.connect(ringGain);
    ringGain.connect(audioContext.destination);
    
    ringOsc1.type = 'triangle';
    ringOsc2.type = 'sine';
    ringFilter.type = 'bandpass';
    ringFilter.frequency.setValueAtTime(400, audioContext.currentTime);
    ringFilter.Q.setValueAtTime(15, audioContext.currentTime);
    
    ringOsc1.frequency.setValueAtTime(220, audioContext.currentTime); // A3
    ringOsc2.frequency.setValueAtTime(330, audioContext.currentTime); // E4 - perfect fifth
    ringLFO.type = 'sine';
    ringLFO.frequency.setValueAtTime(0.7, audioContext.currentTime); // Gentle sweep
    ringLFOGain.gain.setValueAtTime(200, audioContext.currentTime);
         ringGain.gain.setValueAtTime(0.008, audioContext.currentTime);
    
    // Crystalline module sparkles - representing the orbiting modules
    const createModuleSparkle = (delay, frequency, pan = 0) => {
      setTimeout(() => {
        if (audioContext.state !== 'running') return;
        
        const sparkleOsc = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        const sparkleFilter = audioContext.createBiquadFilter();
        const sparklePanner = audioContext.createStereoPanner();
        
        sparkleOsc.connect(sparkleFilter);
        sparkleFilter.connect(sparkleGain);
        sparkleGain.connect(sparklePanner);
        sparklePanner.connect(audioContext.destination);
        
        sparkleOsc.type = 'sine';
        sparkleFilter.type = 'bandpass';
        sparkleFilter.frequency.setValueAtTime(frequency, audioContext.currentTime);
        sparkleFilter.Q.setValueAtTime(20, audioContext.currentTime);
        sparklePanner.pan.setValueAtTime(pan, audioContext.currentTime);
        
        sparkleOsc.frequency.setValueAtTime(frequency, audioContext.currentTime);
        sparkleOsc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioContext.currentTime + 0.8);
                 sparkleGain.gain.setValueAtTime(0.004, audioContext.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
        
        sparkleOsc.start(audioContext.currentTime);
        sparkleOsc.stop(audioContext.currentTime + 1.2);
      }, delay);
    };
    
    // Create sparkles for each module position (5 active + 5 future = 10 total)
    const moduleFrequencies = [880, 1174, 1568, 2093, 2637]; // Pentatonic scale
    for (let i = 0; i < 8; i++) {
      const freq = moduleFrequencies[i % 5];
      const pan = Math.sin((i / 8) * Math.PI * 2) * 0.7; // Circular panning
      createModuleSparkle(1000 + i * 800, freq, pan);
    }
    
    // Surreal wobble effect - like reality bending around the platform
    const wobbleOsc = audioContext.createOscillator();
    const wobbleGain = audioContext.createGain();
    const wobbleFilter = audioContext.createBiquadFilter();
    const wobbleLFO = audioContext.createOscillator();
    const wobbleLFOGain = audioContext.createGain();
    
    wobbleLFO.connect(wobbleLFOGain);
    wobbleLFOGain.connect(wobbleOsc.frequency);
    wobbleOsc.connect(wobbleFilter);
    wobbleFilter.connect(wobbleGain);
    wobbleGain.connect(audioContext.destination);
    
    wobbleOsc.type = 'triangle';
    wobbleFilter.type = 'highpass';
    wobbleFilter.frequency.setValueAtTime(800, audioContext.currentTime);
    wobbleFilter.Q.setValueAtTime(3, audioContext.currentTime);
    
    wobbleOsc.frequency.setValueAtTime(110, audioContext.currentTime);
    wobbleLFO.type = 'sine';
    wobbleLFO.frequency.setValueAtTime(0.13, audioContext.currentTime); // Very slow wobble
    wobbleLFOGain.gain.setValueAtTime(20, audioContext.currentTime);
         wobbleGain.gain.setValueAtTime(0.005, audioContext.currentTime);
     wobbleGain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 4);
     wobbleGain.gain.linearRampToValueAtTime(0.005, audioContext.currentTime + 8);
    
    // Start all oscillators
    orbitalOsc.start(audioContext.currentTime);
    orbitalLFO.start(audioContext.currentTime);
    ringOsc1.start(audioContext.currentTime);
    ringOsc2.start(audioContext.currentTime);
    ringLFO.start(audioContext.currentTime);
    wobbleOsc.start(audioContext.currentTime);
    wobbleLFO.start(audioContext.currentTime);
    
    // Stop all oscillators after 12 seconds
    orbitalOsc.stop(audioContext.currentTime + 12);
    orbitalLFO.stop(audioContext.currentTime + 12);
    ringOsc1.stop(audioContext.currentTime + 12);
    ringOsc2.stop(audioContext.currentTime + 12);
    ringLFO.stop(audioContext.currentTime + 12);
    wobbleOsc.stop(audioContext.currentTime + 12);
    wobbleLFO.stop(audioContext.currentTime + 12);
  } catch (error) {
    // Silently fail
  }
};

// Seamless looping space ambience - returns control object to start/stop
export const createSpaceAmbienceLoop = (audioContext) => {
  if (!audioContext || audioContext.state !== 'running') return null;
  
  let isPlaying = false;
  let oscillators = [];
  let gainNodes = [];
  let filterNodes = [];
  let allNodes = [];
  let sparkleTimeouts = [];
  
  const startLoop = () => {
    if (isPlaying) return;
    isPlaying = true;
    
    try {
      // Continuous mystical orbital drone
      const orbitalOsc = audioContext.createOscillator();
      const orbitalGain = audioContext.createGain();
      const orbitalFilter = audioContext.createBiquadFilter();
      const orbitalLFO = audioContext.createOscillator();
      const orbitalLFOGain = audioContext.createGain();
      
      orbitalLFO.connect(orbitalLFOGain);
      orbitalLFOGain.connect(orbitalGain.gain);
      orbitalOsc.connect(orbitalFilter);
      orbitalFilter.connect(orbitalGain);
      orbitalGain.connect(audioContext.destination);
      
      orbitalOsc.type = 'sawtooth';
      orbitalFilter.type = 'lowpass';
      orbitalFilter.frequency.setValueAtTime(150, audioContext.currentTime);
      orbitalFilter.Q.setValueAtTime(8, audioContext.currentTime);
      
      orbitalOsc.frequency.setValueAtTime(55, audioContext.currentTime);
      orbitalLFO.type = 'sine';
      orbitalLFO.frequency.setValueAtTime(0.3, audioContext.currentTime);
             orbitalLFOGain.gain.setValueAtTime(0.01, audioContext.currentTime);
       orbitalGain.gain.setValueAtTime(0.025, audioContext.currentTime);
      
      // Continuous ethereal ring resonance
      const ringOsc1 = audioContext.createOscillator();
      const ringOsc2 = audioContext.createOscillator();
      const ringGain = audioContext.createGain();
      const ringFilter = audioContext.createBiquadFilter();
      const ringLFO = audioContext.createOscillator();
      const ringLFOGain = audioContext.createGain();
      
      ringLFO.connect(ringLFOGain);
      ringLFOGain.connect(ringFilter.frequency);
      ringOsc1.connect(ringFilter);
      ringOsc2.connect(ringFilter);
      ringFilter.connect(ringGain);
      ringGain.connect(audioContext.destination);
      
      ringOsc1.type = 'triangle';
      ringOsc2.type = 'sine';
      ringFilter.type = 'bandpass';
      ringFilter.frequency.setValueAtTime(400, audioContext.currentTime);
      ringFilter.Q.setValueAtTime(15, audioContext.currentTime);
      
      ringOsc1.frequency.setValueAtTime(220, audioContext.currentTime);
      ringOsc2.frequency.setValueAtTime(330, audioContext.currentTime);
      ringLFO.type = 'sine';
      ringLFO.frequency.setValueAtTime(0.7, audioContext.currentTime);
      ringLFOGain.gain.setValueAtTime(200, audioContext.currentTime);
             ringGain.gain.setValueAtTime(0.02, audioContext.currentTime);
      
      // Continuous surreal wobble
      const wobbleOsc = audioContext.createOscillator();
      const wobbleGain = audioContext.createGain();
      const wobbleFilter = audioContext.createBiquadFilter();
      const wobbleLFO = audioContext.createOscillator();
      const wobbleLFOGain = audioContext.createGain();
      
      wobbleLFO.connect(wobbleLFOGain);
      wobbleLFOGain.connect(wobbleOsc.frequency);
      wobbleOsc.connect(wobbleFilter);
      wobbleFilter.connect(wobbleGain);
      wobbleGain.connect(audioContext.destination);
      
      wobbleOsc.type = 'triangle';
      wobbleFilter.type = 'highpass';
      wobbleFilter.frequency.setValueAtTime(800, audioContext.currentTime);
      wobbleFilter.Q.setValueAtTime(3, audioContext.currentTime);
      
      wobbleOsc.frequency.setValueAtTime(110, audioContext.currentTime);
      wobbleLFO.type = 'sine';
      wobbleLFO.frequency.setValueAtTime(0.13, audioContext.currentTime);
      wobbleLFOGain.gain.setValueAtTime(20, audioContext.currentTime);
             wobbleGain.gain.setValueAtTime(0.015, audioContext.currentTime);
      
      // Store all nodes for cleanup
      oscillators = [orbitalOsc, orbitalLFO, ringOsc1, ringOsc2, ringLFO, wobbleOsc, wobbleLFO];
      gainNodes = [orbitalGain, orbitalLFOGain, ringGain, ringLFOGain, wobbleGain, wobbleLFOGain];
      filterNodes = [orbitalFilter, ringFilter, wobbleFilter];
      allNodes = [...oscillators, ...gainNodes, ...filterNodes];
      
      // Start all oscillators - they will run indefinitely until stopped
      oscillators.forEach((osc, index) => {
        osc.start(audioContext.currentTime);
        console.log(`Started oscillator ${index} - will run indefinitely`);
      });
      
      // Continuous sparkle generation
      const sparkleLoop = () => {
        if (!isPlaying) return;
        
        const moduleFrequencies = [880, 1174, 1568, 2093, 2637];
        const freq = moduleFrequencies[Math.floor(Math.random() * moduleFrequencies.length)];
        const pan = Math.sin(Math.random() * Math.PI * 2) * 0.7;
        
        const sparkleOsc = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        const sparkleFilter = audioContext.createBiquadFilter();
        const sparklePanner = audioContext.createStereoPanner();
        
        sparkleOsc.connect(sparkleFilter);
        sparkleFilter.connect(sparkleGain);
        sparkleGain.connect(sparklePanner);
        sparklePanner.connect(audioContext.destination);
        
        sparkleOsc.type = 'sine';
        sparkleFilter.type = 'bandpass';
        sparkleFilter.frequency.setValueAtTime(freq, audioContext.currentTime);
        sparkleFilter.Q.setValueAtTime(20, audioContext.currentTime);
        sparklePanner.pan.setValueAtTime(pan, audioContext.currentTime);
        
        sparkleOsc.frequency.setValueAtTime(freq, audioContext.currentTime);
        sparkleOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.currentTime + 0.8);
                 sparkleGain.gain.setValueAtTime(0.01, audioContext.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
        
        sparkleOsc.start(audioContext.currentTime);
        sparkleOsc.stop(audioContext.currentTime + 1.2);
        
        // Schedule next sparkle
        const timeoutId = setTimeout(sparkleLoop, 2000 + Math.random() * 3000);
        sparkleTimeouts.push(timeoutId);
      };
      
      // Start sparkle loop
      sparkleLoop();
      
      // Keep audio context active
      const keepAliveInterval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(keepAliveInterval);
          return;
        }
        if (audioContext.state === 'suspended') {
          console.log('Audio context suspended, resuming...');
          audioContext.resume();
        }
        // Create a silent sound to keep context active
        const silentGain = audioContext.createGain();
        silentGain.gain.setValueAtTime(0, audioContext.currentTime);
        silentGain.connect(audioContext.destination);
        // Disconnect after a short delay
        setTimeout(() => {
          try {
            silentGain.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        }, 100);
      }, 5000); // Check every 5 seconds
      
      // Store interval for cleanup
      allNodes.keepAliveInterval = keepAliveInterval;
      
    } catch (error) {
      console.log('Seamless ambience error:', error);
    }
  };
  
  const stopLoop = () => {
    console.log('SpaceAmbience stopLoop called, isPlaying:', isPlaying);
    if (!isPlaying) return;
    isPlaying = false;
    
    // Clear all sparkle timeouts first
    const timeoutCount = sparkleTimeouts.length;
    sparkleTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    sparkleTimeouts = [];
    console.log(`Cleared ${timeoutCount} sparkle timeouts`);
    
    // Disconnect and stop all gain nodes immediately
    gainNodes.forEach((gain, index) => {
      try {
        gain.gain.cancelScheduledValues(audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.disconnect();
        console.log(`Silenced and disconnected gain node ${index}`);
      } catch (e) {
        console.log(`Error with gain node ${index}:`, e);
      }
    });
    
    // Stop and disconnect all oscillators immediately
    oscillators.forEach((osc, index) => {
      try {
        osc.disconnect();
        osc.stop(audioContext.currentTime);
        console.log(`Stopped and disconnected oscillator ${index}`);
      } catch (e) {
        console.log(`Error with oscillator ${index}:`, e);
      }
    });
    
    // Disconnect all filter nodes
    filterNodes.forEach((filter, index) => {
      try {
        filter.disconnect();
        console.log(`Disconnected filter node ${index}`);
      } catch (e) {
        console.log(`Error with filter node ${index}:`, e);
      }
    });
    
    // Clear keep-alive interval if exists
    if (allNodes.keepAliveInterval) {
      clearInterval(allNodes.keepAliveInterval);
      console.log('Cleared keep-alive interval');
    }
    
    // Clear arrays
    oscillators = [];
    gainNodes = [];
    filterNodes = [];
    allNodes = [];
    console.log('SpaceAmbience stopped and cleaned up');
  };
  
  return {
    start: startLoop,
    stop: stopLoop,
    isPlaying: () => isPlaying
  };
};

export const isAudioInitialized = () => audioInitialized;

// Update master volume when settings change
export const updateMasterVolume = () => {
  if (masterGainNode && globalAudioContext) {
    const volumeMultiplier = getVolumeMultiplier();
    masterGainNode.gain.setValueAtTime(volumeMultiplier, globalAudioContext.currentTime);
    console.log('Master volume updated to:', volumeMultiplier);
  }
};

