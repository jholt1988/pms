import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

interface Lease {
  id: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  tenant: { username: string };
  unit: { name: string; property?: { name: string } | null };
}

interface Schedule {
  id: number;
  leaseId: number;
  amount: number;
  description: string;
  frequency: 'MONTHLY' | 'WEEKLY';
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  nextRun: string;
  lateFeeAmount?: number | null;
  lateFeeAfterDays?: number | null;
  active: boolean;
}

interface ScheduleFormState {
  amount: string;
  description: string;
  frequency: 'MONTHLY' | 'WEEKLY';
  dayOfMonth: string;
  dayOfWeek: string;
  lateFeeAmount: string;
  lateFeeAfterDays: string;
  active: boolean;
}

interface AutopayInfo {
  autopayEnrollment?: {
    active: boolean;
    maxAmount?: number | null;
    paymentMethod?: {
      provider: string;
      brand?: string | null;
      last4?: string | null;
    } | null;
  } | null;
}

const defaultScheduleForm = (lease: Lease, schedule?: Schedule): ScheduleFormState => ({
  amount: String(schedule?.amount ?? lease.rentAmount ?? 0),
  description: schedule?.description ?? 'Recurring Charge',
  frequency: schedule?.frequency ?? 'MONTHLY',
  dayOfMonth: schedule?.dayOfMonth != null ? String(schedule.dayOfMonth) : '',
  dayOfWeek: schedule?.dayOfWeek != null ? String(schedule.dayOfWeek) : '',
  lateFeeAmount:
    schedule?.lateFeeAmount != null ? String(schedule.lateFeeAmount) : '',
  lateFeeAfterDays:
    schedule?.lateFeeAfterDays != null ? String(schedule.lateFeeAfterDays) : '',
  active: schedule?.active ?? true,
});

export default function LeaseManagementPage(): React.ReactElement {
  const { token } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [scheduleForms, setScheduleForms] = useState<Record<number, ScheduleFormState>>({});
  const [schedules, setSchedules] = useState<Record<number, Schedule>>({});
  const [autopayMap, setAutopayMap] = useState<Record<number, AutopayInfo>>({});
  const [loading, setLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : undefined),
    [token],
  );

  const fetchLeases = async () => {
    if (!token) {
      return;
    }
    const res = await fetch('/api/leases', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to fetch leases');
    }
    const data = (await res.json()) as Lease[];
    setLeases(data);
    return data;
  };

  const fetchSchedules = async (leaseList: Lease[]) => {
    if (!token) {
      return;
    }
    const res = await fetch('/api/billing/schedules', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to fetch billing schedules');
    }

    const data = (await res.json()) as Schedule[];
    const scheduleByLease: Record<number, Schedule> = {};
    data.forEach((schedule) => {
      scheduleByLease[schedule.leaseId] = schedule;
    });
    setSchedules(scheduleByLease);

    const forms: Record<number, ScheduleFormState> = {};
    leaseList.forEach((lease) => {
      forms[lease.id] = defaultScheduleForm(lease, scheduleByLease[lease.id]);
    });
    setScheduleForms(forms);
  };

  const fetchAutopayStatuses = async (leaseList: Lease[]) => {
    if (!token) {
      return;
    }
    const entries = await Promise.all(
      leaseList.map(async (lease) => {
        const res = await fetch(`/api/billing/autopay?leaseId=${lease.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const normalized: AutopayInfo = {
            autopayEnrollment:
              data?.autopayEnrollment ?? data?.enrollment ?? null,
          };
          return [lease.id, normalized] as const;
        }
        return [lease.id, {}] as const;
      }),
    );
    const map: Record<number, AutopayInfo> = {};
    entries.forEach(([leaseId, info]) => {
      map[leaseId] = info;
    });
    setAutopayMap(map);
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const leaseData = await fetchLeases();
        if (leaseData) {
          await Promise.all([fetchSchedules(leaseData), fetchAutopayStatuses(leaseData)]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleScheduleFieldChange = (
    leaseId: number,
    field: keyof ScheduleFormState,
    value: string | boolean,
  ) => {
    setScheduleForms((prev) => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        [field]: value,
      },
    }));
    setNotice(null);
    setError(null);
  };

  const handleSaveSchedule = async (lease: Lease) => {
    if (!headers) {
      return;
    }
    const form = scheduleForms[lease.id];
    setScheduleSaving(true);
    setNotice(null);
    setError(null);

    try {
      const payload = {
        leaseId: lease.id,
        amount: Number(form.amount),
        description: form.description,
        frequency: form.frequency,
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
        dayOfWeek: form.dayOfWeek ? Number(form.dayOfWeek) : undefined,
        lateFeeAmount: form.lateFeeAmount ? Number(form.lateFeeAmount) : undefined,
        lateFeeAfterDays: form.lateFeeAfterDays ? Number(form.lateFeeAfterDays) : undefined,
        active: form.active,
      };

      const res = await fetch('/api/billing/schedules', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to save billing schedule');
      }

      const schedule = (await res.json()) as Schedule;
      setSchedules((prev) => ({ ...prev, [lease.id]: schedule }));
      setNotice(`Recurring charge saved for ${lease.tenant.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeactivateSchedule = async (leaseId: number) => {
    if (!token) {
      return;
    }
    setDeactivating(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch(`/api/billing/schedules/${leaseId}/deactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to deactivate schedule');
      }
      setSchedules((prev) => ({
        ...prev,
        [leaseId]: { ...prev[leaseId], active: false } as Schedule,
      }));
      setScheduleForms((prev) => ({
        ...prev,
        [leaseId]: { ...prev[leaseId], active: false },
      }));
      setNotice('Schedule deactivated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate schedule');
    } finally {
      setDeactivating(false);
    }
  };

  if (!token) {
    return <div>Please sign in to manage leases.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="rounded-md bg-red-100 px-4 py-3 text-red-700">{error}</div>;
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">Lease Management</h1>
      {notice && (
        <div className="rounded-md bg-green-100 px-4 py-3 text-green-700" role="status">
          {notice}
        </div>
      )}

      {leases.map((lease) => {
        const form = scheduleForms[lease.id];
        const schedule = schedules[lease.id];
        const autopay = autopayMap[lease.id];

        return (
          <div key={lease.id} className="space-y-4 rounded border border-gray-200 p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Tenant</p>
                <p className="font-medium">{lease.tenant.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">
                  {lease.unit.property ? `${lease.unit.property.name} — ${lease.unit.name}` : lease.unit.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start</p>
                <p>{new Date(lease.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End</p>
                <p>{new Date(lease.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p>${lease.rentAmount.toFixed(2)}</p>
              </div>
              {schedule && (
                <div>
                  <p className="text-sm text-gray-500">Next Invoice</p>
                  <p>{new Date(schedule.nextRun).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {form && (
              <div className="rounded border border-gray-200 p-4">
                <h2 className="text-lg font-semibold">Recurring Billing Schedule</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                      value={form.amount}
                      onChange={(e) => handleScheduleFieldChange(lease.id, 'amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                      value={form.description}
                      onChange={(e) =>
                        handleScheduleFieldChange(lease.id, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                      value={form.frequency}
                      onChange={(e) =>
                        handleScheduleFieldChange(
                          lease.id,
                          'frequency',
                          e.target.value as ScheduleFormState['frequency'],
                        )
                      }
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                  {form.frequency === 'MONTHLY' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Day of Month
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={28}
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                        value={form.dayOfMonth}
                        onChange={(e) =>
                          handleScheduleFieldChange(lease.id, 'dayOfMonth', e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                      <select
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                        value={form.dayOfWeek}
                        onChange={(e) =>
                          handleScheduleFieldChange(lease.id, 'dayOfWeek', e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Late Fee</label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                      value={form.lateFeeAmount}
                      onChange={(e) =>
                        handleScheduleFieldChange(lease.id, 'lateFeeAmount', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Late Fee Grace Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                      value={form.lateFeeAfterDays}
                      onChange={(e) =>
                        handleScheduleFieldChange(lease.id, 'lateFeeAfterDays', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    id={`schedule-active-${lease.id}`}
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleScheduleFieldChange(lease.id, 'active', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`schedule-active-${lease.id}`} className="text-sm text-gray-700">
                    Schedule active
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                    onClick={() => handleSaveSchedule(lease)}
                    disabled={scheduleSaving}
                  >
                    Save Schedule
                  </button>
                  <button
                    className="rounded border border-red-500 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => handleDeactivateSchedule(lease.id)}
                    disabled={deactivating}
                  >
                    Deactivate
                  </button>
                  {schedule && (
                    <span className="text-sm text-gray-500">
                      Next invoice:{' '}
                      {schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="rounded border border-gray-200 p-4">
              <h2 className="text-lg font-semibold">Autopay</h2>
              {autopay?.autopayEnrollment?.active ? (
                <>
                  <p className="text-sm text-gray-600">
                    Autopay is enabled for this lease.
                    {autopay.autopayEnrollment.maxAmount
                      ? ` Max amount $${autopay.autopayEnrollment.maxAmount.toFixed(2)}.`
                      : ''}
                  </p>
                  {autopay.autopayEnrollment.paymentMethod && (
                    <p className="text-sm text-gray-600">
                      Method: {autopay.autopayEnrollment.paymentMethod.provider}
                      {autopay.autopayEnrollment.paymentMethod.brand
                        ? ` • ${autopay.autopayEnrollment.paymentMethod.brand}`
                        : ''}
                      {autopay.autopayEnrollment.paymentMethod.last4
                        ? ` ending in ${autopay.autopayEnrollment.paymentMethod.last4}`
                        : ''}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Autopay is not currently enabled. Tenants can enroll from their Payments page once
                  a recurring schedule is active.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}



