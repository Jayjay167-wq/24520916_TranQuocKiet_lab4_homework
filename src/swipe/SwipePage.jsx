import SwipeDeck from './SwipeDeck.jsx';
import { deleteSwipe, saveSwipe } from './api.js';
import { useProfiles } from './useProfiles.js';

export default function SwipePage() {
  const { status, profiles, error, retry } = useProfiles();

  return (
    <>
      <h1>Hẹn Hò Nhưng Không Yêu</h1>
      {status === 'loading' && <p role="status">Loading profiles…</p>}
      {status === 'error' && (
        <div role="alert" className="swipe-error">
          <p>Couldn’t load profiles: {error}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {status === 'ready' && <SwipeDeck profiles={profiles} onSwipe={saveSwipe} onUndo={deleteSwipe} />}
    </>
  );
}
