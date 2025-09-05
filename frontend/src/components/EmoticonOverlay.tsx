// EmoticonsOverlay.tsx
import { useGameHub } from "../context/GameHubContext";
import emot1 from "../assets/emoticons/emot1.png";
import { Emoticon } from "../types/gameType";

export default function EmoticonsOverlay() {
  const { room, emoticon, sendEmoticon } = useGameHub();

  const isPlayer1 = localStorage.getItem("player") === "Player1";
  const isPlayer2 = localStorage.getItem("player") === "Player2";

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {/* Active emoticons */}
      <div className="flex gap-12">
        {emoticon.player1Emot !== Emoticon.None && (
          <img
            src={emot1}
            alt="Player 1 emoticon"
            className="w-12 h-12 emote-anim"
            key={emoticon.player1Emot}
          />
        )}

        {emoticon.player2Emot !== Emoticon.None && (
          <img
            src={emot1}
            alt="Player 2 emoticon"
            className="w-12 h-12 emote-anim"
            key={emoticon.player2Emot}
          />
        )}
      </div>

      {/* Send emoticon button */}
      <button
        onClick={() =>{
            console.log("Sending emoticon:", room.joinCode, Emoticon.Shocked);
             sendEmoticon(room.joinCode, Emoticon.Shocked);
        }}
        disabled={
          (isPlayer1 && emoticon.player1Emot !== Emoticon.None) ||
          (isPlayer2 && emoticon.player2Emot !== Emoticon.None)
        }
        className={`px-4 py-2 rounded-lg transition ${
          (isPlayer1 && emoticon.player1Emot !== Emoticon.None) ||
          (isPlayer2 && emoticon.player2Emot !== Emoticon.None)
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        <img src={emot1} alt="shocked" className="inline-block w-6 h-6 mr-2" />
        Shocked
      </button>
    </div>
  );
}
