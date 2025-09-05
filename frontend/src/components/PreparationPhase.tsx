import type { PreparationPhaseData } from "../types/gameType";
import { useAllUserFactQuery } from "../hooks/useFact";

type Props = { data: PreparationPhaseData };

export default function PreparationPhase({ data }: Props) {
  const { data: factGroups, isLoading, error } = useAllUserFactQuery();

  if (isLoading) return <p>Loading fact groups...</p>;
  if (error) return <p>Failed to load fact groups</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Preparation Phase</h2>
      <p>Player 1 Ready: {data.isPlayer1Ready ? "✅" : "❌"}</p>
      <p>Player 2 Ready: {data.isPlayer2Ready ? "✅" : "❌"}</p>

      <h3 className="text-lg font-semibold mt-4">Your Fact Groups</h3>
      {factGroups?.length ? (
        <ul className="space-y-2 mt-2">
          {factGroups.map((group) => (
            <li
              key={group.id}
              className="p-3 bg-gray-700 rounded-lg shadow"
            >
              <p className="font-medium">{group.name}</p>
              <ul className="ml-4 mt-1 list-disc text-sm">
                {group.facts.map((fact) => (
                  <li key={fact.id}>{fact.description}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No fact groups found.</p>
      )}
    </div>
  );
}
