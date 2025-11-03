
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RentalApplicationsManagementPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/rental-applications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch rental applications');
        }
        const data = await res.json();
        setApplications(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchApplications();
    }
  }, [token]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/rental-applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update application status');
      }

      // Update the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) => (app.id === id ? { ...app, status } : app))
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleScreenApplication = async (id: number) => {
    try {
      const res = await fetch(`/api/rental-applications/${id}/screen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to screen application');
      }

      const updatedApplication = await res.json();
      setApplications((prevApplications) =>
        prevApplications.map((app) => (app.id === id ? updatedApplication : app))
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rental Applications Management</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Applicant</th>
            <th className="py-2 px-4 border-b">Property</th>
            <th className="py-2 px-4 border-b">Unit</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Qualification</th>
            <th className="py-2 px-4 border-b">Recommendation</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td className="py-2 px-4 border-b">{app.id}</td>
              <td className="py-2 px-4 border-b">{app.applicant.username}</td>
              <td className="py-2 px-4 border-b">{app.property.name}</td>
              <td className="py-2 px-4 border-b">{app.unit.name}</td>
              <td className="py-2 px-4 border-b">{app.status}</td>
              <td className="py-2 px-4 border-b">{app.qualificationStatus || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{app.recommendation || 'N/A'}</td>
              <td className="py-2 px-4 border-b">
                {app.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(app.id, 'APPROVED')}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'REJECTED')}
                      className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleScreenApplication(app.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Screen
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RentalApplicationsManagementPage;
