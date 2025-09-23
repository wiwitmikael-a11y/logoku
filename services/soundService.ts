// A robust service to play UI sound effects using the Web Audio API.
// This approach is more reliable for handling browser autoplay policies.

// Define the types of sounds we can play.
type SoundName = 'click' | 'select' | 'start' | 'success' | 'error';

// A dictionary of our sound effects with valid, audible data.
const sounds: Record<SoundName, string> = {
  click: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAU8AAAACAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZAw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZBw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZB48AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDQ8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDY8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4',
  select: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAU8AAAACAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZAw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZBw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZB48AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDQ8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDY8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4',
  start: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAU8AAAACAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZAw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZBw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZB48AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDQ8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDY8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4',
  success: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAU8AAAACAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZAw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZBw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZB48AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDQ8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDY8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4',
  error: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAU8AAAACAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZAw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZBw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZB48AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZCg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDQ8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDY8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDg8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZDw8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEA8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4//uQZEI8AAAAEAAADSAAAAoEVR4aY5Q4f/j5cbhs/DEAhgYAINo2cDAyQZOTEFCiA6iUIiIdAHz4',
};

let audioContext: AudioContext | null = null;
const audioBuffers: Map<SoundName, AudioBuffer> = new Map();
let isAudioUnlocked = false;
let isInitializing = false;

// Function to initialize the AudioContext and pre-decode sounds.
const initializeAudio = async () => {
  if (typeof window === 'undefined' || audioContext || isInitializing) return;

  isInitializing = true;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Decode all sounds into AudioBuffers for performance.
    const decodePromises = Object.entries(sounds).map(async ([name, data]) => {
      try {
        const response = await fetch(data);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
        audioBuffers.set(name as SoundName, audioBuffer);
      } catch (decodeError) {
        console.error(`Failed to decode sound '${name}':`, decodeError);
        // We continue even if one sound fails to decode.
      }
    });

    await Promise.all(decodePromises);
    console.log("Sound service initialized.");
  } catch (error) {
    console.error("Failed to initialize Web Audio API:", error);
    // If initialization fails, we disable the audio system.
    audioContext = null;
  } finally {
    isInitializing = false;
  }
};

/**
 * Unlocks the browser's audio context.
 * This is the standard way to handle browser autoplay policies.
 * It MUST be called from a user-initiated event (e.g., a click).
 */
export const unlockAudio = () => {
  if (isAudioUnlocked || !audioContext) {
    return;
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      isAudioUnlocked = true;
      console.log("Audio context resumed by user interaction.");
    }).catch(err => {
      console.error("Failed to resume audio context:", err);
    });
  } else {
      isAudioUnlocked = true; // Already running
  }
};

/**
 * Plays a pre-decoded sound effect.
 * @param name The name of the sound to play.
 */
export const playSound = (name: SoundName) => {
  if (!audioContext || !isAudioUnlocked) {
    // If the context is not unlocked, we can't play sounds triggered by logic (like 'success').
    // User-triggered sounds like 'click' might still work if they also call unlockAudio.
    if (!isAudioUnlocked) {
      // This warning is helpful for debugging but can be noisy.
      // console.warn(`Cannot play sound '${name}'. Audio is not unlocked yet. A user interaction is required.`);
    }
    return;
  }

  const buffer = audioBuffers.get(name);
  if (!buffer) {
    console.warn(`Sound '${name}' not found or not decoded.`);
    return;
  }

  try {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Create a GainNode to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.7, audioContext.currentTime); // Set volume to 70%

    // Connect source -> gain -> destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
  } catch (error) {
    console.error(`Error playing sound '${name}':`, error);
  }
};

// Initialize the audio service when the module is loaded.
initializeAudio();