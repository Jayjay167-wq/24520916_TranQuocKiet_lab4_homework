import { Routes, Route } from 'react-router';

// Placeholder shell. Feature routes (gallery, swipe deck, tribunal dossiers)
// are added task-by-task per TASK_DECOMPOSITION.md.
export default function App() {
  return (
    <main>
      <Routes>
        <Route index element={<h1>Lab 4 — Multi-Route SPA</h1>} />
      </Routes>
    </main>
  );
}
