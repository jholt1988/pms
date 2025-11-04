import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  author?: {
    username?: string;
  };
}

const MaintenanceDashboard = () => {
  const { token, user } = useAuth();
  const canManageRequests = user?.role === 'PROPERTY_MANAGER';
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/maintenance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      return;
    }

    setError('');
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      setTitle('');
      setDescription('');
      fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    if (!token || !canManageRequests) {
      return;
    }

    setError('');
    try {
      const response = await fetch(`/api/maintenance/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Maintenance Requests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {user?.role === 'TENANT' && (
          <div>
            <h3>Submit a New Request</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ padding: '0.5rem' }}
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ padding: '0.5rem', minHeight: '100px' }}
              />
              <button type="submit" style={{ padding: '0.5rem' }} disabled={loading}>
                Submit
              </button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
          </div>
        )}
        <div style={{ gridColumn: user?.role === 'TENANT' ? 'auto' : 'span 2' }}>
          <h3>{canManageRequests ? 'All Requests' : 'My Requests'}</h3>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p>No maintenance requests found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {requests.map((req) => (
                <li
                  key={req.id}
                  style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}
                >
                  <h4 style={{ marginTop: 0 }}>{req.title}</h4>
                  <p>{req.description}</p>
                  {canManageRequests && req.author?.username && (
                    <p style={{ fontStyle: 'italic' }}>Submitted by: {req.author.username}</p>
                  )}
                  <p>
                    <strong>Status:</strong> {req.status}
                  </p>
                  {canManageRequests && (
                    <select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)}>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  )}
                </li>
              ))}
            </ul>
          )}
          {error && user?.role !== 'TENANT' && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
