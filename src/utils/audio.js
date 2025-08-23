// High-quality arcade-style audio system with satisfying, dopamine-inducing sounds
let audioContext;
let masterGainNode;
let compressor;
let reverb;
let isInitialized = false;

// Create reverb impulse response
const createReverbBuffer = (duration = 0.5, decay = 2) => {
  const length = audioContext.sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
};

// Initialize audio context with effects chain
export const initializeAudio = async () => {
  if (isInitialized) return true;
  
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create effects chain
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Create convolution reverb
    reverb = audioContext.createConvolver();
    reverb.buffer = createReverbBuffer(0.3, 2);
    
    // Create master gain
    masterGainNode = audioContext.createGain();
    
    // Create reverb send
    const reverbGain = audioContext.createGain();
    reverbGain.gain.value = 0.15; // Subtle reverb
    
    // Connect effects chain
    masterGainNode.connect(compressor);
    compressor.connect(audioContext.destination);
    
    // Reverb send
    masterGainNode.connect(reverbGain);
    reverbGain.connect(reverb);
    reverb.connect(audioContext.destination);
    
    // Set volume from settings
    const settings = JSON.parse(localStorage.getItem('warehouseSettings') || '{}');
    masterGainNode.gain.value = (settings.volumeLevel || 75) / 100;
    
    // Resume if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Audio initialization failed:', error);
    return false;
  }
};

export const isAudioInitialized = () => isInitialized;

// Update master volume
export const updateMasterVolume = (volume) => {
  if (masterGainNode) {
    masterGainNode.gain.value = volume / 100;
  }
};

// Check if sounds should play
const shouldPlaySound = () => {
  const settings = JSON.parse(localStorage.getItem('warehouseSettings') || '{}');
  return settings.soundEffects !== false;
};

// Game-style sound effects
export const playSound = async (type) => {
  if (!shouldPlaySound()) return;
  
  if (!isInitialized) {
    await initializeAudio();
  }
  
  if (!audioContext || audioContext.state !== 'running') {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }
  
  switch (type) {
    case 'click':
      playClickSound();
      break;
    case 'success':
      playSuccessSound();
      break;
    case 'error':
      playErrorSound();
      break;
    case 'hover':
      playHoverSound();
      break;
    case 'complete':
      playCompleteSound();
      break;
    case 'combo':
      playComboSound();
      break;
    case 'transition':
      playTransitionSound();
      break;
    case 'tick':
      playTickSound();
      break;
    case 'powerup':
      playPowerUpSound();
      break;
    case 'levelup':
      playLevelUpSound();
      break;
    case 'scan':
      playScanSound();
      break;
    default:
      playClickSound();
  }
};

// Power-up sound - energy surge
const playPowerUpSound = () => {
  const now = audioContext.currentTime;
  
  // Energy surge sweep
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(100, now);
  osc1.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
  osc1.frequency.setValueAtTime(2000, now + 0.1);
  osc1.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(5000, now + 0.2);
  filter.Q.value = 10;
  
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.setValueAtTime(0.3, now + 0.1);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  
  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(masterGainNode);
  
  // Harmonic resonance
  for (let i = 1; i <= 4; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25 * i, now + 0.05);
    
    gain.gain.setValueAtTime(0.1 / i, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(masterGainNode);
    
    osc.start(now + 0.05);
    osc.stop(now + 0.4);
  }
  
  osc1.start(now);
  osc1.stop(now + 0.4);
};

// Level up sound - triumphant crescendo
const playLevelUpSound = () => {
  const now = audioContext.currentTime;
  const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major scale
  
  // Ascending glissando
  const gliss = audioContext.createOscillator();
  const glissGain = audioContext.createGain();
  
  gliss.type = 'sawtooth';
  gliss.frequency.setValueAtTime(200, now);
  gliss.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
  
  glissGain.gain.setValueAtTime(0.2, now);
  glissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  
  gliss.connect(glissGain);
  glissGain.connect(masterGainNode);
  
  // Melodic flourish
  melody.forEach((freq, i) => {
    const delay = i * 0.06;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + delay);
    
    gain.gain.setValueAtTime(0.2, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.4);
    
    osc.connect(gain);
    gain.connect(masterGainNode);
    
    osc.start(now + delay);
    osc.stop(now + delay + 0.5);
  });
  
  gliss.start(now);
  gliss.stop(now + 0.6);
};

// Scan sound - futuristic beep
const playScanSound = () => {
  const now = audioContext.currentTime;
  
  // Main scan beep
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1500, now);
  osc1.frequency.exponentialRampToValueAtTime(2000, now + 0.05);
  osc1.frequency.setValueAtTime(2000, now + 0.05);
  osc1.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
  
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.setValueAtTime(0.3, now + 0.08);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc1.connect(gain1);
  gain1.connect(masterGainNode);
  
  // Echo beep
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2000, now + 0.1);
  
  gain2.gain.setValueAtTime(0.15, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  
  osc2.connect(gain2);
  gain2.connect(masterGainNode);
  
  osc1.start(now);
  osc2.start(now + 0.1);
  
  osc1.stop(now + 0.15);
  osc2.stop(now + 0.2);
};

// Ultra-satisfying arcade click - layered with harmonics
const playClickSound = () => {
  const now = audioContext.currentTime;
  
  // Main click - punchy attack
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  const filter1 = audioContext.createBiquadFilter();
  
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(2400, now);
  osc1.frequency.exponentialRampToValueAtTime(600, now + 0.03);
  
  filter1.type = 'lowpass';
  filter1.frequency.setValueAtTime(3000, now);
  filter1.Q.value = 5;
  
  gain1.gain.setValueAtTime(0.4, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
  
  osc1.connect(filter1);
  filter1.connect(gain1);
  gain1.connect(masterGainNode);
  
  // Sub bass thump for satisfaction
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(150, now);
  osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);
  
  gain2.gain.setValueAtTime(0.5, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc2.connect(gain2);
  gain2.connect(masterGainNode);
  
  // Harmonic sparkle
  const osc3 = audioContext.createOscillator();
  const gain3 = audioContext.createGain();
  
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(4800, now);
  osc3.frequency.exponentialRampToValueAtTime(3600, now + 0.02);
  
  gain3.gain.setValueAtTime(0.15, now);
  gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
  
  osc3.connect(gain3);
  gain3.connect(masterGainNode);
  
  // Start all oscillators
  osc1.start();
  osc2.start();
  osc3.start();
  
  osc1.stop(now + 0.1);
  osc2.stop(now + 0.15);
  osc3.stop(now + 0.05);
};

// Epic arcade success - magical ascending arpeggio with shimmer
const playSuccessSound = () => {
  const now = audioContext.currentTime;
  const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C-E-G-C-E
  
  // Main arpeggio with rich harmonics
  frequencies.forEach((freq, i) => {
    const delay = i * 0.05; // Faster cascade
    
    // Primary tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now + delay);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, now + delay);
    filter.Q.value = 0.5;
    
    gain1.gain.setValueAtTime(0, now + delay);
    gain1.gain.linearRampToValueAtTime(0.3, now + delay + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.8);
    
    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(masterGainNode);
    
    // Octave harmony
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now + delay);
    
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.1, now + delay + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.6);
    
    osc2.connect(gain2);
    gain2.connect(masterGainNode);
    
    // Shimmer effect
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now + delay);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(7, now + delay); // 7Hz tremolo
    lfoGain.gain.value = 0.5;
    
    lfo.connect(lfoGain);
    lfoGain.connect(gain3.gain);
    
    gain3.gain.setValueAtTime(0.05, now + delay);
    
    osc3.connect(gain3);
    gain3.connect(masterGainNode);
    
    // Start all
    osc1.start(now + delay);
    osc2.start(now + delay);
    osc3.start(now + delay);
    lfo.start(now + delay);
    
    osc1.stop(now + delay + 1);
    osc2.stop(now + delay + 0.8);
    osc3.stop(now + delay + 0.6);
    lfo.stop(now + delay + 0.6);
  });
  
  // Bass foundation
  const bass = audioContext.createOscillator();
  const bassGain = audioContext.createGain();
  
  bass.type = 'sine';
  bass.frequency.setValueAtTime(130.81, now); // Low C
  
  bassGain.gain.setValueAtTime(0.4, now);
  bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
  
  bass.connect(bassGain);
  bassGain.connect(masterGainNode);
  
  bass.start(now);
  bass.stop(now + 1);
};

// Arcade error sound - descending with wobble, still pleasant
const playErrorSound = () => {
  const now = audioContext.currentTime;
  
  // Main descending tone with slight dissonance
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(400, now);
  osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  osc1.frequency.setValueAtTime(200, now + 0.15);
  osc1.frequency.exponentialRampToValueAtTime(150, now + 0.3);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);
  filter.Q.value = 5;
  
  gain1.gain.setValueAtTime(0.2, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(masterGainNode);
  
  // Wobble effect
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(6, now);
  lfoGain.gain.setValueAtTime(20, now);
  
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  
  // Sub bass for body
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(100, now);
  osc2.frequency.exponentialRampToValueAtTime(50, now + 0.3);
  
  gain2.gain.setValueAtTime(0.3, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc2.connect(gain2);
  gain2.connect(masterGainNode);
  
  // Start all
  osc1.start(now);
  osc2.start(now);
  lfo.start(now);
  
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
  lfo.stop(now + 0.3);
};

// Subtle hover sound - crystalline ping
const playHoverSound = () => {
  const now = audioContext.currentTime;
  
  // High frequency metallic ping
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2000, now);
  osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.03);
  
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.Q.value = 10;
  
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(masterGainNode);
  
  // Harmonic shimmer
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(4000, now);
  
  gain2.gain.setValueAtTime(0.06, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
  
  osc2.connect(gain2);
  gain2.connect(masterGainNode);
  
  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + 0.1);
  osc2.stop(now + 0.06);
};

// Epic completion sound - triumphant arcade fanfare
const playCompleteSound = () => {
  const now = audioContext.currentTime;
  const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C-E-G-C-E-G
  
  // Triumphant fanfare with orchestral feel
  melody.forEach((freq, i) => {
    const delay = i * 0.08;
    
    // Main brass-like tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now + delay);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000 + i * 200, now + delay);
    filter.Q.value = 2;
    
    gain1.gain.setValueAtTime(0, now + delay);
    gain1.gain.linearRampToValueAtTime(0.35, now + delay + 0.05);
    gain1.gain.setValueAtTime(0.35, now + delay + 0.2);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.2);
    
    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(masterGainNode);
    
    // String-like harmony
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 0.5, now + delay);
    
    gain2.gain.setValueAtTime(0.2, now + delay);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 1);
    
    osc2.connect(gain2);
    gain2.connect(masterGainNode);
    
    osc1.start(now + delay);
    osc2.start(now + delay);
    
    osc1.stop(now + delay + 1.2);
    osc2.stop(now + delay + 1);
  });
  
  // Victory chord at the end
  setTimeout(() => {
    const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
    chordFreqs.forEach(freq => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.6);
      
      gain.gain.setValueAtTime(0.3, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      
      osc.connect(gain);
      gain.connect(masterGainNode);
      
      osc.start(now + 0.6);
      osc.stop(now + 2);
    });
  }, 600);
};

// Arcade combo sound - cascading coins
const playComboSound = () => {
  const now = audioContext.currentTime;
  const frequencies = [1046.50, 1174.66, 1318.51, 1396.91, 1567.98]; // High pitched cascade
  
  frequencies.forEach((freq, i) => {
    const delay = i * 0.05;
    
    // Coin-like metallic sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Fundamental
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, now + delay);
    
    // Metallic overtone
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 2.7, now + delay);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, now + delay);
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(0.25, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainNode);
    
    osc1.start(now + delay);
    osc2.start(now + delay);
    
    osc1.stop(now + delay + 0.2);
    osc2.stop(now + delay + 0.2);
  });
};

// Smooth transition sound - futuristic swoosh
const playTransitionSound = () => {
  const now = audioContext.currentTime;
  
  // Rising swoosh with filter sweep
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(100, now);
  osc1.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(5000, now + 0.15);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);
  filter.Q.value = 5;
  
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
  gain1.gain.setValueAtTime(0.2, now + 0.15);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(masterGainNode);
  
  // White noise swoosh
  const noise = audioContext.createBufferSource();
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.25, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  
  noise.buffer = noiseBuffer;
  
  const noiseGain = audioContext.createGain();
  const noiseFilter = audioContext.createBiquadFilter();
  
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(500, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
  noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.25);
  noiseFilter.Q.value = 2;
  
  noiseGain.gain.setValueAtTime(0.05, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGainNode);
  
  osc1.start(now);
  noise.start(now);
  
  osc1.stop(now + 0.25);
  noise.stop(now + 0.25);
};

// Satisfying tick sound - mechanical precision
const playTickSound = () => {
  const now = audioContext.currentTime;
  
  // Click transient
  const clickOsc = audioContext.createOscillator();
  const clickGain = audioContext.createGain();
  
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(4000, now);
  
  clickGain.gain.setValueAtTime(0.15, now);
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
  
  clickOsc.connect(clickGain);
  clickGain.connect(masterGainNode);
  
  // Tonal body
  const toneOsc = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  toneOsc.type = 'triangle';
  toneOsc.frequency.setValueAtTime(1500, now);
  toneOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
  
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1250, now);
  filter.Q.value = 10;
  
  toneGain.gain.setValueAtTime(0.2, now);
  toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  toneOsc.connect(filter);
  filter.connect(toneGain);
  toneGain.connect(masterGainNode);
  
  clickOsc.start(now);
  toneOsc.start(now);
  
  clickOsc.stop(now + 0.02);
  toneOsc.stop(now + 0.1);
};