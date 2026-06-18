import { useEffect, useState } from "react";
import {
  CLUB_REPUTATION_EVENT,
  readClubReputation,
} from "./clubProgression";

function useClubReputation() {
  const [reputation, setReputation] = useState(() =>
    readClubReputation(),
  );

  useEffect(() => {
    const sync = (event) => {
      const eventValue = Number(event?.detail?.reputation);

      if (
        event?.detail &&
        Number.isFinite(eventValue)
      ) {
        setReputation(Math.max(0, Math.floor(eventValue)));
        return;
      }

      setReputation(readClubReputation());
    };

    window.addEventListener(CLUB_REPUTATION_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);

    sync();

    return () => {
      window.removeEventListener(CLUB_REPUTATION_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return reputation;
}

export default useClubReputation;
