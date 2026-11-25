import { Routes, Route } from 'react-router';
import PhotoGalleryLayout from './gallery/PhotoGalleryLayout.jsx';
import PhotoGrid from './gallery/PhotoGrid.jsx';
import SwipePage from './swipe/SwipePage.jsx';

// Feature routes are added task-by-task per TASK_DECOMPOSITION.md.
export default function App() {
  return (
    <main>
      <Routes>
        <Route index element={<h1>Lab 4 — Multi-Route SPA</h1>} />
        <Route path="gallery" element={<PhotoGalleryLayout />}>
          <Route index element={<PhotoGrid />} />
        </Route>
        <Route path="swipe" element={<SwipePage />} />
      </Routes>
    </main>
  );
}
