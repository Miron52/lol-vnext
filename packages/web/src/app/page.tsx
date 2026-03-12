'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME, API_PREFIX, Action, type HealthResponse } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}${API_PREFIX}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (loading) {
    return <main style={{ padding: '2rem' }}>Loading...</main>;
  }

  if (!user) {
    return null; // redirecting to /login
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{APP_NAME}</h1>
        <button
          onClick={logout}
          style={{
            padding: '0.375rem 0.75rem',
            background: '#eee',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <p>
        Signed in as <strong>{user.firstName} {user.lastName}</strong> ({user.role})
      </p>

      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#00897b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Open Dashboard
        </button>
        <button
          onClick={() => router.push('/loads')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Open List of Loads
        </button>
        {allowed(Action.SalaryPreview) && (
          <button
            onClick={() => router.push('/salary')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6a1b9a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Salary
          </button>
        )}
        {allowed(Action.SalaryRulesRead) && (
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#546e7a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Settings
          </button>
        )}
      </div>

      <hr />
      <h2>API Health</h2>
      {health ? (
        <pre
          style={{
            background: '#f4f4f4',
            padding: '1rem',
            borderRadius: 8,
          }}
        >
          {JSON.stringify(health, null, 2)}
        </pre>
      ) : (
        <p style={{ color: '#888' }}>Connecting to API...</p>
      )}
    </main>
  );
}
