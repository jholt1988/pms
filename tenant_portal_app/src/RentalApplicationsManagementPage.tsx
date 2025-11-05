
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RentalApplicationsManagementPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);
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
      updateLocalApplication(updatedApplication);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAddNote = async (id: number) => {
    if (!noteDrafts[id] || !noteDrafts[id].trim()) {
      return;
    }
    try {
      setSavingNoteId(id);
      const res = await fetch(`/api/rental-applications/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ body: noteDrafts[id] }),
      });

      if (!res.ok) {
        throw new Error('Failed to add note');
      }

      const note = await res.json();
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id
            ? { ...app, manualNotes: [note, ...(app.manualNotes ?? [])] }
            : app,
        ),
      );
      setNoteDrafts((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingNoteId(null);
    }
  };

  const updateLocalApplication = (updatedApplication: any) => {
    setApplications((prevApplications) =>
      prevApplications.map((app) => (app.id === updatedApplication.id ? updatedApplication : app)),
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/ApplicationsHub.svg" 
        alt="Applications Hub Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default RentalApplicationsManagementPage;
