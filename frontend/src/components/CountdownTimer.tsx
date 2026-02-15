import { useEffect, useState } from "react";

type CountdownTimerProps = {
  initialSeconds: number;
  isRunning: boolean;      // controls start/stop
  onComplete?: () => void; // optional callback when timer hits 0
};

export function CountdownTimer({
  initialSeconds,
  isRunning,
  onComplete,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col justify-center items-center text-black">
      <span className="text-2xl -mb-2">Timer</span>
      <h2 className="text-6xl">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </h2>
    </div>
  );
}
