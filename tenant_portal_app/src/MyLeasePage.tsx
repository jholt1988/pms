
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * The my lease page.
 * It allows tenants to view their lease details.
 */
const MyLeasePage = () => {
  const [lease, setLease] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await fetch('/api/leases/my-lease', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch lease details');
        }
        const data = await res.json();
        setLease(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLease();
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
      <h1 className="text-2xl font-bold mb-4">My Lease</h1>
      {lease ? (
        <div>
          <p><strong>Property:</strong> {lease.unit.property.name}</p>
          <p><strong>Unit:</strong> {lease.unit.name}</p>
          <p><strong>Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> {new Date(lease.endDate).toLocaleDateString()}</p>
          <p><strong>Rent:</strong> ${lease.rentAmount}</p>
        </div>
      ) : (
        <p>You do not have a lease.</p>
      )}
    </div>
  );
};

export default MyLeasePage;
