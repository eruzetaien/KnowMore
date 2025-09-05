import type { ResultPhaseData } from "../types/gameType";

type Props = { data: ResultPhaseData };

export default function ResultPhase({ data }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Result Phase</h2>
    </div>
  );
}
