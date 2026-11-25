import SwipeDeck from './SwipeDeck.jsx';
import { SAMPLE_PROFILES } from './sampleProfiles.js';

export default function SwipePage() {
  return (
    <>
      <h1>Hẹn Hò Nhưng Không Yêu</h1>
      <SwipeDeck profiles={SAMPLE_PROFILES} />
    </>
  );
}
