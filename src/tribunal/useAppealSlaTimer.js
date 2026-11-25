import { useEffect, useState } from 'react';

/**
 * Milliseconds left until an absolute deadline.
 *
 * Zero drift: only the current clock reading is stored. Each tick re-reads
 * Date.now() and the remaining time is derived in render as
 * `deadline - now`. Late or skipped ticks (busy thread, throttled background
 * tab, sleep) cannot make the countdown fall behind, because nothing is ever
 * decremented. When the tab becomes visible again it resyncs at once instead
 * of waiting for the next tick.
 *
 * @param {number} deadlineMs  Absolute deadline, epoch ms.
 * @param {{ tickMs?: number }} [options]
 * @returns {number} Remaining ms, never below 0 (0 for an invalid deadline).
 */
export function useAppealSlaTimer(deadlineMs, { tickMs = 1000 } = {}) {
  const [now, setNow] = useState(() => Date.now());
  const valid = Number.isFinite(deadlineMs);

  useEffect(() => {
    if (!valid || Date.now() >= deadlineMs) return undefined;

    function sync() {
      const current = Date.now();
      setNow(current);
      if (current >= deadlineMs) stop(); // reached 0: nothing left to count
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') sync();
    }
    function stop() {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }

    const intervalId = setInterval(sync, tickMs);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return stop;
  }, [deadlineMs, tickMs, valid]);

  return valid ? Math.max(0, deadlineMs - now) : 0;
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * `1d 01:02:03`. Negative input is treated as 0; partial seconds round down.
 * @param {number} ms
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
