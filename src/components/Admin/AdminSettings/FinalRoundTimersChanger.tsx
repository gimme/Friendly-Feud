import { debounce } from "@/lib/utils";
import { Game, WSEvent } from "@/types/game";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface FinalRoundTimersChangerProps {
  game: Game;
  setGame: Dispatch<SetStateAction<Game | null>>;
  send: (data: WSEvent) => void;
}

const TIMER_INDICES = [0, 1] as const;

export default function FinalRoundTimersChanger({ game, setGame, send }: FinalRoundTimersChangerProps) {
  const { t } = useTranslation();
  const timers = game.final_round_timers;
  const loaded = timers != null;

  const handleChange = (index: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setGame((prevGame) => {
      if (prevGame === null || prevGame.final_round_timers == null) return prevGame;
      if (prevGame.final_round_timers[index] === parsed) return prevGame;
      const updatedTimers = [...prevGame.final_round_timers];
      updatedTimers[index] = parsed;
      const updatedGame = {
        ...prevGame,
        final_round_timers: updatedTimers,
      };
      send({ action: "data", data: updatedGame });
      return updatedGame;
    });
  };

  return (
    <div className="flex flex-row items-center space-x-3">
      <p className="text-xl text-foreground">{t("Final Round Timers")}:</p>
      {TIMER_INDICES.map((index) => (
        <label key={index} className="flex flex-col text-sm text-secondary-900">
          {t("timer")} {t("number", { count: index + 1 })}
          <input
            key={loaded ? `loaded-${index}` : `empty-${index}`}
            id={`finalRound${index + 1}TimerSettingsInput`}
            type="number"
            min="0"
            className="w-20 rounded border-4 bg-secondary-500 p-1 text-xl text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={loaded ? timers[index] : ""}
            disabled={!loaded}
            onChange={debounce(handleChange(index))}
          />
        </label>
      ))}
    </div>
  );
}
