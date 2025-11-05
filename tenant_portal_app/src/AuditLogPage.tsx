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
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/AuditLog.svg" 
        alt="Audit Log Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
