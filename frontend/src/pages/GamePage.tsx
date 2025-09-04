import { useGameHub } from "../context/GameHubContext";
import emot1 from "../assets/emoticons/emot1.png"; // import image
import { Emoticon } from "../types/game";

function GamePage() {
  const { room, isLoading, sendEmoticon, emoticonPlayer1, emoticonPlayer2 } = useGameHub();

  if (isLoading) return <p>Connecting to game hub...</p>;

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6">
      <div className="bg-gray-700/60 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">
          Room: {room?.name ?? "Unknown"}
        </h1>
        <p className="text-center text-gray-300 mb-6">
          <span className="font-mono">Game Started</span>
        </p>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Master */}
          <div className="relative flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Master</h2>
            <p className="mt-2">{room?.roomMaster ?? "-"}</p>

            {emoticonPlayer1 !== Emoticon.None && (
              <img
                src={emot1}
                alt="emoticon"
                className="absolute top-2 w-12 h-12 emote-anim"
                key={emoticonPlayer1}
              />
            )}
          </div>

          {/* Player 2 */}
          <div className="relative flex flex-col items-center p-4 bg-gray-800 rounded-xl">
            <h2 className="font-semibold">Player 2</h2>
            <p className="mt-2">{room?.secondPlayer ?? "-"}</p>

            {emoticonPlayer2 !== Emoticon.None && (
              <img
                src={emot1}
                alt="emoticon"
                className="absolute top-2 w-12 h-12 emote-anim"
                key={emoticonPlayer2}
              />
            )}
          </div>
        </div>

        {/* Emoticon Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => sendEmoticon(room.joinCode, Emoticon.Shocked)}
            disabled={
              (localStorage.getItem("player") === "Player1" && emoticonPlayer1 !== Emoticon.None) ||
              (localStorage.getItem("player") === "Player2" && emoticonPlayer2 !== Emoticon.None)
            }
            className={`px-4 py-2 rounded-lg transition ${
              (localStorage.getItem("player") === "Player1" && emoticonPlayer1 !== Emoticon.None) ||
              (localStorage.getItem("player") === "Player2" && emoticonPlayer2 !== Emoticon.None)
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <img src={emot1} alt="shocked" className="inline-block w-6 h-6 mr-2" />
            Shocked
          </button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
