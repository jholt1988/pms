
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
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/RentEstimator.svg" 
        alt="Rent Estimator Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default RentEstimatorPage;
