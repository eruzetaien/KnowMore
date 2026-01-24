import { useState } from "react";
import { useGameHub } from "../context/GameHubContext";
import { useCountdown } from "../hooks/useCountdown";

import player1Thinking from "../assets/players/state/player1-thinking.png";
import player2Thinking from "../assets/players/state/player2-thinking.png";
import player1Chilling from "../assets/players/state/player1-chilling.png";
import player2Chilling from "../assets/players/state/player2-chilling.png";
import PlayerState from "./PlayerState";


export default function PreparationPhase() {
  const { allPlayerData, isLoading: hubLoading, sendStatements, room, preparationPhaseData } = useGameHub();

  const [selectedFacts, setSelectedFacts] = useState<string[]>([]);
  const [lie, setLie] = useState("");

  const { minutes, seconds } = useCountdown(180); // 3 minutes

  if (hubLoading) return <p>Loading hub connection...</p>;

  const handleFactSelect = (factId: string) => {
    setSelectedFacts((prev) => {
      if (prev.includes(factId)) {
        return prev.filter((id) => id !== factId);
      }
      if (prev.length < 2) {
        return [...prev, factId];
      }
      return prev; // ignore if already 2 selected
    });
  };

  const handleSubmit = async () => {
    if (selectedFacts.length !== 2 || !lie.trim()) {
      alert("Please select exactly 2 facts and enter a lie.");
      return;
    }
    await sendStatements(room.code, lie, selectedFacts[0], selectedFacts[1]);
    setSelectedFacts([]);
    setLie("");
  };

  return (
    <div className="flex flex-col justify-center items-center">
      {/* Timer */}
      <div className="flex flex-col justify-center items-center mt-4 mb-6 text-black">
        <span className="text-xl -mb-2" > Timer</span>
        <h2 className="text-5xl" >{minutes}:{seconds.toString().padStart(2, "0")}</h2>
      </div>


      <h2 className="text-5xl mb-4">Prepare your card to play!</h2>


      {/* Player State */}
      <div className="flex justify-between w-11/12">
        <PlayerState
          name={allPlayerData.player1?.name}
          score={allPlayerData.player1Score}
          isReady={allPlayerData.player1?.isReady ?? false}
          chillingImg={player1Chilling}
          thinkingImg={player1Thinking}
        />
        <div className="flex flex-col w-full items-center justify-center">
          <div className="w-4/5 bg-platinum rounded-3xl border-4 border-heathered-grey p-6 outline-2 -outline-offset-7 outline-heathered-grey">
            <div className="w-full"> 
              <div className="border-2 border-coupon-fill">
                <div className="border-4 border-coupon-white">
                  <div className="border-4 border-coupon-fill">
                    <div className="bg-[#E1D9CE] p-2 text-xl">
                      Sed et vulputate massa 
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PlayerState
          name={allPlayerData.player2?.name}
          score={allPlayerData.player2Score}
          isReady={allPlayerData.player2?.isReady ?? false}
          chillingImg={player2Chilling}
          thinkingImg={player2Thinking}
          isFlipped={true}
        />
      </div>

      {preparationPhaseData.playerFacts?.length ? (
        <ul className="space-y-2 mt-2">
          {preparationPhaseData.playerFacts.map((group) => (
            <li key={group.id} className="p-3 bg-gray-700 rounded-lg shadow">
              <p className="font-medium">{group.name}</p>
              <ul className="ml-4 mt-1 list-disc text-sm">
                {group.facts.map((fact) => (
                  <li key={fact.id}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFacts.includes(fact.id)}
                        onChange={() => handleFactSelect(fact.id)}
                        disabled={
                          !selectedFacts.includes(fact.id) && selectedFacts.length >= 2
                        }
                      />
                      {fact.description}
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No fact groups found.</p>
      )}

      {/* Lie input */}
      <div className="mt-4">
        <label className="block font-medium mb-2">Your Lie</label>
        <input
          type="text"
          value={lie}
          onChange={(e) => setLie(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          placeholder="Enter your lie here"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
      >
        Submit Statements
      </button>
    </div>
  );
}
