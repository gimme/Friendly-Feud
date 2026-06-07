const ONESHOT_SOUNDS = {
  wrong: "wrong.mp3",
  "good-answer": "good-answer.mp3",
  "fm-answer-reveal": "fm-answer-reveal.mp3",
  duplicate: "duplicate.mp3",
  ding: "ding.mp3",
  "try-again": "try-again.mp3",
  "fm-complete": "fm-complete.mp3",
  buzzer: "buzzer.mp3",
} as const;

const MANAGED_SOUNDS = {
  // Title music is owned by upstream's TitleMusic component (supports custom
  // uploads via title_music_url) and played from game.tsx via titleMusicRef.
  "fm-tension": "fm-tension.mp3",
  theme: "theme.mp3",
  "theme-no-intro": "theme-no-intro.mp3",
  "round-victory": "round-victory.mp3",
  "fm-victory": "fm-victory.mp3",
} as const;

type OneshotName = keyof typeof ONESHOT_SOUNDS;
type ManagedName = keyof typeof MANAGED_SOUNDS;
export type SoundName = OneshotName | ManagedName;

export interface PlayOptions {
  startTime?: number;
  loop?: boolean;
}

let audioCtx: AudioContext | null = null;
const buffers = new Map<OneshotName, AudioBuffer>();
const managed = new Map<ManagedName, HTMLAudioElement>();
let initialized = false;

function ensureResumed() {
  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
}

async function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  audioCtx = new AudioContext();

  // Safety net: resume context on first user gesture if it started suspended
  const resumeOnGesture = () => {
    ensureResumed();
    document.removeEventListener("click", resumeOnGesture);
    document.removeEventListener("pointerdown", resumeOnGesture);
  };
  document.addEventListener("click", resumeOnGesture);
  document.addEventListener("pointerdown", resumeOnGesture);

  // Fetch and decode all one-shot sound effects in parallel
  await Promise.all(
    (Object.entries(ONESHOT_SOUNDS) as [OneshotName, string][]).map(async ([name, file]) => {
      try {
        const response = await fetch(`/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx!.decodeAudioData(arrayBuffer);
        buffers.set(name, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound "${name}" (${file}):`, error);
      }
    })
  );
}

function isManaged(name: string): name is ManagedName {
  return name in MANAGED_SOUNDS;
}

function play(name: SoundName, options?: PlayOptions) {
  if (isManaged(name)) {
    playManaged(name, options);
    return;
  }

  if (!audioCtx) return;
  const buffer = buffers.get(name);
  if (!buffer) return;

  ensureResumed();
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

function playManaged(name: ManagedName, options?: PlayOptions) {
  let el = managed.get(name);
  if (!el) {
    el = new Audio(MANAGED_SOUNDS[name]);
    managed.set(name, el);
  }
  el.loop = options?.loop ?? false;
  if (options?.startTime !== undefined) {
    el.currentTime = options.startTime;
  }
  el.play();
}

function stop(name: SoundName) {
  if (!isManaged(name)) return;
  const el = managed.get(name);
  if (el) {
    el.pause();
    el.currentTime = 0;
  }
}

function dispose() {
  for (const el of managed.values()) {
    el.pause();
  }
  managed.clear();
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
  buffers.clear();
  initialized = false;
}

export const SoundManager = { init, play, stop, dispose };
