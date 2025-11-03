
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * The lease management page.
 * It allows property managers to view and manage leases for their properties.
 */
const LeaseManagementPage = () => {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await fetch('/api/leases', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch leases');
        }
        const data = await res.json();
        setLeases(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLeases();
    }
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lease Management</h1>
      {/* Add lease creation form here */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Tenant</th>
            <th className="py-2 px-4 border-b">Unit</th>
            <th className="py-2 px-4 border-b">Start Date</th>
            <th className="py-2 px-4 border-b">End Date</th>
            <th className="py-2 px-4 border-b">Rent</th>
          </tr>
        </thead>
        <tbody>
          {leases.map((lease) => (
            <tr key={lease.id}>
              <td className="py-2 px-4 border-b">{lease.tenant.username}</td>
              <td className="py-2 px-4 border-b">{lease.unit.name}</td>
              <td className="py-2 px-4 border-b">{new Date(lease.startDate).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">{new Date(lease.endDate).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">{lease.rentAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaseManagementPage;
