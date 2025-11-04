
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rental Applications Management</h1>
      <div className="space-y-4">
        {applications.map((app) => {
          const isExpanded = expanded === app.id;
          const notes: any[] = app.manualNotes ?? [];
          return (
            <div key={app.id} className="rounded border border-gray-200 bg-white shadow-sm">
              <div
                className="flex flex-wrap items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : app.id)}
              >
                <div className="space-x-4 text-sm sm:text-base">
                  <span className="font-semibold">#{app.id}</span>
                  <span>{app.applicant?.username ?? app.fullName}</span>
                  <span className="text-gray-600">
                    {app.property?.name ?? 'N/A'} • {app.unit?.name ?? 'N/A'}
                  </span>
                  <span className="uppercase text-xs tracking-wide text-gray-500">
                    Status: {app.status}
                  </span>
                </div>
                <div className="space-x-2">
                  {app.status === 'PENDING' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(app.id, 'APPROVED');
                        }}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(app.id, 'REJECTED');
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScreenApplication(app.id);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Screen
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-4 text-sm space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Applicant Email</p>
                      <p>{app.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p>{app.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Income</p>
                      <p>${app.income?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Credit Score</p>
                      <p>{app.creditScore ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Debt</p>
                      <p>{app.monthlyDebt != null ? `$${app.monthlyDebt}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bankruptcy</p>
                      <p>{app.bankruptcyFiledYear ?? 'None reported'}</p>
                    </div>
                    <div className="sm:col-span-3">
                      <p className="text-xs text-gray-500">Employment</p>
                      <p>{app.employmentStatus}</p>
                    </div>
                    <div className="sm:col-span-3">
                      <p className="text-xs text-gray-500">Previous Address</p>
                      <p>{app.previousAddress}</p>
                    </div>
                    {app.rentalHistoryComments && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-gray-500">Rental History</p>
                        <p>{app.rentalHistoryComments}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Screening Summary
                    </p>
                    <p className="font-semibold text-sm">
                      {app.screeningScore != null ? `Score: ${app.screeningScore.toFixed(0)}/100` : 'Not screened'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {app.screeningDetails ?? 'Run screening to generate score.'}
                    </p>
                    {Array.isArray(app.screeningReasons) && app.screeningReasons.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 space-y-1">
                        {app.screeningReasons.map((reason: string, idx: number) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Qualification</p>
                      <p>{app.qualificationStatus ?? 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recommendation</p>
                      <p>{app.recommendation ?? 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="uppercase tracking-wide text-xs">{app.status}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Internal Notes</h3>
                    <form
                      className="mb-3 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddNote(app.id);
                      }}
                    >
                      <textarea
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        value={noteDrafts[app.id] ?? ''}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder="Add a quick note for other reviewers…"
                      />
                      <button
                        type="submit"
                        className="rounded bg-indigo-600 px-3 py-1 text-white text-sm disabled:opacity-50"
                        disabled={savingNoteId === app.id}
                      >
                        Add Note
                      </button>
                    </form>
                    {notes.length > 0 ? (
                      <ul className="space-y-2">
                        {notes.map((note) => (
                          <li key={note.id} className="rounded border border-gray-200 p-2">
                            <p className="text-xs text-gray-500">
                              {note.author?.username ?? 'System'} •{' '}
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.body}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No notes yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RentalApplicationsManagementPage;
