import { useState } from "react";
import { useAllUserFactQuery } from "../hooks/useFact";
import { useGameHub } from "../context/GameHubContext";

export default function PreparationPhase() {
  const { allPlayerData, isLoading: hubLoading, sendStatements, room } = useGameHub();
  const { data: factGroups, isLoading: factLoading, error } = useAllUserFactQuery();

  const [selectedFacts, setSelectedFacts] = useState<number[]>([]);
  const [lie, setLie] = useState("");

  if (hubLoading) return <p>Loading hub connection...</p>;
  if (factLoading) return <p>Loading fact groups...</p>;
  if (error) return <p>Failed to load fact groups</p>;

  const handleFactSelect = (factId: number) => {
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
    await sendStatements(room.joinCode, lie, selectedFacts[0], selectedFacts[1]);
    setSelectedFacts([]);
    setLie("");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Preparation Phase</h2>
      <p>Player 1 Ready: {allPlayerData.isPlayer1Ready ? "✅" : "❌"}</p>
      <p>Player 2 Ready: {allPlayerData.isPlayer2Ready ? "✅" : "❌"}</p>

      <h3 className="text-lg font-semibold mt-4">Your Fact Groups</h3>
      {factGroups?.length ? (
        <ul className="space-y-2 mt-2">
          {factGroups.map((group) => (
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
