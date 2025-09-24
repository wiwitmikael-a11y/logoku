
// A robust service to play UI sound effects and BGM using the Web Audio API.
const GITHUB_ASSETS_URL = 'https://raw.githubusercontent.com/wiwitmikael-a11y/logoku-assets/main/';

// --- SFX Setup ---
export type SfxName = 'click' | 'select' | 'start' | 'success' | 'error' | 'hover' | 'typing' | 'transition';

// We'll load new sounds from URLs and keep the old ones as fallback/unreplaced.
const sfxFiles: Record<SfxName, string> = {
  click: `${GITHUB_ASSETS_URL}ui_click.mp3`,
  select: `${GITHUB_ASSETS_URL}ui_click.mp3`, // Re-use click sound for select
  start: `${GITHUB_ASSETS_URL}bouncy_loading.wav`,
  success: `${GITHUB_ASSETS_URL}generate_complete.wav`,
  hover: `${GITHUB_ASSETS_URL}ui_hover.mp3`,
  typing: `${GITHUB_ASSETS_URL}ui_typing.mp3`,
  transition: `${GITHUB_ASSETS_URL}ui_transition.mp3`,
  error: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEFGVAAAAQoAAAAAAAEAAAIABkF1ZGlvIFRvb2xraXQgMy4wLjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tAwBzaW5n/8EAAAACAAABAAmfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn//tAwBAlD8A/8EAAAACAAABAAmfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5',
};

// --- BGM Setup ---
export type BgmName = 'welcome' | 'main';
const bgmFiles: Record<BgmName, string> = {
  welcome: `${GITHUB_ASSETS_URL}bgm_welcome.mp3`,
  main: `${GITHUB_ASSETS_URL}bgm_utama.mp3`,
};

// --- Web Audio API State ---
let audioContext: AudioContext | null = null;
const sfxBuffers: Map<SfxName, AudioBuffer> = new Map();
const bgmBuffers: Map<BgmName, AudioBuffer> = new Map();
let isAudioUnlocked = false;
let isInitializing = false;
let sfxGainNode: GainNode | null = null;
let bgmGainNode: GainNode | null = null;
let bgmSourceNode: AudioBufferSourceNode | null = null;
let isBgmPlaying = false;

// --- Initialization ---
const initializeAudio = async () => {
  if (typeof window === 'undefined' || audioContext || isInitializing) return;

  isInitializing = true;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create master gain nodes for SFX and BGM
    sfxGainNode = audioContext.createGain();
    sfxGainNode.gain.setValueAtTime(0.7, audioContext.currentTime); // SFX at 70%
    sfxGainNode.connect(audioContext.destination);

    bgmGainNode = audioContext.createGain();
    bgmGainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // BGM at 30%
    bgmGainNode.connect(audioContext.destination);

    const allFilesToLoad = { ...sfxFiles, ...bgmFiles };

    const decodePromises = Object.entries(allFilesToLoad).map(async ([name, path]) => {
      try {
        const isBgm = name in bgmFiles;
        
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${path}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
        // FIX: The original code used a `targetMap` with a union type `Map<BgmName, ...> | Map<SfxName, ...>`,
        // which caused issues with .set() because the key type becomes an intersection (`never`).
        // By checking if the sound is BGM and calling .set() on the specific map (`bgmBuffers` or `sfxBuffers`), we resolve the type error.
        if (isBgm) {
            bgmBuffers.set(name as BgmName, audioBuffer);
        } else {
            sfxBuffers.set(name as SfxName, audioBuffer);
        }
      } catch (decodeError) {
        console.error(`Failed to load and decode sound '${name}' from ${path}:`, decodeError);
      }
    });

    await Promise.all(decodePromises);
    console.log("Sound service initialized and assets loaded.");
  } catch (error) {
    console.error("Failed to initialize Web Audio API:", error);
    audioContext = null;
  } finally {
    isInitializing = false;
  }
};

// --- Core Controls ---
export const unlockAudio = () => {
  if (isAudioUnlocked || !audioContext) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      isAudioUnlocked = true;
      console.log("Audio context resumed by user interaction.");
    }).catch(err => console.error("Failed to resume audio context:", err));
  } else {
    isAudioUnlocked = true;
  }
};

// --- SFX Player ---
export const playSound = (name: SfxName) => {
  if (!audioContext || !isAudioUnlocked || !sfxGainNode) {
    return;
  }
  const buffer = sfxBuffers.get(name);
  if (!buffer) {
    console.warn(`SFX '${name}' not found.`);
    return;
  }
  try {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(sfxGainNode);
    source.start(0);
  } catch (error) {
    console.error(`Error playing SFX '${name}':`, error);
  }
};

// --- BGM Player ---
export const playBGM = (name: BgmName, loop: boolean = true) => {
  if (!audioContext || !isAudioUnlocked || !bgmGainNode) return;
  
  stopBGM(); // Stop any currently playing BGM
  
  const buffer = bgmBuffers.get(name);
  if (!buffer) {
    console.warn(`BGM '${name}' not found.`);
    return;
  }
  
  bgmSourceNode = audioContext.createBufferSource();
  bgmSourceNode.buffer = buffer;
  bgmSourceNode.loop = loop;
  bgmSourceNode.connect(bgmGainNode);
  bgmSourceNode.start(0);
  isBgmPlaying = true;
};

export const stopBGM = () => {
    if (bgmSourceNode && isBgmPlaying) {
        bgmSourceNode.stop();
        bgmSourceNode.disconnect();
        bgmSourceNode = null;
        isBgmPlaying = false;
    }
};

export const toggleMuteBGM = (): boolean => {
    if (!audioContext || !bgmGainNode) return false; // Not playing
    
    const currentVolume = bgmGainNode.gain.value;
    const isCurrentlyMuted = currentVolume === 0;

    if (isCurrentlyMuted) {
        bgmGainNode.gain.setTargetAtTime(0.3, audioContext.currentTime, 0.01); // Restore to default volume
        return true; // Now playing
    } else {
        bgmGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01); // Mute
        return false; // Now muted
    }
};

// Initialize on load
initializeAudio();
