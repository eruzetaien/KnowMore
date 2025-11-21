// EmoticonsOverlay.tsx
import { useGameHub } from "../context/GameHubContext";
import emot1 from "../assets/emoticons/emot1.png";
import { Emoticon, PlayerSlot } from "../types/playerType";

export default function EmoticonsOverlay() {
  const { room, allPlayerData, clientPlayerData, sendEmoticon } = useGameHub();

  const isPlayer1 = clientPlayerData.slot == PlayerSlot.Player1;
  const isPlayer2 = clientPlayerData.slot == PlayerSlot.Player2;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {/* Active emoticons */}
      <div className="flex gap-12">
        {allPlayerData.player1Emot !== Emoticon.None && (
          <img
            src={emot1}
            alt="Player 1 emoticon"
            className="w-12 h-12 emote-anim"
            key={allPlayerData.player1Emot}
          />
        )}

        {allPlayerData.player2Emot !== Emoticon.None && (
          <img
            src={emot1}
            alt="Player 2 emoticon"
            className="w-12 h-12 emote-anim"
            key={allPlayerData.player2Emot}
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
          (isPlayer1 && allPlayerData.player1Emot !== Emoticon.None) ||
          (isPlayer2 && allPlayerData.player2Emot !== Emoticon.None)
        }
        className={`px-4 py-2 rounded-lg transition ${
          (isPlayer1 && allPlayerData.player1Emot !== Emoticon.None) ||
          (isPlayer2 && allPlayerData.player2Emot !== Emoticon.None)
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
