type PlayerStateProps = {
  name?: string;
  score?: number | null;
  isReady: boolean;
  chillingImg: string;
  thinkingImg: string;
  isFlipped?: boolean;
};

export default function PlayerState({
  name,
  score,
  isReady,
  chillingImg,
  thinkingImg,
  isFlipped = false,
}: PlayerStateProps) {
  return (
    <div
      className="flex flex-col items-center text-center text-black"
    >
      <img
        className={`w-80 ${ isFlipped ? "scale-x-[-1]" : ""}`}
        src={isReady ? chillingImg : thinkingImg}
        alt="Player state"
      />
      <h3 className="text-2xl mt-2">{name ?? "-"}</h3>
      <h3 className="text-5xl -mt-2">{score ?? 0}</h3>
    </div>
  );
}
