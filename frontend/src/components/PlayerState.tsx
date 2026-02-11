type PlayerStateProps = {
  name?: string;
  score?: number | null;
  isReady: boolean;
  readyImg: string;
  notReadyImg: string;
  isFlipped?: boolean;
};

export default function PlayerState({
  name,
  score,
  isReady,
  readyImg,
  notReadyImg,
  isFlipped = false,
}: PlayerStateProps) {
  return (
    <div
      className="flex flex-col items-center text-center text-black"
    >
      <img
        className={`w-200 ${ isFlipped ? "scale-x-[-1]" : ""}`}
        src={isReady ? readyImg : notReadyImg}
        alt="Player state"
      />
      <h3 className="text-2xl mt-2">{name ?? "-"}</h3>
      <h3 className="text-7xl -mt-2">{score ?? 0}</h3>
    </div>
  );
}
