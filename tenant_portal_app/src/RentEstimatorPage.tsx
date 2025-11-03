
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RentEstimatorPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [estimatedRent, setEstimatedRent] = useState<number | null>(null);
  const [estimationDetails, setEstimationDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useAuth() as { token?: string } | null;
  const token = auth?.token;

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/properties', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await res.json();
        setProperties(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProperties();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find((p) => p.id === Number(selectedProperty));
      if (property) {
        setUnits(property.units);
      }
    }
  }, [selectedProperty, properties]);

  const handleEstimateRent = async () => {
    setLoading(true);
    setError(null);
    setEstimatedRent(null);
    setEstimationDetails(null);

    try {
      const res = await fetch(`/api/rent-estimator?propertyId=${selectedProperty}&unitId=${selectedUnit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to estimate rent');
      }

      const data = await res.json();
      setEstimatedRent(data.estimatedRent);
      setEstimationDetails(data.details);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
      <h1 className="text-2xl font-bold mb-4">Rent Estimator</h1>

      <div className="space-y-4">
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">Property</label>
          <select
            id="property"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            id="unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
            disabled={!selectedProperty}
          >
            <option value="">Select a unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleEstimateRent}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={!selectedProperty || !selectedUnit}
        >
          Estimate Rent
        </button>
      </div>

      {estimatedRent !== null && (
        <div className="mt-8 p-4 border rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Estimated Rent: ${estimatedRent}</h2>
          <p className="text-gray-700">{estimationDetails}</p>
        </div>
      )}
    </div>
  );
};

export default RentEstimatorPage;
