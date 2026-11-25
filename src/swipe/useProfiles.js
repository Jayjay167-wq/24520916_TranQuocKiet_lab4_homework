import { useEffect, useState } from 'react';
import { fetchProfiles } from './api.js';

/**
 * @typedef {object} ProfilesState
 * @property {'loading' | 'error' | 'ready'} status
 * @property {import('./deck.js').Profile[]} profiles
 * @property {string | null} error
 * @property {() => void} retry  Fetch again after an error.
 */

/**
 * Load the deck from GET /api/profiles. The request is aborted on unmount
 * and whenever a retry replaces it.
 * @returns {ProfilesState}
 */
export function useProfiles() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ attempt: -1, profiles: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    fetchProfiles({ signal: controller.signal })
      .then((profiles) => setResult({ attempt, profiles, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ attempt, profiles: [], error: err.message });
      });
    return () => controller.abort();
  }, [attempt]);

  // A result from an older attempt means the current one is still loading.
  let status = 'loading';
  if (result.attempt === attempt) status = result.error ? 'error' : 'ready';

  return {
    status,
    profiles: result.profiles,
    error: result.error,
    retry: () => setAttempt((n) => n + 1),
  };
}
