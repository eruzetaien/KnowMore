import type { PlayingPhaseData } from "../types/gameType";

type Props = { data: PlayingPhaseData };

export default function PlayingPhase({ data }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Playing Phase</h2>
    </div>
  );
}
