import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface SecurityEvent {
  id: number;
  type: string;
  success: boolean;
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export default function AuditLogPage(): React.ReactElement {
  const { token } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const res = await fetch('/api/security-events?limit=200', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to load audit events');
        }
        setEvents(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit events');
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [token]);

  if (!token) {
    return <div className="p-4">Please sign in as a property manager to view audit logs.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Security Audit Log</h1>
      {error && <div className="mb-3 rounded bg-red-100 px-4 py-2 text-red-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="border-b px-4 py-2 text-left">Timestamp</th>
              <th className="border-b px-4 py-2 text-left">Event</th>
              <th className="border-b px-4 py-2 text-left">User</th>
              <th className="border-b px-4 py-2 text-left">Success</th>
              <th className="border-b px-4 py-2 text-left">IP</th>
              <th className="border-b px-4 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="border-b px-4 py-2">
                  {new Date(event.createdAt).toLocaleString()}
                </td>
                <td className="border-b px-4 py-2 font-mono text-sm">{event.type}</td>
                <td className="border-b px-4 py-2">{event.username ?? '—'}</td>
                <td className="border-b px-4 py-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      event.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {event.success ? 'Success' : 'Failure'}
                  </span>
                </td>
                <td className="border-b px-4 py-2 text-sm">{event.ipAddress ?? '—'}</td>
                <td className="border-b px-4 py-2 text-sm">
                  <pre className="whitespace-pre-wrap break-all">
                    {event.metadata ? JSON.stringify(event.metadata, null, 2) : '—'}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
