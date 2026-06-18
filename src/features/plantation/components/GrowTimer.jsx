import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./GrowTimer.css";

function normalizeSeconds(seconds) {
  return Math.max(0, Math.ceil(Number(seconds) || 0));
}

function formatClock(seconds) {
  const safeSeconds = normalizeSeconds(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function GrowTimer({
  growStep,
  timeLeft,
  fastForwardKey = 0,
  fastForwardIdentity = "",
  onOpenInfo,
  infoDisabled = false,
}) {
  const safeTimeLeft = normalizeSeconds(timeLeft);
  const safeFastForwardKey = Math.max(0, Number(fastForwardKey) || 0);

  const [displayTime, setDisplayTime] = useState(safeTimeLeft);
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  const previousFastForwardKeyRef = useRef(safeFastForwardKey);
  const previousFastForwardIdentityRef = useRef(fastForwardIdentity);
  const lastStableTimeRef = useRef(safeTimeLeft);
  const targetTimeRef = useRef(safeTimeLeft);
  const isFastForwardingRef = useRef(false);
  const fastForwardTimerRef = useRef(null);

  targetTimeRef.current = safeTimeLeft;

  useLayoutEffect(() => {
    const previousIdentity = previousFastForwardIdentityRef.current;

    if (previousIdentity !== fastForwardIdentity) {
      previousFastForwardIdentityRef.current = fastForwardIdentity;
      previousFastForwardKeyRef.current = safeFastForwardKey;
      lastStableTimeRef.current = targetTimeRef.current;
      setDisplayTime(targetTimeRef.current);
      setIsFastForwarding(false);
      return undefined;
    }

    const previousKey = previousFastForwardKeyRef.current;
    previousFastForwardKeyRef.current = safeFastForwardKey;

    if (safeFastForwardKey <= previousKey) {
      return undefined;
    }

    const from = Math.max(lastStableTimeRef.current, targetTimeRef.current);
    const to = targetTimeRef.current;
    const difference = from - to;

    if (difference <= 0) {
      lastStableTimeRef.current = to;
      setDisplayTime(to);
      return undefined;
    }

    if (fastForwardTimerRef.current) {
      window.clearInterval(fastForwardTimerRef.current);
    }

    isFastForwardingRef.current = true;
    setIsFastForwarding(true);
    setDisplayTime(from);

    const visibleSteps = Math.min(18, Math.max(1, difference));
    const duration = Math.min(1480, Math.max(680, visibleSteps * 82));
    const interval = Math.max(52, Math.round(duration / visibleSteps));
    let currentStep = 0;

    fastForwardTimerRef.current = window.setInterval(() => {
      currentStep += 1;

      const progress = currentStep / visibleSteps;
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const nextValue = Math.max(
        to,
        Math.ceil(from - difference * easedProgress),
      );

      setDisplayTime(nextValue);

      if (currentStep >= visibleSteps || nextValue <= to) {
        window.clearInterval(fastForwardTimerRef.current);
        fastForwardTimerRef.current = null;
        isFastForwardingRef.current = false;
        lastStableTimeRef.current = to;
        setDisplayTime(to);
        setIsFastForwarding(false);
      }
    }, interval);

    return () => {
      if (fastForwardTimerRef.current) {
        window.clearInterval(fastForwardTimerRef.current);
        fastForwardTimerRef.current = null;
      }

      isFastForwardingRef.current = false;
      setIsFastForwarding(false);
    };
  }, [safeFastForwardKey, fastForwardIdentity]);

  useEffect(() => {
    if (isFastForwardingRef.current) return;

    lastStableTimeRef.current = safeTimeLeft;
    setDisplayTime(safeTimeLeft);
  }, [safeTimeLeft]);

  useEffect(
    () => () => {
      if (fastForwardTimerRef.current) {
        window.clearInterval(fastForwardTimerRef.current);
      }
    },
    [],
  );

  if (growStep === 0) {
    return null;
  }

  if (growStep === 3) {
    return (
      <div
        className="grow-hint ready"
        aria-label="Урожай готов"
      >
        <span className="grow-ready-check" aria-hidden="true">
          ✓
        </span>
      </div>
    );
  }

  const canOpenInfo =
    typeof onOpenInfo === "function" && !infoDisabled;

  const clock = (
    <span className="grow-clock-time">
      <span
        key={displayTime}
        className="grow-clock-digits"
      >
        {formatClock(displayTime)}
      </span>
    </span>
  );

  if (canOpenInfo) {
    return (
      <button
        type="button"
        className={`grow-hint growing${isFastForwarding ? " is-fast-forwarding" : ""}`}
        aria-label={`До урожая ${formatClock(safeTimeLeft)}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onOpenInfo();
        }}
      >
        {clock}
      </button>
    );
  }

  return (
    <div
      className={`grow-hint growing${isFastForwarding ? " is-fast-forwarding" : ""}`}
      aria-label={`До урожая ${formatClock(safeTimeLeft)}`}
    >
      {clock}
    </div>
  );
}

export default GrowTimer;
