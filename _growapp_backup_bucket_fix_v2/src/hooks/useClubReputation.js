import { useEffect, useState } from "react";
import {
  CLUB_REPUTATION_EVENT,
  readClubReputation,
} from "../game/clubProgression";

function useClubReputation() {
  const [reputation, setReputation] = useState(() =>
    readClubReputation(),
  );

  useEffect(() => {
    const syncReputation = (event) => {
      const eventReputation = Number(
        event?.detail?.reputation,
      );

      if (
        event?.detail &&
        Number.isFinite(eventReputation)
      ) {
        setReputation(
          Math.max(0, Math.floor(eventReputation)),
        );
        return;
      }

      setReputation(readClubReputation());
    };

    const syncFromStorage = () => {
      setReputation(readClubReputation());
    };

    window.addEventListener(
      CLUB_REPUTATION_EVENT,
      syncReputation,
    );

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);
    window.addEventListener(
      "visibilitychange",
      syncFromStorage,
    );

    const intervalId = window.setInterval(
      syncFromStorage,
      300,
    );

    syncFromStorage();

    return () => {
      window.removeEventListener(
        CLUB_REPUTATION_EVENT,
        syncReputation,
      );

      window.removeEventListener(
        "storage",
        syncFromStorage,
      );

      window.removeEventListener(
        "focus",
        syncFromStorage,
      );

      window.removeEventListener(
        "visibilitychange",
        syncFromStorage,
      );

      window.clearInterval(intervalId);
    };
  }, []);

  return reputation;
}

export default useClubReputation;