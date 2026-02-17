import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";
import { PlayerSlot } from "../types/playerType";
import PlayerState from "./PlayerState";

import player1Thinking from "../assets/players/state/player1-thinking.png";
import player2Thinking from "../assets/players/state/player2-thinking.png";
import player1Chilling from "../assets/players/state/player1-chilling.png";
import player2Chilling from "../assets/players/state/player2-chilling.png";
import sendButton from "../assets/buttons/send-button.svg";
import { CountdownTimer } from "./CountdownTimer";

export default function PlayingPhase() {
  const { playingPhaseData, allPlayerData, clientPlayerData, isLoading: hubLoading, room, sendAnswer } = useGameHub();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (hubLoading) return <p>Loading hub connection...</p>;
  if (!playingPhaseData) return <p>No playing phase data yet...</p>;

  const handleSubmit = () => {
    if (selectedIdx !== null) {
      sendAnswer(room.code, selectedIdx);
      setIsTimerRunning(false);
    }
  };

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  const isPlayerReady =
    (clientPlayerData.slot == PlayerSlot.Player1 && allPlayerData.player1?.isReady) ||
    (clientPlayerData.slot == PlayerSlot.Player2 && allPlayerData.player2?.isReady);

  return (
    <div className="h-screen w-screen flex flex-col ">
      <div className="h-full w-full grid grid-rows-8">
        <div className="row-span-2 flex flex-col justify-between items-center pt-18">
             <CountdownTimer
                initialSeconds={180}
                isRunning={isTimerRunning}
                onComplete={() => alert("Time's up!")}
              />;

            <h2 className="text-5xl mb-4">Two truths hide one lie, can you uncover it?</h2>
        </div>

        <div className="row-span-6 flex flex-col items-center justify-between">
          <div className="flex justify-between w-11/12">

            <PlayerState
              name={allPlayerData.player1?.name}
              score={allPlayerData.player1Score}
              isReady={allPlayerData.player1?.isReady ?? false}
              readyImg={player1Chilling}
              notReadyImg={player1Thinking}
            />
            
            <div className="flex flex-col w-full items-center justify-center py-12">
              <div className="w-4/5 bg-platinum rounded-3xl border-4 border-heathered-grey p-6 outline-2 -outline-offset-7 outline-heathered-grey">
                <div className="flex flex-col gap-y-2">

                <ul className="space-y-3 p-4">
                  {playingPhaseData.opponentStatements.map((opt) => (
                    <li key={opt.idx}>
                      <span
                        className={`rounded cursor-pointer transition text-xl
                          ${
                            selectedIdx === opt.idx || (isPlayerReady && playingPhaseData.playerAnswer === opt.idx) ? "red-highlight" : ""
                          } ${
                            isPlayerReady ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() => !isPlayerReady && setSelectedIdx(opt.idx)}
                      >
                        {opt.description}
                      </span>
                    </li>
                  ))}
                </ul>

                </div>
              </div>
            </div>

            <PlayerState
              name={allPlayerData.player2?.name}
              score={allPlayerData.player2Score}
              isReady={allPlayerData.player2?.isReady ?? false}
              readyImg={player2Chilling}
              notReadyImg={player2Thinking}
              isFlipped={true}
            />
          </div>

          <div className="pb-12">
            {isPlayerReady ? (
              <p className="text-3xl">
                Waiting opponent's decision ...
              </p>
            ) : (
              <button
                onClick={handleSubmit}
                className="cursor-pointer hover:scale-105"
              >
                <img src={sendButton} alt="send button" />
              </button>
            )}
          </div>
          
        </div>
      
      </div>
      
    </div>
  );
}
