import { SoundName } from "@/lib/sounds";
import { WSEvent } from "@/src/types/game";
import { Music } from "lucide-react";
import { useEffect, useState } from "react";

interface SoundboardProps {
  send: (data: WSEvent) => void;
}

interface SoundboardEntry {
  name: SoundName;
  label: string;
  loop?: boolean;
}

const SOUNDBOARD_SOUNDS: SoundboardEntry[] = [
  // Title music intentionally omitted: handled by the TitleMusic control.
  { name: "theme", label: "Theme", loop: true },
  { name: "theme-no-intro", label: "Theme II" },
  { name: "round-victory", label: "Round Win" },
  { name: "fm-victory", label: "FM Win" },
];

type LoopState = Record<string, boolean>;

export default function Soundboard({ send }: SoundboardProps) {
  const [loopPlaying, setLoopPlaying] = useState<LoopState>({});
  const [isOpen, setIsOpen] = useState(false);

  const isAnyPlaying = Object.values(loopPlaying).some(Boolean);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 min-w-48 rounded-lg border-2 border-secondary-500 bg-secondary-200 p-3 shadow-xl">
          <div className="flex flex-col space-y-2">
            {SOUNDBOARD_SOUNDS.map((sound) => (
              <button
                key={sound.name}
                className={`w-full rounded border-2 px-4 py-2 text-sm font-semibold ${
                  loopPlaying[sound.name]
                    ? "border-failure-500 bg-failure-200 text-foreground"
                    : "border-secondary-500 bg-secondary-300 text-foreground"
                }`}
                onClick={() => {
                  const isPlaying = loopPlaying[sound.name];
                  // Stop all currently playing sounds
                  for (const other of SOUNDBOARD_SOUNDS) {
                    if (loopPlaying[other.name]) {
                      send({ action: "stop_sound", data: other.name });
                    }
                  }
                  if (!isPlaying) {
                    send({
                      action: "play_sound",
                      data: sound.loop ? { name: sound.name, loop: true } : sound.name,
                    });
                  }
                  setLoopPlaying({ [sound.name]: !isPlaying });
                }}
              >
                {loopPlaying[sound.name] ? "\u25A0" : "\u25B6"} {sound.label}
              </button>
            ))}
          </div>
          <div className="absolute -bottom-2 right-5 size-3 rotate-45 border-b-2 border-r-2 border-secondary-500 bg-secondary-200" />
        </div>
      )}
      <button
        aria-label="Soundboard"
        className={`size-14 rounded-full border-2 shadow-lg ${
          isAnyPlaying
            ? "animate-pulse border-primary-700 bg-primary-500 text-white"
            : "border-secondary-500 bg-secondary-300 text-foreground"
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Music className="mx-auto size-6" />
      </button>
    </div>
  );
}
