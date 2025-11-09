import closeButton from "../assets/buttons/close-button.svg";

type PlayerCardProps = {
  name?: string;
  isReady: boolean;
  sprite: string; // background image url
  isFlipped?: boolean;
  onKick?: () => void;
};

export default function PlayerCard({
  name,
  isReady,
  sprite,
  isFlipped = false,
  onKick,
}: PlayerCardProps) {
  if (!sprite || !name) {
    return <div className="w-1/5 aspect-3/4 back-card-rounded"></div>;
  }
  
  return (
    <div
      className={`rounded-3xl w-1/5 ${
        isReady ? "outline-4 outline-offset-4 outline-green-500" : ""
      }`}
    >
      <div className="relative flex flex-col aspect-3/4 items-center justify-end gap-y-4 py-4 card-rounded">
        {onKick && (
          <button
            onClick={onKick}
            className="hover:scale-105 cursor-pointer absolute -top-5 -right-5"
          >
            <img src={closeButton}/>
          </button>
        )}

        <div
          style={{ backgroundImage: `url(${sprite})` }}
          className={`w-6/7 aspect-11/14 bg-no-repeat bg-[length:300%_100%] sprite ${
            isFlipped ? "scale-x-[-1]" : ""
          }`}
        ></div>
        <p className="text-2xl">{name ?? "-"}</p>
      </div>
    </div>
  );
}
