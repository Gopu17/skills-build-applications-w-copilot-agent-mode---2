import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load workout suggestions.');
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
          <h2 className="h4">Workout suggestions</h2>
          <p role="status">Loading workout suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <div role="alert" className="alert alert-danger mb-0">{error}</div>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>No workout suggestions available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
              <div className="fw-semibold">{suggestion.title ?? 'Workout'}</div>
              <div className="text-muted">Focus: {suggestion.focus ?? 'General'}</div>
              <div>{suggestion.reason ?? 'Recommended for your current activity pattern.'}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
