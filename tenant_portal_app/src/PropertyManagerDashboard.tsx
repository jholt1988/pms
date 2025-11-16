/**
 * Property Manager Dashboard
 * Overview page for property manager users showing key metrics and pending tasks
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress
} from '@nextui-org/react';
import {
  Building2,
  Wrench,
  DollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { PageHeader } from './components/ui/PageHeader';

interface DashboardMetrics {
  occupancy: {
    total: number;
    occupied: number;
    vacant: number;
    percentage: number;
  };
  financials: {
    monthlyRevenue: number;
    collectedThisMonth: number;
    outstanding: number;
  };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    overdue: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: Array<{
    id: number;
    type: 'maintenance' | 'application' | 'payment' | 'lease';
    title: string;
    date: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

const mockMetrics: DashboardMetrics = {
  occupancy: {
    total: 50,
    occupied: 47,
    vacant: 3,
    percentage: 94
  },
  financials: {
    monthlyRevenue: 75000,
    collectedThisMonth: 68000,
    outstanding: 7000
  },
  maintenance: {
    total: 15,
    pending: 5,
    inProgress: 8,
    overdue: 2
  },
  applications: {
    total: 12,
    pending: 7,
    approved: 4,
    rejected: 1
  },
  recentActivity: [
    { id: 1, type: 'maintenance', title: 'Emergency HVAC repair - Unit 12B', date: '2025-11-06', priority: 'high' },
    { id: 2, type: 'application', title: 'New rental application - Sarah Johnson', date: '2025-11-06', priority: 'medium' },
    { id: 3, type: 'payment', title: 'Late payment alert - Unit 5A', date: '2025-11-05', priority: 'high' },
    { id: 4, type: 'lease', title: 'Lease renewal due - Unit 8C', date: '2025-11-05', priority: 'medium' },
  ]
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const PropertyManagerDashboard: React.FC = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!metrics) {
    return <p>Could not load dashboard metrics.</p>;
  }

  const collectionRate = Math.round((metrics.financials.collectedThisMonth / metrics.financials.monthlyRevenue) * 100);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Property management overview and key metrics"
      />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <Link to="/properties">
          <Card className="border-l-4 border-l-success">
            <CardBody className="p-4">
              {/* ... (Occupancy Rate card content) */}
            </CardBody>
          </Card>
        </Link>

        {/* Monthly Revenue */}
        <Link to="/reporting">
          <Card className="border-l-4 border-l-primary">
            <CardBody className="p-4">
              {/* ... (Monthly Revenue card content) */}
            </CardBody>
          </Card>
        </Link>

        {/* Maintenance Requests */}
        <Link to="/maintenance-management">
          <Card className="border-l-4 border-l-warning">
            <CardBody className="p-4">
              {/* ... (Maintenance Requests card content) */}
            </CardBody>
          </Card>
        </Link>

        {/* Applications */}
        <Link to="/rental-applications-management">
          <Card className="border-l-4 border-l-secondary">
            <CardBody className="p-4">
              {/* ... (Applications card content) */}
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* ... (rest of the dashboard) */}
    </div>
  );
};

export default PropertyManagerDashboard;
