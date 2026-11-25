import { useId } from 'react';
import { formatDuration, useAppealSlaTimer } from './useAppealSlaTimer.js';

// dateStyle/timeStyle cannot be combined with timeZoneName (RangeError), so
// the fields are spelled out.
const DEADLINE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Ho_Chi_Minh',
  timeZoneName: 'short',
});

/**
 * Countdown to a dossier's appeal deadline. Lives in its own component so the
 * per-second re-render stays here and does not re-render the whole dossier.
 * @param {{ deadline: string }} props  ISO date-time with offset.
 */
export default function SlaCountdown({ deadline }) {
  const remaining = useAppealSlaTimer(new Date(deadline).getTime());
  const headingId = useId();

  return (
    <section className="sla" aria-labelledby={headingId}>
      <h3 id={headingId}>Appeal window</h3>
      <p>
        Closes <time dateTime={deadline}>{DEADLINE.format(new Date(deadline))}</time>.
      </p>
      {remaining > 0 ? (
        // role="timer" is not live by default, so screen readers are not
        // interrupted every second; they read it when the user reaches it.
        <p>
          Time left: <span role="timer" className="sla-remaining">{formatDuration(remaining)}</span>
        </p>
      ) : (
        <p className="sla-closed">The appeal window has closed.</p>
      )}
    </section>
  );
}
