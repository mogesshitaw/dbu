/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

/**
 * useUserActivity 
 * Detects user activity and triggers a callback when idle or active
 *
 * @param onIdle callback when user is idle
 * @param onActive callback when user is active
 * @param idleTimeMs time in ms to consider user idle (default 1 min)
 */
export function useUserActivity(
  onIdle: () => void,
  onActive?: () => void,
  idleTimeMs: number = 60 * 1000
) {
  const lastActivity = useRef(Date.now());
  const idleTimer = useRef<any>(null);

  // List of DOM events to track
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activityEvents = [
    "mousemove",
    "keydown",
    "mousedown",
    "scroll",
    "touchstart"
  ];

  // Mark user as active
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markActive = () => {
    lastActivity.current = Date.now();
    if (onActive) onActive();
  };

  useEffect(() => {
    // Add event listeners
    activityEvents.forEach((event) => window.addEventListener(event, markActive));

    // Idle checker
    idleTimer.current = setInterval(() => {
      if (Date.now() - lastActivity.current > idleTimeMs) {
        onIdle(); // user is idle
      }
    }, 5000); // check every 5 seconds

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, markActive));
      clearInterval(idleTimer.current);
    };
  }, [activityEvents, idleTimeMs, markActive, onIdle]);
}
