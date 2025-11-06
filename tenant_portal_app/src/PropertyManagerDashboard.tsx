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
  const [metrics] = useState<DashboardMetrics>(mockMetrics);

  useEffect(() => {
    // TODO: Replace with actual API call when backend is ready
    // Example: fetchDashboardMetrics(token).then(setMetrics)
    console.log('[PropertyManagerDashboard] Component mounted');
  }, [token]);

  const collectionRate = Math.round((metrics.financials.collectedThisMonth / metrics.financials.monthlyRevenue) * 100);

  console.log('[PropertyManagerDashboard] Rendering dashboard');

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Property management overview and key metrics"
      />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <Card className="border-l-4 border-l-success">
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.occupancy.percentage}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {metrics.occupancy.occupied} of {metrics.occupancy.total} units
                </p>
                <Progress
                  value={metrics.occupancy.percentage}
                  color="success"
                  size="sm"
                  className="mt-3"
                />
              </div>
              <Building2 className="w-8 h-8 text-success opacity-20" />
            </div>
          </CardBody>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.financials.monthlyRevenue)}
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Collected</span>
                    <span className="font-semibold text-success">{formatCurrency(metrics.financials.collectedThisMonth)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Outstanding</span>
                    <span className="font-semibold text-danger">{formatCurrency(metrics.financials.outstanding)}</span>
                  </div>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardBody>
        </Card>

        {/* Maintenance Requests */}
        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Maintenance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.maintenance.total}
                </p>
                <p className="text-xs text-gray-600 mt-1">Active requests</p>
                <div className="flex gap-2 mt-3">
                  <Chip size="sm" color="warning" variant="flat">
                    {metrics.maintenance.pending} Pending
                  </Chip>
                  {metrics.maintenance.overdue > 0 && (
                    <Chip size="sm" color="danger" variant="flat">
                      {metrics.maintenance.overdue} Overdue
                    </Chip>
                  )}
                </div>
              </div>
              <Wrench className="w-8 h-8 text-warning opacity-20" />
            </div>
          </CardBody>
        </Card>

        {/* Applications */}
        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Applications</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.applications.pending}
                </p>
                <p className="text-xs text-gray-600 mt-1">Pending review</p>
                <div className="flex gap-2 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-gray-600">{metrics.applications.approved} Approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-danger"></div>
                    <span className="text-gray-600">{metrics.applications.rejected} Rejected</span>
                  </div>
                </div>
              </div>
              <FileText className="w-8 h-8 text-secondary opacity-20" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Common tasks and workflows</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/rental-applications-management">
                <Button color="primary" variant="flat" size="sm">
                  Review Applications
                </Button>
              </Link>
              <Link to="/maintenance">
                <Button color="warning" variant="flat" size="sm">
                  Maintenance Queue
                </Button>
              </Link>
              <Link to="/lease-management">
                <Button color="secondary" variant="flat" size="sm">
                  Manage Leases
                </Button>
              </Link>
              <Link to="/expense-tracker">
                <Button color="default" variant="flat" size="sm">
                  Track Expenses
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Button size="sm" variant="light" color="primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {metrics.recentActivity.map((activity) => {
                const icon = activity.type === 'maintenance' ? Wrench :
                            activity.type === 'application' ? FileText :
                            activity.type === 'payment' ? DollarSign :
                            Calendar;
                const Icon = icon;

                const priorityColor = activity.priority === 'high' ? 'text-danger' :
                                     activity.priority === 'medium' ? 'text-warning' :
                                     'text-gray-400';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mt-0.5">
                      <Icon className={`w-5 h-5 ${priorityColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.date)}</p>
                    </div>
                    {activity.priority === 'high' && (
                      <Chip size="sm" color="danger" variant="flat">
                        Urgent
                      </Chip>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">Financial Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Collection Rate</span>
                  <span className="text-lg font-bold text-gray-900">{collectionRate}%</span>
                </div>
                <Progress
                  value={collectionRate}
                  color={collectionRate >= 90 ? 'success' : collectionRate >= 75 ? 'warning' : 'danger'}
                  size="md"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expected Revenue</span>
                  <span className="font-semibold">{formatCurrency(metrics.financials.monthlyRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-success-600">Collected</span>
                  <span className="font-semibold text-success">{formatCurrency(metrics.financials.collectedThisMonth)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-danger-600">Outstanding</span>
                  <span className="font-semibold text-danger">{formatCurrency(metrics.financials.outstanding)}</span>
                </div>
              </div>

              {metrics.financials.outstanding > 0 && (
                <div className="border-t pt-4">
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-warning-900">Outstanding Payments</p>
                        <p className="text-xs text-warning-700 mt-1">
                          {formatCurrency(metrics.financials.outstanding)} in unpaid rent requires follow-up
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Link to="/reporting" className="block">
                <Button color="primary" variant="flat" fullWidth>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Full Reports
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PropertyManagerDashboard;
