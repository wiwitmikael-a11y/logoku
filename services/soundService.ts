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
    success: `${GITHUB_ASSETS_URL}generate_complete.mp3`,
    error: `${GITHUB_ASSETS_URL}ui_error.mp3`,
    bounce: `${GITHUB_ASSETS_URL}bouncy_loading.wav`,
};

const bgmUrls = {
  welcome: `${GITHUB_ASSETS_URL}bgm_welcome.mp3`,
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
        
        // After unlocking, try to play the current BGM if it's supposed to be on.
        if (currentBGM && !isMuted) {
            currentBGM.play().catch(() => {});
        }
    } catch (e) {
        console.error("Audio context could not be resumed.", e);
    }
};

type SoundName = keyof typeof soundUrls;
type BgmName = keyof typeof bgmUrls;

export const playSound = (soundName: SoundName): void => {
    if (isMuted) return;
    const sound = getAudio(soundUrls[soundName]);
    sound.volume = 0.5;
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
    currentBGM.volume = 0.15;
    currentBGM.play().catch(() => {});
};

let randomBgmPlaylist: BgmName[] = [];
const getMainBgmKeys = () => Object.keys(bgmUrls).filter(k => k !== 'welcome') as BgmName[];

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