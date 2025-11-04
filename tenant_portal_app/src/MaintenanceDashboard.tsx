import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

type StatusValue = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type PriorityValue = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

interface MaintenanceEntitySummary {
  id: number;
  name: string;
}

interface MaintenanceAsset extends MaintenanceEntitySummary {
  category: string;
  propertyId: number;
  unitId?: number | null;
}

interface MaintenanceRequestNote {
  id: number;
  body: string;
  createdAt: string;
  author?: {
    username?: string | null;
  } | null;
}

interface MaintenanceRequestHistoryEntry {
  id: number;
  createdAt: string;
  fromStatus?: StatusValue | null;
  toStatus?: StatusValue | null;
  note?: string | null;
  changedBy?: {
    username?: string | null;
  } | null;
  fromAssignee?: MaintenanceEntitySummary | null;
  toAssignee?: MaintenanceEntitySummary | null;
}

interface MaintenanceSlaPolicySummary {
  id: number;
  name?: string | null;
  responseTimeMinutes?: number | null;
  resolutionTimeMinutes: number;
}

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: StatusValue;
  priority: PriorityValue;
  createdAt: string;
  updatedAt: string;
  responseDueAt?: string | null;
  dueAt?: string | null;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  author?: {
    username?: string | null;
  } | null;
  property?: MaintenanceEntitySummary | null;
  unit?: MaintenanceEntitySummary | null;
  asset?: MaintenanceAsset | null;
  assignee?: MaintenanceEntitySummary | null;
  slaPolicy?: MaintenanceSlaPolicySummary | null;
  notes?: MaintenanceRequestNote[];
  history?: MaintenanceRequestHistoryEntry[];
}

interface Technician extends MaintenanceEntitySummary {
  role: string;
  phone?: string | null;
  email?: string | null;
}

interface PropertySummary extends MaintenanceEntitySummary {
  units: Array<{
    id: number;
    name: string;
  }>;
}

interface ManagerFilters {
  status: string;
  priority: string;
  propertyId: string;
  unitId: string;
  assigneeId: string;
}

const statusOptions: Array<{ value: StatusValue; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const priorityOptions: Array<{ value: PriorityValue; label: string }> = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatRelativeDue = (value?: string | null): string => {
  if (!value) {
    return 'No SLA';
  }
  const date = new Date(value);
  const now = new Date();
  if (Number.isNaN(date.getTime())) {
    return 'No SLA';
  }
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(Math.round(diffMinutes), 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 48) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};

const MaintenanceDashboard = () => {
  const { token, user } = useAuth();
  const canManageRequests = user?.role === 'PROPERTY_MANAGER';

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastFetchCount, setLastFetchCount] = useState(0);

  const [filters, setFilters] = useState<ManagerFilters>({
    status: '',
    priority: '',
    propertyId: '',
    unitId: '',
    assigneeId: '',
  });

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [assetOptions, setAssetOptions] = useState<MaintenanceAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    priority: PriorityValue;
    propertyId: string;
    unitId: string;
    assetId: string;
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    propertyId: '',
    unitId: '',
    assetId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [assigningRequestId, setAssigningRequestId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [noteSubmittingId, setNoteSubmittingId] = useState<number | null>(null);

  const selectedCreateProperty = useMemo(() => {
    if (!createForm.propertyId) {
      return undefined;
    }
    const id = Number(createForm.propertyId);
    if (Number.isNaN(id)) {
      return undefined;
    }
    return properties.find((property) => property.id === id);
  }, [createForm.propertyId, properties]);

  const selectedFilterProperty = useMemo(() => {
    if (!filters.propertyId) {
      return undefined;
    }
    const id = Number(filters.propertyId);
    if (Number.isNaN(id)) {
      return undefined;
    }
    return properties.find((property) => property.id === id);
  }, [filters.propertyId, properties]);

  const fetchRequests = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (canManageRequests) {
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.propertyId) params.set('propertyId', filters.propertyId);
        if (filters.unitId) params.set('unitId', filters.unitId);
        if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
      }

      const url = params.toString() ? `/api/maintenance?${params.toString()}` : '/api/maintenance';
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load maintenance requests');
      }

      const data = (await response.json()) as MaintenanceRequest[];
      setRequests(data);
      setLastFetchCount(data.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, [
    token,
    canManageRequests,
    filters.status,
    filters.priority,
    filters.propertyId,
    filters.unitId,
    filters.assigneeId,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!token || !canManageRequests) {
      return;
    }

    const loadTechnicians = async () => {
      try {
        const response = await fetch('/api/maintenance/technicians', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to load technicians');
        }
        setTechnicians((await response.json()) as Technician[]);
      } catch (err) {
        console.error(err);
      }
    };

    const loadProperties = async () => {
      try {
        const endpoint = canManageRequests ? '/api/properties' : '/api/properties/public';
        const response = await fetch(endpoint, {
          headers: canManageRequests ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          throw new Error('Failed to load properties');
        }
        setProperties((await response.json()) as PropertySummary[]);
      } catch (err) {
        console.error(err);
      }
    };

    loadTechnicians();
    loadProperties();
  }, [token, canManageRequests]);

  useEffect(() => {
    if (!token || !canManageRequests) {
      return;
    }
    if (!createForm.propertyId) {
      setAssetOptions([]);
      return;
    }

    let active = true;
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const params = new URLSearchParams({ propertyId: createForm.propertyId });
        if (createForm.unitId) {
          params.set('unitId', createForm.unitId);
        }
        const response = await fetch(`/api/maintenance/assets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to load assets');
        }
        const payload = (await response.json()) as MaintenanceAsset[];
        if (active) {
          setAssetOptions(payload);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setAssetOptions([]);
        }
      } finally {
        if (active) {
          setLoadingAssets(false);
        }
      }
    };

    loadAssets();
    return () => {
      active = false;
    };
  }, [token, canManageRequests, createForm.propertyId, createForm.unitId]);

  const handleCreateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setCreateForm((prev) => {
      if (name === 'propertyId') {
        return {
          ...prev,
          propertyId: value,
          unitId: '',
          assetId: '',
        };
      }
      if (name === 'unitId') {
        return {
          ...prev,
          unitId: value,
          assetId: '',
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'propertyId' ? { unitId: '' } : {}),
    }));
    setPage(1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
      };

      const propertyId = Number(createForm.propertyId);
      if (canManageRequests && propertyId) {
        payload.propertyId = propertyId;
      }
      const unitId = Number(createForm.unitId);
      if (canManageRequests && unitId) {
        payload.unitId = unitId;
      }
      const assetId = Number(createForm.assetId);
      if (canManageRequests && assetId) {
        payload.assetId = assetId;
      }

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create maintenance request');
      }

      setCreateForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        propertyId: '',
        unitId: '',
        assetId: '',
      });
      setAssetOptions([]);
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: StatusValue) => {
    if (!token || !canManageRequests) {
      return;
    }
    setUpdatingStatusId(id);
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
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAssign = async (id: number, technicianId: string) => {
    if (!token || !canManageRequests || !technicianId) {
      return;
    }
    const technicianNumeric = Number(technicianId);
    if (!technicianNumeric) {
      return;
    }
    setAssigningRequestId(id);
    try {
      const response = await fetch(`/api/maintenance/${id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ technicianId: technicianNumeric }),
      });
      if (!response.ok) {
        throw new Error('Failed to assign technician');
      }
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to assign technician.');
    } finally {
      setAssigningRequestId(null);
    }
  };

  const handlePrev = () => setPage((current) => Math.max(current - 1, 1));
  const handleNext = () => {
    if (lastFetchCount < pageSize) {
      return;
    }
    setPage((current) => current + 1);
  };

  const handleNoteDraftChange = (id: number, value: string) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmitNote = async (id: number) => {
    if (!token) {
      return;
    }
    const draft = (noteDrafts[id] ?? '').trim();
    if (!draft) {
      return;
    }
    setNoteSubmittingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/maintenance/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: draft }),
      });
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      setNoteDrafts((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      await fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to add maintenance note.');
    } finally {
      setNoteSubmittingId(null);
    }
  };

  const stats = useMemo(() => {
    const open = requests.filter((request) => request.status !== 'COMPLETED').length;
    const overdue = requests.filter((request) => {
      if (!request.dueAt) {
        return false;
      }
      return new Date(request.dueAt).getTime() < Date.now() && request.status !== 'COMPLETED';
    }).length;
    return { total: requests.length, open, overdue };
  }, [requests]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '8px' }}>Maintenance operations</h2>
      <p style={{ marginTop: 0, color: '#555' }}>
        Capture incoming requests, keep technicians accountable, and stay ahead of SLA deadlines.
      </p>

      {error && (
        <div style={{ margin: '16px 0', padding: '12px', borderRadius: '6px', background: '#fdecea', color: '#611a15' }}>
          {error}
        </div>
      )}

      <section
        aria-label="Maintenance summary"
        style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '14px' }}
      >
        <strong>Showing: {stats.total}</strong>
        <span>Open: {stats.open}</span>
        <span>Past due: {stats.overdue}</span>
      </section>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: canManageRequests ? '320px 1fr' : '1fr' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>
              {canManageRequests ? 'Log a job' : 'Submit a request'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Title
                <input
                  name="title"
                  value={createForm.title}
                  onChange={handleCreateChange}
                  required
                  minLength={4}
                  placeholder="Summarize the issue"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </label>
              <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Description
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  required
                  rows={4}
                  placeholder="Add relevant detail for the maintenance team"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </label>
              <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Priority
                <select
                  name="priority"
                  value={createForm.priority}
                  onChange={handleCreateChange}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {canManageRequests && (
                <>
                  <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Property
                    <select
                      name="propertyId"
                      value={createForm.propertyId}
                      onChange={handleCreateChange}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">(optional)</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Unit
                    <select
                      name="unitId"
                      value={createForm.unitId}
                      onChange={handleCreateChange}
                      disabled={!selectedCreateProperty}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: selectedCreateProperty ? 'white' : '#f1f5f9',
                      }}
                    >
                      <option value="">(optional)</option>
                      {selectedCreateProperty?.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Asset
                    <select
                      name="assetId"
                      value={createForm.assetId}
                      onChange={handleCreateChange}
                      disabled={!selectedCreateProperty || loadingAssets}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: selectedCreateProperty ? 'white' : '#f1f5f9',
                      }}
                    >
                      <option value="">{loadingAssets ? 'Loading assets...' : '(optional)'}</option>
                      {assetOptions.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} - {asset.category}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px',
                  border: 'none',
                  borderRadius: '4px',
                  background: submitting ? '#94a3b8' : '#2563eb',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </section>

          {canManageRequests && (
            <section style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>Filters</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Status
                  <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Any</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Priority
                  <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                    <option value="">Any</option>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Property
                  <select name="propertyId" value={filters.propertyId} onChange={handleFilterChange}>
                    <option value="">All</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Unit
                  <select
                    name="unitId"
                    value={filters.unitId}
                    onChange={handleFilterChange}
                    disabled={!selectedFilterProperty}
                  >
                    <option value="">All</option>
                    {selectedFilterProperty?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Technician
                  <select name="assigneeId" value={filters.assigneeId} onChange={handleFilterChange}>
                    <option value="">All</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label>
                  Page size{' '}
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      const size = Number(event.target.value);
                      if (Number.isNaN(size) || size <= 0) {
                        return;
                      }
                      setPageSize(size);
                      setPage(1);
                    }}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={handlePrev} disabled={page === 1 || loading}>
                  Prev
                </button>
                <button type="button" onClick={handleNext} disabled={loading || lastFetchCount < pageSize}>
                  Next
                </button>
                <span>Page {page}</span>
              </div>
            </section>
          )}
        </aside>

        <section style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', minHeight: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px' }}>
              {canManageRequests ? 'Portfolio maintenance queue' : 'My maintenance requests'}
            </h3>
            {canManageRequests && <span style={{ fontSize: '13px', color: '#555' }}>Results: {requests.length}</span>}
          </div>
          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No requests found for the selected filters.</p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {requests.map((request) => {
                const overdue =
                  request.dueAt && request.status !== 'COMPLETED' && new Date(request.dueAt).getTime() < Date.now();
                const noteDraftValue = noteDrafts[request.id] ?? '';
                const isSubmittingNote = noteSubmittingId === request.id;
                const disableNoteSubmit = noteDraftValue.trim().length === 0 || isSubmittingNote;
                return (
                  <article key={request.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{request.title}</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#444' }}>
                          <span>Priority: {request.priority}</span>
                          <span>Status: {request.status.replace('_', ' ')}</span>
                          {request.asset && <span>Asset: {request.asset.name}</span>}
                        </div>
                      </div>
                      {canManageRequests && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                          <label style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            Update status
                            <select
                              value={request.status}
                              onChange={(event) => handleStatusChange(request.id, event.target.value as StatusValue)}
                              disabled={updatingStatusId === request.id}
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            Assign technician
                            <select
                              value={request.assignee?.id ?? ''}
                              onChange={(event) => handleAssign(request.id, event.target.value)}
                              disabled={assigningRequestId === request.id}
                            >
                              <option value="">Unassigned</option>
                              {technicians.map((tech) => (
                                <option key={tech.id} value={tech.id}>
                                  {tech.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </header>
                    <p style={{ marginTop: '12px', marginBottom: '12px' }}>{request.description}</p>
                    <div style={{ fontSize: '13px', display: 'grid', gap: '4px' }}>
                      <span>
                        Property: {request.property?.name ?? '-'} | Unit: {request.unit?.name ?? '-'} | Reporter:{' '}
                        {request.author?.username ?? '-'}
                      </span>
                      <span>
                        Response SLA: {formatRelativeDue(request.responseDueAt)} | Resolution SLA: {formatRelativeDue(request.dueAt)}
                      </span>
                      <span>
                        Created: {formatDateTime(request.createdAt)} | Updated: {formatDateTime(request.updatedAt)}
                        {request.completedAt ? ` | Completed: ${formatDateTime(request.completedAt)}` : ''}
                      </span>
                      <span>
                        Assigned technician: {request.assignee?.name ?? 'Unassigned'} (
                        {request.assignee ? 'active' : 'pending dispatch'})
                      </span>
                      {overdue && <strong style={{ color: '#b91c1c' }}>Resolution SLA breached.</strong>}
                    </div>
                    {request.notes && request.notes.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                        <strong style={{ fontSize: '13px' }}>Recent notes</strong>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: '8px' }}>
                          {request.notes.slice(0, 3).map((note) => (
                            <li key={note.id} style={{ border: '1px solid #dbeafe', borderRadius: '6px', padding: '8px', background: '#f8fafc' }}>
                              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                                {note.author?.username ?? 'System'} | {formatDateTime(note.createdAt)}
                              </div>
                              <div style={{ fontSize: '13px', color: '#1f2937' }}>{note.body}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmitNote(request.id);
                      }}
                      style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'grid', gap: '8px' }}
                    >
                      <label style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        Add note
                        <textarea
                          value={noteDraftValue}
                          onChange={(event) => handleNoteDraftChange(request.id, event.target.value)}
                          rows={3}
                          placeholder="Share progress updates, scheduling details, or vendor notes"
                          disabled={isSubmittingNote}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                        />
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="submit"
                          disabled={disableNoteSubmit}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: disableNoteSubmit ? '#cbd5e1' : '#2563eb',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: disableNoteSubmit ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSubmittingNote ? 'Saving...' : 'Add note'}
                        </button>
                      </div>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
