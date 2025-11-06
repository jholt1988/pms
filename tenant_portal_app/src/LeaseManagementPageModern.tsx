import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { StatsCard, PageHeader, PipelineColumn, LeaseCard } from './components/ui';
import { Card, CardBody } from '@nextui-org/react';

type LeaseStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'RENEWAL_PENDING'
  | 'NOTICE_GIVEN'
  | 'TERMINATING'
  | 'TERMINATED'
  | 'HOLDOVER'
  | 'CLOSED';

interface Lease {
  id: number;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  tenant: {
    id: number;
    username: string;
  };
  unit: {
    id: number;
    name: string;
    property?: {
      id: number;
      name: string;
    } | null;
  };
  renewalOffers?: any[];
  notices?: any[];
  history?: any[];
}

const LIFECYCLE_COLUMNS: {
  key: string;
  title: string;
  statuses: LeaseStatus[];
  description: string;
}[] = [
  {
    key: 'preparation',
    title: 'Preparation',
    statuses: ['DRAFT', 'PENDING_APPROVAL'],
    description: 'Drafts awaiting approval or move-in readiness.',
  },
  {
    key: 'active',
    title: 'Active',
    statuses: ['ACTIVE'],
    description: 'In-flight leases with ongoing obligations.',
  },
  {
    key: 'renewal',
    title: 'Renewal Pipeline',
    statuses: ['RENEWAL_PENDING'],
    description: 'Leases with renewal offers or responses in progress.',
  },
  {
    key: 'ending',
    title: 'Ending Soon',
    statuses: ['NOTICE_GIVEN', 'TERMINATING'],
    description: 'Move-out notices and termination workflows.',
  },
  {
    key: 'closed',
    title: 'Closed & Holdover',
    statuses: ['TERMINATED', 'HOLDOVER', 'CLOSED'],
    description: 'Finalized leases and holdovers under monitoring.',
  },
];

const LeaseManagementPageModern = () => {
  const { token } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback] = useState<string | null>(null);
  const [expandedLeases, setExpandedLeases] = useState<Set<number>>(new Set());

  // Calculate insights from leases
  const insights = useMemo(() => {
    const total = leases.length;
    const active = leases.filter(l => l.status === 'ACTIVE').length;
    const moveOut = leases.filter(l => ['NOTICE_GIVEN', 'TERMINATING'].includes(l.status)).length;
    
    // Calculate renewals due soon (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const renewalDueSoon = leases.filter(l => {
      if (l.status !== 'ACTIVE') return false;
      const endDate = new Date(l.endDate);
      return endDate <= thirtyDaysFromNow && endDate >= now;
    }).length;
    
    const renewalOverdue = leases.filter(l => {
      if (l.status !== 'ACTIVE') return false;
      const endDate = new Date(l.endDate);
      return endDate < now;
    }).length;

    return { total, active, moveOut, renewalDueSoon, renewalOverdue };
  }, [leases]);

  // Group leases by pipeline columns
  const boardData = useMemo(() => {
    return LIFECYCLE_COLUMNS.map(column => ({
      ...column,
      leases: leases.filter(lease => column.statuses.includes(lease.status)),
    }));
  }, [leases]);

  const fetchLeases = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/leases', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch leases');
      }

      const data = await response.json();
      setLeases(data);
    } catch (err) {
      console.error('Error fetching leases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leases');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeases();
  }, [token, fetchLeases]);

  const toggleExpanded = (leaseId: number) => {
    setExpandedLeases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leaseId)) {
        newSet.delete(leaseId);
      } else {
        newSet.add(leaseId);
      }
      return newSet;
    });
  };

  const handleManageLease = (leaseId: number) => {
    toggleExpanded(leaseId);
  };

  if (!token) {
    return (
      <div className="p-4">
        <Card>
          <CardBody className="text-center">
            Please sign in to view lease management.
          </CardBody>
        </Card>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Lease Management' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lease Lifecycle Manager"
        subtitle="Track occupancy, renewals, and compliance so every lease stays on schedule."
        breadcrumbs={breadcrumbs}
      />

      {error && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody>
            <p className="text-sm text-danger-700">{error}</p>
          </CardBody>
        </Card>
      )}

      {feedback && (
        <Card className="border-success-200 bg-success-50">
          <CardBody>
            <p className="text-sm text-success-700">{feedback}</p>
          </CardBody>
        </Card>
      )}

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Leases"
          value={String(insights.total)}
          valueColor="default"
        />
        <StatsCard
          title="Active"
          value={String(insights.active)}
          valueColor="success"
        />
        <StatsCard
          title="Move-outs Pending"
          value={String(insights.moveOut)}
          valueColor="warning"
        />
        <StatsCard
          title="Renewals Due ≤ 30d"
          value={String(insights.renewalDueSoon)}
          valueColor="primary"
          subtitle={`Overdue: ${insights.renewalOverdue}`}
        />
      </section>

      {/* Pipeline Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Pipeline Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {boardData.map((column) => (
            <PipelineColumn
              key={column.key}
              title={column.title}
              description={column.description}
              count={column.leases.length}
              leases={column.leases}
              onManageLease={handleManageLease}
            />
          ))}
        </div>
      </section>

      {/* Lease Workflows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Lease Workflows</h2>
          <p className="text-xs text-foreground-500">Click a card to expand status, renewal, and notice actions.</p>
        </div>
        
        {loading ? (
          <Card className="border-dashed">
            <CardBody className="py-12 text-center">
              <p className="text-sm text-foreground-500">Loading leases…</p>
            </CardBody>
          </Card>
        ) : leases.length === 0 ? (
          <Card className="border-dashed">
            <CardBody className="py-12 text-center">
              <p className="text-sm text-foreground-500">No leases found.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {leases.map((lease) => (
              <div key={lease.id}>
                <LeaseCard
                  lease={lease}
                  onManage={handleManageLease}
                />
                
                {/* Expanded lease details would go here */}
                {expandedLeases.has(lease.id) && (
                  <Card className="mt-2 border-primary-200">
                    <CardBody>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Lease Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Start Date:</span> {new Date(lease.startDate).toLocaleDateString()}</p>
                            <p><span className="font-medium">End Date:</span> {new Date(lease.endDate).toLocaleDateString()}</p>
                            <p><span className="font-medium">Rent:</span> ${lease.rentAmount.toLocaleString()}/month</p>
                            <p><span className="font-medium">Deposit:</span> ${lease.depositAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Actions</h4>
                          <p className="text-sm text-foreground-500">
                            Lease management actions will be available here based on the current status.
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeaseManagementPageModern;