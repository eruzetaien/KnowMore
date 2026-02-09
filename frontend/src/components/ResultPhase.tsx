import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";
import PlayerState from "./PlayerState";
import { PlayerSlot } from "../types/playerType";

import player1Losing from "../assets/players/state/player1-losing.png";
import player2Losing from "../assets/players/state/player2-losing.png";
import player1Winning from "../assets/players/state/player1-winning.png";
import player2Winning from "../assets/players/state/player2-losing.png";
import player1Chilling from "../assets/players/state/player1-chilling.png";
import player2Chilling from "../assets/players/state/player2-chilling.png";
import nextGameButton from "../assets/buttons/next-game-button.svg";
import cancelButton from "../assets/buttons/cancel-button.svg";
import rewardButton from "../assets/buttons/reward-button.svg";
import keepButton from "../assets/buttons/keep-button.svg";
import rewardCard from "../assets/container/reward-card.svg";
import CouponCard from "./CouponCard";
import xLightIcon from "../assets/icons/x-light.svg";


export default function ResultPhase() {
  const { isLoading: hubLoading, allPlayerData, resultPhaseData, setReadyStateForNextGame, sendRewardChoice, room, clientPlayerData } = useGameHub();
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isChoosingReward, setIsChoosingReward] = useState<boolean>(false);

  if (hubLoading) return <p>Loading hub connection...</p>;

  const isPlayerReady =
      (clientPlayerData.slot == PlayerSlot.Player1 && allPlayerData.player1?.isReady) ||
      (clientPlayerData.slot == PlayerSlot.Player2 && allPlayerData.player2?.isReady);

  const handleChooseReward = () => {
    if (selectedRewardId !== null) {
      sendRewardChoice(selectedRewardId);
      setSubmitted(true);
    }
  };

  const handleNextGame = () => {
    setReadyStateForNextGame(room.code, true)
  };

  const handleCancelNextGame = () => {
    setReadyStateForNextGame(room.code, false)
  }

  const isPlayerCorrect = clientPlayerData.slot == PlayerSlot.Player1 ? resultPhaseData.isPlayer1Correct : resultPhaseData.isPlayer2Correct;
  const canChooseReward = isPlayerCorrect
    && resultPhaseData.rewardStatements 
    && resultPhaseData.rewardStatements.length > 0;

  return (
    <div>
      <div className="flex flex-col justify-center items-center">
      
        {/* Player State */}
        <div className="flex justify-between w-11/12">
          <PlayerState
            name={allPlayerData.player1?.name}
            score={allPlayerData.player1Score}
            isReady={allPlayerData.player1?.isReady ?? false}
            chillingImg={player1Chilling}
            thinkingImg={resultPhaseData.isPlayer1Correct ? player1Winning : player1Losing}
          />
          <div className="flex flex-col w-full items-center justify-center">
            {isPlayerCorrect ? (
              <div className="flex flex-col justify-center items-center gap-y-4">
                <h3 className="text-5xl font-bold">Right Choice!</h3>
                {canChooseReward && (
                  <button
                    onClick={() => setIsChoosingReward(true)}
                    className="cursor-pointer hover:scale-105 "
                  >
                    <img src={rewardButton} alt="send button" />
                  </button>
                )}
                
              </div>
            )
             : (
              <div className="flex flex-col justify-center text-center">
                <h3 className="text-5xl font-bold">Fooled!</h3>
                <h4 className="text-2xl">That one was truth.</h4>
              </div>
            )}
          </div>
          <PlayerState
            name={allPlayerData.player2?.name}
            score={allPlayerData.player2Score}
            isReady={allPlayerData.player2?.isReady ?? false}
            chillingImg={player2Chilling}
            thinkingImg={resultPhaseData.isPlayer2Correct ? player2Winning : player2Losing}
            isFlipped={true}
          />
        </div>

        <div className="mt-10">
          {isPlayerReady ? (
            <button
              onClick={handleCancelNextGame}
              className="cursor-pointer hover:scale-105"
            >
              <img src={cancelButton} alt="cancel button" />
            </button>
          ) : (
            <button
              onClick={handleNextGame}
              className="cursor-pointer hover:scale-105"
            >
              <img src={nextGameButton} alt="next game button" />
            </button>
          )}
        </div>
        
      </div>

      {isChoosingReward && (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-black/50  backdrop-blur-xs" onClick={() => setIsChoosingReward(false)}>
          <div className="flex justify-center overflow-clip " onClick={(e) => e.stopPropagation()}>
            <div className="absolute h-full flex justify-center items-center">
              <div className="relative flex justify-center">
                <img className="w-[816px] h-[553px]" src={rewardCard} alt=""/> 

                <div className="absolute z-10 w-[816px] flex justify-center mt-8">
                  <button
                    onClick={() => setIsChoosingReward(false)}
                    className="cursor-pointer hover:scale-105"
                  >
                    <img src={xLightIcon}/>
                  </button>
                </div>

                <div className="absolute w-[816px] h-[553px] flex flex-col justify-between items-center pt-52 pb-12">
                  <ul className="space-y-3 px-12 w-full">
                    {resultPhaseData.rewardStatements!.map((reward) => (
                      <li key={reward.id}
                        className={`${submitted ? "opacity-70" : "cursor-pointer hover:scale-105"}`}
                        onClick={() => {
                          if (submitted)
                            return;
                          setSelectedRewardId(reward.id)}
                        }
                      >
                        <CouponCard color={selectedRewardId === reward.id? "orange" : ""}>
                          <div>
                            {reward.description}
                          </div>
                        </CouponCard>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleChooseReward}
                    className={`${submitted ? "opacity-70" : "cursor-pointer hover:scale-105"}`}
                    disabled={selectedRewardId === null || submitted}
                  >
                    <img src={keepButton} alt="keep reward button" />
                  </button>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
