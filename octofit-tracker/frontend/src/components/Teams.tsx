import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams?: Team[] }>('/api/teams')
      .then((payload) => {
        if (!active) return;
        setTeams(payload.teams ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load teams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <div role="alert" className="alert alert-danger mb-0">{error}</div>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>No teams available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{team.name ?? 'Unknown team'}</strong>
                  <div className="text-muted">Mascot: {team.mascot ?? 'N/A'}</div>
                </div>
                <span className="badge text-bg-secondary">{team.members?.length ?? 0} members</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
