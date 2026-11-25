/** Read `{ error }` from a failed response, falling back to the status code. */
async function errorFrom(res) {
  try {
    const body = await res.json();
    if (body?.error) return new Error(body.error);
  } catch {
    // body was not JSON; fall through
  }
  return new Error(`Request failed with status ${res.status}`);
}

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('./deck.js').Profile[]>}
 */
export async function fetchProfiles({ signal } = {}) {
  const res = await fetch('/api/profiles', { signal });
  if (!res.ok) throw await errorFrom(res);
  return res.json();
}

/**
 * Persist one swipe. Resolves on 201, rejects with the server's error otherwise.
 * @param {import('./deck.js').SwipeEntry} entry
 */
export async function saveSwipe({ profileId, action }) {
  const res = await fetch('/api/swipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, action }),
  });
  if (!res.ok) throw await errorFrom(res);
  return res.json();
}

/**
 * Delete a saved swipe (undo). Resolves on 204, rejects otherwise.
 * @param {import('./deck.js').SwipeEntry} entry
 */
export async function deleteSwipe({ swipeId }) {
  if (!swipeId) throw new Error('This swipe has no server id');
  const res = await fetch(`/api/swipe/${encodeURIComponent(swipeId)}`, { method: 'DELETE' });
  if (!res.ok) throw await errorFrom(res);
}
