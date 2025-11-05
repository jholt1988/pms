import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Inspection {
  id: number;
  type: string;
  status: string;
  scheduledDate: string;
  completedDate: string | null;
  notes: string | null;
  findings: any;
  unit: {
    id: number;
    name: string;
    property: {
      id: number;
      name: string;
    };
  };
  inspector: {
    id: number;
    username: string;
  } | null;
  photos: Array<{
    id: number;
    url: string;
    caption: string | null;
  }>;
}

interface Property {
  id: number;
  name: string;
  units: Array<{
    id: number;
    name: string;
  }>;
}

export default function InspectionManagementPage(): React.ReactElement {
  const { token } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [filters, setFilters] = useState({
    propertyId: '',
    unitId: '',
    status: '',
    type: '',
    startDate: '',
    endDate: '',
  });

  const [formData, setFormData] = useState({
    unitId: '',
    propertyId: '',
    type: 'ROUTINE',
    scheduledDate: '',
    notes: '',
  });

  const [completeData, setCompleteData] = useState({
    findings: '',
    notes: '',
  });

  useEffect(() => {
    fetchInspections();
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.unitId) params.append('unitId', filters.unitId);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/inspections?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inspections');
      }

      const data = await response.json();
      setInspections(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create inspection');
      }

      setShowCreateModal(false);
      setFormData({ unitId: '', propertyId: '', type: 'ROUTINE', scheduledDate: '', notes: '' });
      fetchInspections();
    } catch (err: any) {
      setError(err.message || 'Failed to create inspection');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection) return;
    setError(null);

    try {
      let findings;
      try {
        findings = JSON.parse(completeData.findings);
      } catch {
        findings = { notes: completeData.findings };
      }

      const response = await fetch(`/api/inspections/${selectedInspection.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          findings,
          notes: completeData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete inspection');
      }

      setShowCompleteModal(false);
      setSelectedInspection(null);
      setCompleteData({ findings: '', notes: '' });
      fetchInspections();
    } catch (err: any) {
      setError(err.message || 'Failed to complete inspection');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this inspection?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel inspection');
      }

      fetchInspections();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel inspection');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const selectedProperty = properties.find((p) => p.id === parseInt(formData.propertyId, 10));

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inspection Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Schedule Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={filters.propertyId}
            onChange={(e) => {
              setFilters({ ...filters, propertyId: e.target.value, unitId: '' });
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="MOVE_IN">Move In</option>
            <option value="MOVE_OUT">Move Out</option>
            <option value="ROUTINE">Routine</option>
            <option value="DAMAGE">Damage</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border rounded px-3 py-2"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border rounded px-3 py-2"
            placeholder="End Date"
          />
          <button
            onClick={() => setFilters({ propertyId: '', unitId: '', status: '', type: '', startDate: '', endDate: '' })}
            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Loading inspections...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{getTypeLabel(inspection.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inspection.unit.property.name} - {inspection.unit.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(inspection.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inspection.inspector?.username || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {inspection.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInspection(inspection);
                            setShowCompleteModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(inspection.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {inspection.status === 'COMPLETED' && (
                      <button
                        onClick={() => setSelectedInspection(inspection)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Schedule Inspection</h2>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Property</label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Unit</label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                    disabled={!selectedProperty}
                  >
                    <option value="">Select Unit</option>
                    {selectedProperty?.units.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="MOVE_IN">Move In</option>
                    <option value="MOVE_OUT">Move Out</option>
                    <option value="ROUTINE">Routine</option>
                    <option value="DAMAGE">Damage</option>
                    <option value="COMPLIANCE">Compliance</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Scheduled Date</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded flex-1">
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Complete Inspection</h2>
              <form onSubmit={handleComplete}>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Findings (JSON format)</label>
                  <textarea
                    value={completeData.findings}
                    onChange={(e) => setCompleteData({ ...completeData, findings: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={10}
                    placeholder='{"condition": "good", "issues": ["minor wear"], "recommendations": ["repaint"]}'
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Notes (Optional)</label>
                  <textarea
                    value={completeData.notes}
                    onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded flex-1">
                    Complete Inspection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteModal(false);
                      setSelectedInspection(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedInspection && !showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{getTypeLabel(selectedInspection.type)} Inspection</h2>
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Property/Unit</h3>
                  <p className="text-gray-600">
                    {selectedInspection.unit.property.name} - {selectedInspection.unit.name}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Status</h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedInspection.status)}`}>
                    {selectedInspection.status}
                  </span>
                </div>

                {selectedInspection.findings && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Findings</h3>
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedInspection.findings, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedInspection.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedInspection.photos.map((photo) => (
                        <div key={photo.id}>
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Inspection photo'}
                            className="w-full h-48 object-cover rounded border border-gray-200"
                          />
                          {photo.caption && <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

