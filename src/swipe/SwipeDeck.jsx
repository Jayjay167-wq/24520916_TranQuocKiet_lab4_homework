import { useId, useRef, useState } from 'react';
import { ACTIONS, createDeck, currentProfile, scoreOf, swipe, undo } from './deck.js';
import './swipe.css';

/** Minimum drag distance, in CSS pixels, that counts as a swipe. */
export const DRAG_THRESHOLD = 50;

const KEY_ACTIONS = {
  ArrowLeft: ACTIONS.NOPE,
  ArrowRight: ACTIONS.LIKE,
  ArrowUp: ACTIONS.SUPERLIKE,
};

const DONE = { LIKE: 'Liked', NOPE: 'Passed on', SUPERLIKE: 'Super liked' };
const NOUN = { LIKE: 'like', NOPE: 'pass', SUPERLIKE: 'super like' };

/**
 * Map a drag vector to an action. The dominant axis wins; a drag must go
 * strictly past the threshold. Dragging down does nothing.
 * @returns {import('./deck.js').SwipeAction | null}
 */
export function actionFromDrag(dx, dy) {
  if (Math.abs(dy) > Math.abs(dx)) return dy < -DRAG_THRESHOLD ? ACTIONS.SUPERLIKE : null;
  if (dx > DRAG_THRESHOLD) return ACTIONS.LIKE;
  if (dx < -DRAG_THRESHOLD) return ACTIONS.NOPE;
  return null;
}

/**
 * @param {object} props
 * @param {readonly import('./deck.js').Profile[]} props.profiles
 * @param {(entry: import('./deck.js').SwipeEntry) => Promise<unknown>} [props.onSwipe]
 *   Persist a swipe. The swipe only enters history once this resolves; if it
 *   rejects, the deck is left as it was and the error is shown.
 */
export default function SwipeDeck({ profiles, onSwipe }) {
  const [deck, setDeck] = useState(createDeck);
  const [announcement, setAnnouncement] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const savingRef = useRef(false); // sync guard: two keys can land before a re-render
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const dragRef = useRef(null);
  const hintId = useId();

  const current = currentProfile(profiles, deck);
  const score = scoreOf(deck.history);
  const nameOf = (id) => profiles.find((p) => p.id === id)?.name ?? 'profile';

  async function handleSwipe(action) {
    if (!current || savingRef.current) return;
    const profile = current;

    if (onSwipe) {
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        await onSwipe({ profileId: profile.id, action });
      } catch (err) {
        setSaveError(`Couldn’t save your ${NOUN[action]} on ${profile.name}: ${err.message}. Try again.`);
        return;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }

    // Nothing else can change the deck while a save is in flight, so `deck` is current.
    const next = swipe(deck, profile.id, action);
    setDeck(next);
    setAnnouncement(`${DONE[action]} ${profile.name}. Score ${scoreOf(next.history)}.`);
  }

  function handleUndo() {
    if (savingRef.current) return;
    setSaveError(null);
    const last = deck.history.at(-1);
    if (!last) {
      setAnnouncement('Nothing to undo.');
      return;
    }
    const next = undo(deck);
    setDeck(next);
    setAnnouncement(`Undid ${NOUN[last.action]} on ${nameOf(last.profileId)}. Score ${scoreOf(next.history)}.`);
  }

  function handleKeyDown(event) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      handleUndo();
      return;
    }
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    event.preventDefault(); // stop arrow keys scrolling the page
    handleSwipe(action);
  }

  function handlePointerDown(event) {
    if (!current || event.button > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function dragDelta(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return null;
    return { dx: event.clientX - drag.x, dy: event.clientY - drag.y };
  }

  function handlePointerMove(event) {
    const delta = dragDelta(event);
    if (delta) setOffset(delta);
  }

  function endDrag() {
    dragRef.current = null;
    setOffset({ dx: 0, dy: 0 });
  }

  function handlePointerUp(event) {
    const delta = dragDelta(event);
    if (!delta) return;
    endDrag();
    const action = actionFromDrag(delta.dx, delta.dy);
    if (action) handleSwipe(action);
  }

  const dragging = offset.dx !== 0 || offset.dy !== 0;
  const pending = dragging ? actionFromDrag(offset.dx, offset.dy) : null;

  return (
    <section className="swipe-deck" aria-label="Swipe deck">
      <p className="swipe-score">Score: {score}</p>

      <div
        className="swipe-card"
        role="group"
        aria-roledescription="profile card"
        aria-label={current ? `${current.name}, ${current.age}` : 'No more profiles'}
        aria-describedby={hintId}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp Backspace"
        tabIndex={0}
        aria-busy={saving || undefined}
        data-pending={pending ?? undefined}
        style={dragging ? { transform: `translate(${offset.dx}px, ${offset.dy}px) rotate(${offset.dx / 20}deg)` } : undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={endDrag}
      >
        {current ? (
          <>
            <span className="swipe-avatar" aria-hidden="true">{current.name.charAt(0)}</span>
            <h2 className="swipe-name">
              {current.name}, {current.age}
            </h2>
            <p className="swipe-bio">{current.bio}</p>
          </>
        ) : (
          <p className="swipe-empty">No more profiles. Press Backspace to undo the last swipe.</p>
        )}
      </div>

      <p id={hintId} className="swipe-hint">
        Arrow keys: ← nope, → like, ↑ super like. Backspace: undo. Or drag the card.
      </p>

      <div className="swipe-actions">
        <button type="button" onClick={() => handleSwipe(ACTIONS.NOPE)} disabled={!current || saving}>
          Nope
        </button>
        <button type="button" onClick={() => handleSwipe(ACTIONS.SUPERLIKE)} disabled={!current || saving}>
          Super like
        </button>
        <button type="button" onClick={() => handleSwipe(ACTIONS.LIKE)} disabled={!current || saving}>
          Like
        </button>
        <button type="button" onClick={handleUndo} disabled={deck.history.length === 0 || saving}>
          Undo
        </button>
      </div>

      <p className="swipe-status" role="status">
        {announcement}
      </p>
      {saveError && (
        <p className="swipe-error" role="alert">
          {saveError}
        </p>
      )}
    </section>
  );
}
