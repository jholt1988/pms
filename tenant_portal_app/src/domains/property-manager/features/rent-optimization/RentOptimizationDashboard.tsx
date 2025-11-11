/**
 * Rent Optimization Dashboard
 * Property Manager dashboard for AI-generated rent recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Spinner, Button } from '@nextui-org/react';
import { RentRecommendationCard } from './RentRecommendationCard';
import { rentOptimizationService } from '../../../shared/ai-services/rent-optimization/RentOptimizationService';
import { RentRecommendation } from '../../../shared/ai-services/types';

export const RentOptimizationDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
  };

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, get unit IDs from backend
      // For now, use mock unit IDs
      const unitIds = ['1', '2', '3'];
      
      const response = await rentOptimizationService.getRecommendations(unitIds);

      if (response.success && response.data) {
        setRecommendations(response.data);
      } else {
        setError(response.error?.message || 'Failed to load recommendations');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleAccept = async (unitId: string, newRent: number) => {
    try {
      const recommendation = recommendations.find(r => r.unitId === unitId);
      if (!recommendation || !recommendation.id) {
        alert('Cannot accept recommendation: No ID found');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Call backend API to accept recommendation
      const response = await fetch(`/api/rent-recommendations/${recommendation.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to accept recommendation');
      }

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.unitId === unitId
            ? { ...rec, status: 'accepted' as const }
            : rec
        )
      );

      alert(`Rent recommendation accepted for unit ${unitId}!`);
    } catch (err: any) {
      console.error('Error accepting recommendation:', err);
      alert(`Error: ${err.message || 'Failed to accept recommendation'}`);
    }
  };

  const handleReject = async (unitId: string) => {
    try {
      const recommendation = recommendations.find(r => r.unitId === unitId);
      if (!recommendation || !recommendation.id) {
        alert('Cannot reject recommendation: No ID found');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Call backend API to reject recommendation
      const response = await fetch(`/api/rent-recommendations/${recommendation.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject recommendation');
      }

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.unitId === unitId
            ? { ...rec, status: 'rejected' as const }
            : rec
        )
      );

      alert(`Rent recommendation rejected for unit ${unitId}`);
    } catch (err: any) {
      console.error('Error rejecting recommendation:', err);
      alert(`Error: ${err.message || 'Failed to reject recommendation'}`);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Authentication required');
        return;
      }

      setLoading(true);
      setError(null);

      // Generate recommendations for units 1, 2, 3
      const response = await fetch('/api/rent-recommendations/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unitIds: [1, 2, 3] }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      // Reload recommendations
      await loadRecommendations();
      
      alert('Rent recommendations generated successfully!');
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading rent recommendations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-red-50 border border-red-200">
          <CardBody>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Recommendations</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button color="danger" variant="flat" onPress={loadRecommendations}>
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const pendingRecommendations = recommendations.filter(r => r.status === 'pending');
  const acceptedRecommendations = recommendations.filter(r => r.status === 'accepted');
  const rejectedRecommendations = recommendations.filter(r => r.status === 'rejected');

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rent Optimization</h1>
          <p className="text-gray-600 mt-1">
            AI-powered rent recommendations based on market analysis
          </p>
        </div>
        <div className="flex gap-3">
          <Button color="success" onPress={handleGenerateRecommendations}>
            Generate New
          </Button>
          <Button color="primary" variant="flat" onPress={loadRecommendations}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-orange-600">{pendingRecommendations.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-gray-600 text-sm">Accepted</p>
            <p className="text-3xl font-bold text-green-600">{acceptedRecommendations.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{rejectedRecommendations.length}</p>
          </CardBody>
        </Card>
      </div>

      {/* Pending Recommendations */}
      {pendingRecommendations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingRecommendations.map(rec => (
              <RentRecommendationCard
                key={rec.unitId}
                recommendation={rec}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Accepted Recommendations */}
      {acceptedRecommendations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Accepted Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {acceptedRecommendations.map(rec => (
              <RentRecommendationCard
                key={rec.unitId}
                recommendation={rec}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Recommendations */}
      {rejectedRecommendations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Rejected Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rejectedRecommendations.map(rec => (
              <RentRecommendationCard
                key={rec.unitId}
                recommendation={rec}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 text-lg">No rent recommendations available</p>
            <p className="text-gray-400 text-sm mt-2">
              Recommendations will appear here once generated
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default RentOptimizationDashboard;
