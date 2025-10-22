// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const audioCache: { [key: string]: HTMLAudioElement } = {};
let isMuted = localStorage.getItem('desainfun_isMuted') === 'true';
let audioCtx: AudioContext | null = null;
let currentBGM: HTMLAudioElement | null = null;
let randomBgmPlaylist: BgmName[] = [];

// --- Audio Context Management ---
const initializeAudioContext = (): void => {
    if (!audioCtx && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
};

export const getAudioContext = (): AudioContext | null => {
    if (!audioCtx) initializeAudioContext();
    return audioCtx;
};

export const resumeAudioContext = async (): Promise<void> => {
    const context = getAudioContext();
    if (context && context.state === 'suspended') {
        try {
            await context.resume();
            // If there's a BGM that should be playing, try to play it now.
            if (currentBGM && !isMuted && currentBGM.paused) {
                 currentBGM.play().catch(() => {});
            }
        } catch (e) {
            console.error("Audio context could not be resumed.", e);
        }
    }
};

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
  welcome: `${GITHUB_ASSETS_URL}jingle_desainfun.mp3?v=2`,
  Jingle: `${GITHUB_ASSETS_URL}jingle_desainfun.mp3?v=2`,
  Acoustic: `${GITHUB_ASSETS_URL}bgm_Acoustic.mp3`,
  Uplifting: `${GITHUB_ASSETS_URL}bgm_Uplifting.mp3`,
  LoFi: `${GITHUB_ASSETS_URL}bgm_LoFi.mp3`,
  Bamboo: `${GITHUB_ASSETS_URL}bgm_Bamboo.mp3`,
  Ethnic: `${GITHUB_ASSETS_URL}bgm_Ethnic.mp3`,
  Cozy: `${GITHUB_ASSETS_URL}bgm_Cozy.mp3`,
};

/**
 * @deprecated The useAudioContextManager hook now handles this automatically.
 * This function remains for explicit calls but is less necessary.
 */
export const unlockAudio = async (): Promise<void> => {
    await resumeAudioContext();
};

type SoundName = keyof typeof soundUrls;
type BgmName = keyof typeof bgmUrls;

export const playSound = (soundName: SoundName): void => {
    if (isMuted) return;
    resumeAudioContext();
    const sound = getAudio(soundUrls[soundName]);
    sound.volume = soundName === 'bounce' ? 0.2 : 0.5;
    sound.currentTime = 0;
    sound.play().catch(() => {});
};

export const playBGM = (bgmName: BgmName): void => {
    if (isMuted) { stopBGM(); return; }
    resumeAudioContext();
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
    }
    currentBGM = getAudio(bgmUrls[bgmName], true);
    currentBGM.volume = 0.1;
    currentBGM.play().catch(() => {});
};

const getMainBgmKeys = () => Object.keys(bgmUrls).filter(k => k !== 'welcome' && k !== 'Jingle') as BgmName[];

const playNextRandomTrack = () => {
    if (isMuted) { stopBGM(); return; }
    if(randomBgmPlaylist.length === 0) {
        randomBgmPlaylist = getMainBgmKeys().sort(() => 0.5 - Math.random());
    }
    const nextTrack = randomBgmPlaylist.shift()!;
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
    }
    currentBGM = getAudio(bgmUrls[nextTrack], false);
    currentBGM.volume = 0.1;
    currentBGM.play().catch(() => {});
    currentBGM.onended = playNextRandomTrack;
}

export const playRandomBGM = () => {
    if (isMuted) { stopBGM(); return; }
    resumeAudioContext();
    randomBgmPlaylist = [];
    playNextRandomTrack();
}

export const stopBGM = (): void => {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.onended = null;
        currentBGM = null;
    }
    randomBgmPlaylist = [];
};

export const getIsMuted = (): boolean => isMuted;

export const setMuted = (shouldMute: boolean) => {
    isMuted = shouldMute;
    localStorage.setItem('desainfun_isMuted', String(shouldMute));
    if (isMuted && currentBGM) {
        currentBGM.pause();
    }
};

// Initialize the context when the module loads.
initializeAudioContext();