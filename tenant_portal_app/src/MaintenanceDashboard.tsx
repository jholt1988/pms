
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: string;
}

 /**
 * The maintenance dashboard page.
 * It allows tenants to submit maintenance requests and property managers to view and manage them.
 */
const MaintenanceDashboard = () => {
  const { token } = useAuth() as any;
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:3001/maintenance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3001/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) throw new Error('Failed to create request');
      setTitle('');
      setDescription('');
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/maintenance/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>My Maintenance Requests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
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
            <button type="submit" style={{ padding: '0.5rem' }}>Submit</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </div>
        <div>
          <h3>Existing Requests</h3>
          {requests.length === 0 ? (
            <p>You have no active maintenance requests.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {requests.map(req => (
                <li key={req.id} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ marginTop: 0 }}>{req.title}</h4>
                  <p>{req.description}</p>
                  <p><strong>Status:</strong> {req.status}</p>
                  <select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;