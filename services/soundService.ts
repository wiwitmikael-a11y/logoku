const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

// We'll keep track of audio elements to manage them.
const audioCache: { [key: string]: HTMLAudioElement } = {};
let isMuted = false;
let isAudioUnlocked = false;
let currentBGM: HTMLAudioElement | null = null;

const getAudio = (src: string, isLoop = false): HTMLAudioElement => {
    if (audioCache[src]) {
        return audioCache[src];
    }
    const audio = new Audio(src);
    audio.loop = isLoop;
    audioCache[src] = audio;
    return audio;
};

const soundUrls = {
    click: `${GITHUB_ASSETS_URL}ui_click.mp3`,
    hover: `${GITHUB_ASSETS_URL}ui_hover.mp3`,
    select: `${GITHUB_ASSETS_URL}sounds/select.mp3`,
    typing: `${GITHUB_ASSETS_URL}sounds/typing.mp3`,
    transition: `${GITHUB_ASSETS_URL}ui_transition.mp3`,
    start: `${GITHUB_ASSETS_URL}sounds/start.mp3`,
    success: `${GITHUB_ASSETS_URL}Sukses.mp3`,
    error: `${GITHUB_ASSETS_URL}Gagal.mp3`,
    bounce: `${GITHUB_ASSETS_URL}bouncy_loading.wav`,
    puzzle_drop: `${GITHUB_ASSETS_URL}sounds/puzzle_drop.mp3`,
    puzzle_fail: `${GITHUB_ASSETS_URL}sounds/puzzle_fail.mp3`,
};

const bgmUrls = {
  welcome: `${GITHUB_ASSETS_URL}jingle_logoku.mp3?v=2`,
  Jingle: `${GITHUB_ASSETS_URL}jingle_logoku.mp3?v=2`,
  Acoustic: `${GITHUB_ASSETS_URL}bgm_Acoustic.mp3`,
  Uplifting: `${GITHUB_ASSETS_URL}bgm_Uplifting.mp3`,
  LoFi: `${GITHUB_ASSETS_URL}bgm_LoFi.mp3`,
  Bamboo: `${GITHUB_ASSETS_URL}bgm_Bamboo.mp3`,
  Ethnic: `${GITHUB_ASSETS_URL}bgm_Ethnic.mp3`,
  Cozy: `${GITHUB_ASSETS_URL}bgm_Cozy.mp3`,
};

/**
 * Browsers block audio until a user interaction. This function,
 * called on click/focus events, resumes the audio context.
 */
export const unlockAudio = async (): Promise<void> => {
    if (isAudioUnlocked || typeof window === 'undefined') return;
    try {
        // A simple way to get the context going.
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        isAudioUnlocked = true;
        
        // After unlocking, try to play the current BGM if it's supposed to be on and is currently paused.
        if (currentBGM && !isMuted && currentBGM.paused) {
            currentBGM.play().catch(() => {});
        }
    } catch (e) {
        console.error("Audio context could not be resumed.", e);
    }
};

/**
 * Sets up global, one-time event listeners to call unlockAudio() on the first
 * user interaction with the page. This is crucial for complying with browser
 * autoplay policies.
 */
const setupAudioUnlock = () => {
    if (typeof window === 'undefined') return;
    const unlockHandler = () => {
        unlockAudio();
    };
    // The { once: true } option automatically removes the listener after it runs.
    window.addEventListener('click', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });
};
setupAudioUnlock(); // Set up the listeners when the module is loaded.


type SoundName = keyof typeof soundUrls;
type BgmName = keyof typeof bgmUrls;

export const playSound = (soundName: SoundName): void => {
    if (isMuted) return;
    const sound = getAudio(soundUrls[soundName]);
    // Reduce volume specifically for the bounce sound
    if (soundName === 'bounce') {
      sound.volume = 0.05; // Drastically reduced volume for the loading bounce
    } else {
      sound.volume = 0.5;
    }
    sound.currentTime = 0;
    sound.play().catch(() => {}); // Ignore play errors if interrupted
};

export const playBGM = (bgmName: BgmName): void => {
    if (isMuted) {
        stopBGM();
        return;
    }
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
    }
    currentBGM = getAudio(bgmUrls[bgmName], true);
    // Set a consistent, subtle volume for ALL background music.
    currentBGM.volume = 0.15;
    currentBGM.play().catch(() => {});
};

let randomBgmPlaylist: BgmName[] = [];
const getMainBgmKeys = () => Object.keys(bgmUrls).filter(k => k !== 'welcome' && k !== 'Jingle') as BgmName[];

const playNextRandomTrack = () => {
    if (isMuted) {
        stopBGM();
        return;
    }
    if(randomBgmPlaylist.length === 0) {
        // Shuffle and create a new playlist
        randomBgmPlaylist = getMainBgmKeys().sort(() => 0.5 - Math.random());
    }
    const nextTrack = randomBgmPlaylist.shift()!;
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
    }
    currentBGM = getAudio(bgmUrls[nextTrack], false); // Don't loop, we use onended
    currentBGM.volume = 0.15;
    currentBGM.play().catch(() => {});
    currentBGM.onended = playNextRandomTrack;
}

export const playRandomBGM = () => {
    if (isMuted) {
        stopBGM();
        return;
    }
    randomBgmPlaylist = []; // Reset playlist
    playNextRandomTrack();
}


export const stopBGM = (): void => {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
        currentBGM = null;
    }
    randomBgmPlaylist = []; // Stop random playback loop
};

// This will be managed by AuthContext
export const setMuted = (shouldMute: boolean) => {
    isMuted = shouldMute;
    if (isMuted && currentBGM) {
        currentBGM.pause();
    }
}