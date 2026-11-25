import { NavLink, Outlet } from 'react-router';
import { PLAYERS } from './dossiers.js';
import './tribunal.css';

/** Layout for `/dossier`: sidebar of players, the open dossier renders in <Outlet />. */
export default function TribunalLayout() {
  return (
    <section className="tribunal">
      <h1>Esports Fair-Play Appeal Tribunal</h1>
      <p className="tribunal-note">Fictional case files for Lab 4 coursework. No real ruling is described.</p>
      <div className="tribunal-body">
        <nav aria-label="Dossiers" className="tribunal-sidebar">
          <ul>
            {PLAYERS.map((player) => (
              <li key={player.id}>
                <NavLink to={`/dossier/${player.id}`}>{player.handle}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="tribunal-main">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

/** Index route for `/dossier`. */
export function ChooseDossier() {
  return <p>Choose a dossier from the list to review the case.</p>;
}
