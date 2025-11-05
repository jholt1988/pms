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
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/MaintenanceDashboard.svg" 
        alt="Maintenance Dashboard Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default MaintenanceDashboard;
