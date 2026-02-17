import { useMemo, useState } from "react";
import { useGameHub } from "../context/GameHubContext";

import player1Thinking from "../assets/players/state/player1-thinking.png";
import player2Thinking from "../assets/players/state/player2-thinking.png";
import player1Chilling from "../assets/players/state/player1-chilling.png";
import player2Chilling from "../assets/players/state/player2-chilling.png";
import paperContent from "../assets/paper-content.svg";
import paperTableOfContent from "../assets/paper-table-of-content.svg";
import arrowBackIcon from "../assets/icons/back-arrow.svg";
import sendButton from "../assets/buttons/send-button.svg";

import PlayerState from "./PlayerState";
import CouponCard from "./CouponCard";
import type { FactForGame } from "../types/factType";
import { CountdownTimer } from "./CountdownTimer";
import { PlayerSlot } from "../types/playerType";

type PaperId = "table-of-content" | "content";

export default function PreparationPhase() {
  const { allPlayerData, isLoading: hubLoading, sendStatements, room, preparationPhaseData, clientPlayerData } = useGameHub();

  const factGroups = preparationPhaseData.playerFacts;
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const activeGroup = useMemo(
      () => factGroups.find(g => g.id === activeGroupId) ?? null,
      [factGroups, activeGroupId]
    );
  const [isFactOpen, setIsFactOpen] =  useState<boolean>(false);

  const [selectedFacts, setSelectedFacts] = useState<FactForGame[]>([]);
  const [lie, setLie] = useState("");

  const [isTimerRunning, setIsTimerRunning] = useState(true);

  if (hubLoading) return <p>Loading hub connection...</p>;

  const handleFactSelect = (fact: FactForGame) => {
    setSelectedFacts((prev) => {
      if (prev.some(f => f?.id === fact.id)) {
        return prev.filter(f => f?.id !== fact.id);
      }

      const updated = [...prev, fact];

      if (updated.length > 2) {
        return updated.slice(updated.length - 2);
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    if (selectedFacts.length !== 2 || !lie.trim()) {
      alert("Please select exactly 2 facts and enter a lie.");
      return;
    }
    await sendStatements(room.code, lie, selectedFacts[0].id, selectedFacts[1].id);
    setIsTimerRunning(false);
  };

  const [order, setOrder] = useState<[PaperId, PaperId]>([
      "table-of-content",
      "content",
    ]);
  const [animating, setAnimating] = useState(false);
  const bringToTop = (paper: PaperId) => {
    if (animating || order[0] === paper) return;

    setAnimating(true);

    setTimeout(() => {
      setOrder((prev) =>
        prev[0] === paper ? prev : [paper, prev[0]]
      );
      setAnimating(false);
    }, 300);
  };

  const isTop = (card: PaperId) => order[0] === card;

  const isPlayerReady =
    (clientPlayerData.slot == PlayerSlot.Player1 && allPlayerData.player1?.isReady) ||
    (clientPlayerData.slot == PlayerSlot.Player2 && allPlayerData.player2?.isReady);
  
  const playerFacts = preparationPhaseData.playerFacts.flatMap(group => group.facts);

  return (
    <div className="h-screen w-screen flex flex-col ">
      <div className="h-full w-full grid grid-rows-8">
        <div className="row-span-2 flex flex-col justify-between items-center pt-18">
            <CountdownTimer
              initialSeconds={180}
              isRunning={isTimerRunning}
              onComplete={() => alert("Time's up!")}
            />;

            <h2 className="text-5xl">Prepare your card to play!</h2>
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
              <div className="w-5/6 bg-platinum rounded-3xl border-4 border-heathered-grey p-6 outline-2 -outline-offset-7 outline-heathered-grey">
                <div className="flex flex-col gap-y-2">
                  <div
                    onClick={() => {
                      if (!isPlayerReady) {
                        setIsFactOpen(true);
                      }
                    }}
                    className={`${!isPlayerReady ? "hover:scale-101 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <CouponCard>
                      <div style={{ opacity: selectedFacts?.[0] ? 1 : 0.5 }}>
                        {
                          preparationPhaseData.fact1Id != null
                            ? playerFacts.find(f => f.id === preparationPhaseData.fact1Id)
                                ?.description
                            : selectedFacts?.[0]?.description ?? "Pick your fact to play"
                        }
                      </div>
                    </CouponCard>
                  </div>

                  <div
                    onClick={() => {
                      if (!isPlayerReady) {
                        setIsFactOpen(true);
                      }
                    }}
                    className={`${!isPlayerReady ? "hover:scale-101 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <CouponCard>
                      <div style={{ opacity: selectedFacts?.[1] ? 1 : 0.5 }}>
                        {
                          preparationPhaseData.fact2Id != null
                            ? playerFacts.find(f => f.id === preparationPhaseData.fact2Id)
                                ?.description
                            : selectedFacts?.[1]?.description ?? "Pick your fact to play"
                        }
                      </div>
                    </CouponCard>
                  </div>

                  <CouponCard color={"red"}>
                    <textarea
                      value={(isPlayerReady ? preparationPhaseData.lie : lie)}
                      onChange={(e) => {
                        setLie(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Write your lie"
                      className={`w-full resize-none overflow-hidden bg-transparent border-0 outline-none focus:outline-none text-inherit placeholder:opacity-70"
                        ${!isPlayerReady ? "" : "opacity-50 cursor-not-allowed"}`}
                      disabled={isPlayerReady}
                    />
                  </CouponCard>
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

      

      {isFactOpen && (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-black/50  backdrop-blur-xs" onClick={() => setIsFactOpen(false)}>
          <div className="flex justify-center overflow-clip" onClick={(e) => e.stopPropagation()}>
            {/* Table of Content*/}
            <div
              className={`
              Paper Card 2
                absolute h-full flex justify-center items-center overflow-auto 
                transition-all duration-300 ease-out
                ${
                  isTop("table-of-content")
                    ? "z-20 -translate-x-8 rotate-1 -bottom-18 " //
                    : animating
                    ? "-translate-x-16 -rotate-3 -bottom-12"
                    : "z-10 -translate-x-12 -rotate-2 -bottom-20"
                }
              `}
            >
              <div className="relative h-full flex justify-center items-center ">
                <img className="h-full" src={paperTableOfContent} alt=""/>

                <div className="absolute w-full h-full flex justify-center p-20">
                  <div className="w-full max-w-3xl">
                    <h1 className="text-4xl text-center">
                      Table of Contents
                    </h1>

                    {factGroups?.length ? (
                      <ul className="space-y-4 text-xl">
                        {factGroups.map((group, index) => (
                          <li
                            key={group.id}
                            className="flex gap-1 cursor-pointer hover:font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveGroupId(group.id);
                              bringToTop("content");
                            }}
                          >
                            <span>
                              {index + 1}. {group.name}
                            </span>

                            <span className="flex-1 overflow-hidden whitespace-nowrap text-2xl leading-none">
                              ................................................................................................
                            </span>

                            <span className="text-gray-500">›</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-xl text-gray-500">
                        No content available.
                      </p>
                    )}

                  </div>

                </div>

              </div>
            </div>

            {/* Content */}
            <div
              className={`
              Paper Card 2
                absolute h-full -bottom-4 flex justify-center items-center overflow-auto  
                transition-all duration-300 ease-out
                ${
                  isTop("content")
                    ? "z-20 -rotate-1"
                    : animating
                    ? "translate-x-16 rotate-3"
                    : "z-10 translate-x-6 rotate-2"
                }
              `}
            >
              <div className="relative h-full flex justify-center items-center ">
                <img className="h-full" src={paperContent} alt=""/>

                <div className="absolute w-full h-full flex flex-col pl-20 pr-28 py-16 overflow-auto">

                  <div className="flex justify-between">
                    <button 
                      className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
                      onClick={() => { 
                        bringToTop("table-of-content"); 
                      }}
                    >
                      <img className="h-[36px]" src={arrowBackIcon} alt="" />
                    </button>
                  </div>
                  
                  <h1 className= "w-full text-4xl text-center mb-10 mt-5">
                    {activeGroup ? activeGroup.name : "Content"}
                  </h1>

                  {activeGroup ? (
                    <ul className="space-y-4 text-xl px-10">
                      
                      {activeGroup.facts.map((fact) => (
                        <li key={fact.id}>
                          <span
                            className={`text-2xl cursor-pointer ${
                              selectedFacts.some((f) => f.id === fact.id) ? "highlight" : ""
                            }`}
                            onClick={() => {
                              handleFactSelect(fact);
                            }}
                          >
                            {fact.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      Select a group from the Table of Contents
                    </p>
                  )}
                </div>

              </div>
              
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
