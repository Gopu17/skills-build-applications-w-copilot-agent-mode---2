import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (!active) return;
        setLeaderboard(payload.leaderboard ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load leaderboard.');
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
          <h2 className="h4">Leaderboard</h2>
          <p role="status">Loading leaderboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <div role="alert" className="alert alert-danger mb-0">{error}</div>
        </div>
      </section>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>No leaderboard available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry, index) => (
            <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.rank ?? index + 1}. {entry.teamName ?? 'Unknown team'}</span>
              <span className="badge text-bg-primary">{entry.totalPoints ?? 0} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
