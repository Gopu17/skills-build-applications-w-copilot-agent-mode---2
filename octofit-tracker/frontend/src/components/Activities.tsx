import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ activities?: Activity[] }>('/api/activities')
      .then((payload) => {
        if (!active) return;
        setActivities(payload.activities ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load activities.');
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
          <h2 className="h4">Activities</h2>
          <p role="status">Loading activities...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <div role="alert" className="alert alert-danger mb-0">{error}</div>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>No activities available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{activity.type ?? 'Activity'}</span>
              <span className="text-muted">{activity.minutes ?? 0} min</span>
              <span className="badge text-bg-primary">{activity.points ?? 0} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
