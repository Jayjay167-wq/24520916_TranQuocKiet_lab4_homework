import { Link, useParams } from 'react-router';
import AppealForm from './AppealForm.jsx';
import { PLAYERS, findDossier, totalMatchesBanned } from './dossiers.js';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** `/dossier/:playerID` */
export default function DossierView() {
  const { playerID } = useParams();
  const dossier = findDossier(playerID);

  if (!dossier) return <DossierNotFound playerID={playerID} />;

  return (
    <article className="dossier" aria-labelledby="dossier-heading">
      <h2 id="dossier-heading">{dossier.handle}</h2>
      <section aria-labelledby="facts-heading">
        <h3 id="facts-heading">Case facts</h3>
        <dl className="dossier-facts">
          <dt>Case</dt>
          <dd>{dossier.caseId}</dd>
          <dt>Team</dt>
          <dd>{dossier.team}</dd>
          <dt>Role</dt>
          <dd>{dossier.role}</dd>
          <dt>Region</dt>
          <dd>{dossier.region}</dd>
          <dt>Ruling</dt>
          <dd>{dossier.ruling}</dd>
          <dt>Ruled on</dt>
          <dd>
            <time dateTime={dossier.ruledOn}>{DATE.format(new Date(dossier.ruledOn))}</time>
          </dd>
          <dt>Matches banned</dt>
          <dd>{totalMatchesBanned(dossier)}</dd>
          <dt>Fine</dt>
          <dd>{USD.format(dossier.fineUsd)}</dd>
        </dl>
      </section>
      <AppealForm key={dossier.id} dossier={dossier} />
    </article>
  );
}

function DossierNotFound({ playerID }) {
  return (
    <div role="alert" className="dossier-not-found">
      <h2>No dossier found</h2>
      <p>
        There is no dossier for “{playerID}”. Open one of:{' '}
        {PLAYERS.map((player, i) => (
          <span key={player.id}>
            {i > 0 && ', '}
            <Link to={`/dossier/${player.id}`}>{player.handle}</Link>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
