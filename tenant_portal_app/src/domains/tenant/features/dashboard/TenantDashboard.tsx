/**
 * Tenant Dashboard
 * Overview page for tenant users showing key information at a glance
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Chip
} from '@nextui-org/react';
import { 
  DollarSign, 
  Wrench, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../../AuthContext';
import { PageHeader } from '../../../../components/ui/PageHeader';

interface DashboardData {
  nextRentPayment?: {
    amount: number;
    dueDate: string;
    isPaid: boolean;
  };
  maintenanceRequests: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  lease?: {
    unit: string;
    property: string;
    startDate: string;
    endDate: string;
    daysUntilRenewal?: number;
    status: string;
  };
  recentActivity: Array<{
    id: number;
    type: 'payment' | 'maintenance' | 'lease' | 'message';
    title: string;
    date: string;
    status?: string;
  }>;
}

const mockData: DashboardData = {
  nextRentPayment: {
    amount: 1500,
    dueDate: '2025-12-01',
    isPaid: false
  },
  maintenanceRequests: {
    total: 5,
    pending: 1,
    inProgress: 2,
    completed: 2
  },
  lease: {
    unit: '2A',
    property: 'Sunset Apartments',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    daysUntilRenewal: 55,
    status: 'ACTIVE'
  },
  recentActivity: [
    { id: 1, type: 'maintenance', title: 'HVAC repair completed', date: '2025-11-03', status: 'completed' },
    { id: 2, type: 'payment', title: 'Rent payment processed', date: '2025-11-01', status: 'paid' },
    { id: 3, type: 'maintenance', title: 'Plumbing issue reported', date: '2025-10-28', status: 'in_progress' },
  ]
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDaysUntil = (dateString: string) => {
  const target = new Date(dateString);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const TenantDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data] = useState<DashboardData>(mockData);

  useEffect(() => {
    // TODO: Replace with actual API call when backend is ready
    // Example: fetchDashboardData(token).then(setData)
    // For now, using mock data
  }, [token]);

  const daysUntilRent = data.nextRentPayment ? getDaysUntil(data.nextRentPayment.dueDate) : 0;
  const rentDueStatus = daysUntilRent <= 3 ? 'danger' : daysUntilRent <= 7 ? 'warning' : 'success';

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your rental."
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Rent Payment */}
        {data.nextRentPayment && !data.nextRentPayment.isPaid && (
          <Card className="border-l-4 border-l-primary">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Next Rent Payment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.nextRentPayment.amount)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      Due {formatDate(data.nextRentPayment.dueDate)}
                    </p>
                  </div>
                  <Chip 
                    size="sm" 
                    color={rentDueStatus}
                    variant="flat"
                    className="mt-2"
                  >
                    {daysUntilRent} days left
                  </Chip>
                </div>
                <DollarSign className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Maintenance Requests */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Maintenance Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.maintenanceRequests.total}
                </p>
                <div className="flex gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">{data.maintenanceRequests.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">{data.maintenanceRequests.inProgress} Active</span>
                  </div>
                </div>
              </div>
              <Wrench className="w-8 h-8 text-gray-300" />
            </div>
          </CardBody>
        </Card>

        {/* Lease Status */}
        {data.lease && (
          <Card>
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Lease Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.lease.property}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">Unit {data.lease.unit}</p>
                  {data.lease.daysUntilRenewal && data.lease.daysUntilRenewal <= 90 && (
                    <Chip size="sm" color="warning" variant="flat">
                      Renewal due in {data.lease.daysUntilRenewal} days
                    </Chip>
                  )}
                  {(!data.lease.daysUntilRenewal || data.lease.daysUntilRenewal > 90) && (
                    <Chip size="sm" color="success" variant="flat">
                      Active
                    </Chip>
                  )}
                </div>
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100">
          <CardBody className="p-4">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm text-primary-700 font-semibold mb-1">Quick Actions</p>
                <p className="text-xs text-primary-600 mb-3">Common tasks</p>
              </div>
              <div className="space-y-2">
                <Link to="/payments">
                  <Button size="sm" color="primary" variant="flat" fullWidth>
                    Make Payment
                  </Button>
                </Link>
                <Link to="/maintenance">
                  <Button size="sm" color="primary" variant="bordered" fullWidth>
                    New Request
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Link to="/messaging">
                <Button size="sm" variant="light" color="primary">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.recentActivity.map((activity) => {
                const icon = activity.type === 'payment' ? DollarSign :
                            activity.type === 'maintenance' ? Wrench :
                            activity.type === 'lease' ? FileText : AlertCircle;
                const Icon = icon;
                
                const statusIcon = activity.status === 'completed' || activity.status === 'paid' ? CheckCircle :
                                  activity.status === 'in_progress' ? Clock : AlertCircle;
                const StatusIcon = statusIcon;
                
                const statusColor = activity.status === 'completed' || activity.status === 'paid' ? 'text-success' :
                                   activity.status === 'in_progress' ? 'text-primary' : 'text-warning';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mt-0.5">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.date)}</p>
                    </div>
                    <StatusIcon className={`w-4 h-4 ${statusColor} flex-shrink-0`} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Lease Details Card */}
        {data.lease && (
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-lg font-semibold">Your Lease</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="text-base font-semibold text-gray-900">{data.lease.property}</p>
                  <p className="text-sm text-gray-700">Unit {data.lease.unit}</p>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Lease Period</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Start:</span>
                    <span className="font-medium">{formatDate(data.lease.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-700">End:</span>
                    <span className="font-medium">{formatDate(data.lease.endDate)}</span>
                  </div>
                </div>

                {data.lease.daysUntilRenewal && data.lease.daysUntilRenewal <= 90 && (
                  <div className="border-t pt-4">
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-warning-900">Renewal Due Soon</p>
                          <p className="text-xs text-warning-700 mt-1">
                            Your lease expires in {data.lease.daysUntilRenewal} days. Contact your property manager about renewal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Link to="/my-lease" className="block">
                  <Button color="primary" variant="flat" fullWidth>
                    View Lease Details
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
