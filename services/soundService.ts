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
    click: `${GITHUB_ASSETS_URL}sounds/click.mp3`,
    hover: `${GITHUB_ASSETS_URL}sounds/hover.mp3`,
    select: `${GITHUB_ASSETS_URL}sounds/select.mp3`,
    typing: `${GITHUB_ASSETS_URL}sounds/typing.mp3`,
    transition: `${GITHUB_ASSETS_URL}sounds/transition.mp3`,
    start: `${GITHUB_ASSETS_URL}sounds/start.mp3`,
    success: `${GITHUB_ASSETS_URL}sounds/success.mp3`,
    error: `${GITHUB_ASSETS_URL}sounds/error.mp3`,
};

const bgmUrls = {
  welcome: `${GITHUB_ASSETS_URL}sounds/bgm_welcome.mp3`,
  main: `${GITHUB_ASSETS_URL}sounds/bgm_main.mp3`,
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
    if (currentBGM) {
        currentBGM.pause();
    }
    currentBGM = getAudio(bgmUrls[bgmName], true);
    currentBGM.volume = 0.3;
    if (!isMuted) {
        currentBGM.play().catch(() => {});
    }
};

export const stopBGM = (): void => {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM = null;
    }
};

// This will be managed by AuthContext
export const setMuted = (shouldMute: boolean) => {
    isMuted = shouldMute;
    if (currentBGM) {
        if(isMuted) {
            currentBGM.pause();
        } else {
            currentBGM.play().catch(() => {});
        }
    }
}
