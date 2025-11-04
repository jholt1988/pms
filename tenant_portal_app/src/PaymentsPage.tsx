import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

interface Invoice {
  id: number;
  amount: number;
  dueDate: string;
  status: string;
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  status: string;
}

interface PaymentMethod {
  id: number;
  type: string;
  provider: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  createdAt: string;
}

interface AutopayStatus {
  leaseId: number;
  enrollment?: {
    id: number;
    active: boolean;
    maxAmount?: number | null;
    paymentMethodId: number;
    paymentMethod?: PaymentMethod | null;
  } | null;
}

const defaultMethodForm = {
  type: 'CARD',
  provider: 'STRIPE',
  last4: '',
  brand: '',
  expMonth: '',
  expYear: '',
  providerCustomerId: '',
  providerPaymentMethodId: '',
};

export default function PaymentsPage(): React.ReactElement {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodForm, setMethodForm] = useState(defaultMethodForm);
  const [autopay, setAutopay] = useState<AutopayStatus | null>(null);
  const [leaseId, setLeaseId] = useState<number | null>(null);
  const [autopayMaxAmount, setAutopayMaxAmount] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        : undefined,
    [token],
  );

  const loadInvoicesAndPayments = async () => {
    if (!token) {
      return;
    }

    const invoicesRes = await fetch('/api/payments/invoices', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const paymentsRes = await fetch('/api/payments', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!invoicesRes.ok || !paymentsRes.ok) {
      throw new Error('Failed to fetch payment information');
    }

    const [invoicesData, paymentsData] = await Promise.all([
      invoicesRes.json(),
      paymentsRes.json(),
    ]);

    setInvoices(invoicesData);
    setPayments(paymentsData);
  };

  const loadBillingExtras = async () => {
    if (!token) {
      return;
    }

    const methodsRes = await fetch('/api/payment-methods', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (methodsRes.ok) {
      setPaymentMethods(await methodsRes.json());
    }

    const autopayRes = await fetch('/api/billing/autopay', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (autopayRes.ok) {
      const data = (await autopayRes.json()) as AutopayStatus;
      setAutopay(data);
      setLeaseId(data.leaseId);
      if (data.enrollment?.paymentMethodId) {
        setSelectedMethodId(String(data.enrollment.paymentMethodId));
      }
      if (typeof data.enrollment?.maxAmount === 'number') {
        setAutopayMaxAmount(String(data.enrollment.maxAmount));
      }
    } else if (autopayRes.status === 404) {
      setAutopay(null);
      // get lease id if missing
      const leaseRes = await fetch('/api/leases/my-lease', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (leaseRes.ok) {
        const leaseData = await leaseRes.json();
        setLeaseId(leaseData.id);
      }
    } else {
      const msg = await autopayRes.text();
      throw new Error(msg || 'Failed to fetch autopay status');
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await Promise.all([loadInvoicesAndPayments(), loadBillingExtras()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshBillingExtras = async () => {
    try {
      await loadBillingExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleMethodFormChange = (field: keyof typeof methodForm, value: string) => {
    setMethodForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPaymentMethod = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authHeaders) {
      return;
    }
    setActionLoading(true);
    setNotice(null);
    setError(null);

    try {
      const payload = {
        type: methodForm.type,
        provider: methodForm.provider,
        last4: methodForm.last4 || undefined,
        brand: methodForm.brand || undefined,
        providerCustomerId: methodForm.providerCustomerId || undefined,
        providerPaymentMethodId: methodForm.providerPaymentMethodId || undefined,
        expMonth: methodForm.expMonth ? Number(methodForm.expMonth) : undefined,
        expYear: methodForm.expYear ? Number(methodForm.expYear) : undefined,
      };

      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || 'Failed to add payment method');
      }

      setMethodForm(defaultMethodForm);
      setNotice('Payment method saved.');
      await refreshBillingExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    if (!token) {
      return;
    }
    setActionLoading(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to delete payment method');
      }

      setNotice('Payment method removed.');
      await refreshBillingExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableAutopay = async () => {
    if (!authHeaders || !leaseId || !selectedMethodId) {
      setError('Select a payment method to enable autopay.');
      return;
    }

    setActionLoading(true);
    setNotice(null);
    setError(null);

    try {
      const payload = {
        leaseId,
        paymentMethodId: Number(selectedMethodId),
        active: true,
        maxAmount: autopayMaxAmount ? Number(autopayMaxAmount) : undefined,
      };

      const res = await fetch('/api/billing/autopay', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to configure autopay');
      }

      setNotice('Autopay enabled.');
      await refreshBillingExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enable autopay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableAutopay = async () => {
    if (!token || !leaseId) {
      return;
    }
    setActionLoading(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch(`/api/billing/autopay/${leaseId}/disable`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to disable autopay');
      }

      setNotice('Autopay disabled.');
      setSelectedMethodId('');
      setAutopayMaxAmount('');
      await refreshBillingExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to disable autopay');
    } finally {
      setActionLoading(false);
    }
  };

  if (!token) {
    return <div>Please sign in to view payments.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Payments</h1>

      {error && (
        <div className="rounded-md bg-red-100 px-4 py-3 text-red-700" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-md bg-green-100 px-4 py-3 text-green-700" role="status">
          {notice}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold">Invoices</h2>
        {invoices.length === 0 ? (
          <p>No invoices available.</p>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border-b px-4 py-2 text-left">ID</th>
                <th className="border-b px-4 py-2 text-left">Amount</th>
                <th className="border-b px-4 py-2 text-left">Due Date</th>
                <th className="border-b px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="border-b px-4 py-2">{invoice.id}</td>
                  <td className="border-b px-4 py-2">${invoice.amount.toFixed(2)}</td>
                  <td className="border-b px-4 py-2">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="border-b px-4 py-2">{invoice.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p>No payments recorded.</p>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border-b px-4 py-2 text-left">ID</th>
                <th className="border-b px-4 py-2 text-left">Amount</th>
                <th className="border-b px-4 py-2 text-left">Date</th>
                <th className="border-b px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="border-b px-4 py-2">{payment.id}</td>
                  <td className="border-b px-4 py-2">${payment.amount.toFixed(2)}</td>
                  <td className="border-b px-4 py-2">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="border-b px-4 py-2">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Payment Methods</h2>
        {paymentMethods.length === 0 ? (
          <p>You have not saved any payment methods.</p>
        ) : (
          <ul className="space-y-2">
            {paymentMethods.map((method) => (
              <li
                key={method.id}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {method.provider} {method.brand ? `• ${method.brand}` : ''}{' '}
                    {method.last4 ? `ending in ${method.last4}` : ''}
                  </p>
                  {method.expMonth && method.expYear && (
                    <p className="text-sm text-gray-500">
                      Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                    </p>
                  )}
                </div>
                <button
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  onClick={() => handleDeletePaymentMethod(method.id)}
                  disabled={actionLoading || autopay?.enrollment?.paymentMethodId === method.id}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleAddPaymentMethod}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.type}
              onChange={(e) => handleMethodFormChange('type', e.target.value)}
            >
              <option value="CARD">Card</option>
              <option value="BANK_ACCOUNT">Bank Account</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.provider}
              onChange={(e) => handleMethodFormChange('provider', e.target.value)}
            >
              <option value="STRIPE">Stripe</option>
              <option value="PLAID">Plaid</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.brand}
              onChange={(e) => handleMethodFormChange('brand', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last 4 digits</label>
            <input
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.last4}
              onChange={(e) => handleMethodFormChange('last4', e.target.value)}
              maxLength={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Exp Month</label>
            <input
              type="number"
              min={1}
              max={12}
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.expMonth}
              onChange={(e) => handleMethodFormChange('expMonth', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Exp Year</label>
            <input
              type="number"
              min={new Date().getFullYear()}
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
              value={methodForm.expYear}
              onChange={(e) => handleMethodFormChange('expYear', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={actionLoading}
            >
              Save Method
            </button>
          </div>
        </form>
      </section>

      {leaseId && (
        <section>
          <h2 className="mb-2 text-xl font-semibold">Autopay</h2>
          {autopay?.enrollment?.active ? (
            <div className="rounded border border-green-200 bg-green-50 p-4">
              <p className="font-medium">Autopay is enabled.</p>
              {autopay.enrollment.paymentMethod && (
                <p className="text-sm text-gray-600">
                  Using {autopay.enrollment.paymentMethod.provider}
                  {autopay.enrollment.paymentMethod.brand
                    ? ` • ${autopay.enrollment.paymentMethod.brand}`
                    : ''}
                  {autopay.enrollment.paymentMethod.last4
                    ? ` ending in ${autopay.enrollment.paymentMethod.last4}`
                    : ''}
                </p>
              )}
              {typeof autopay.enrollment.maxAmount === 'number' && (
                <p className="text-sm text-gray-600">
                  Max charge amount: ${autopay.enrollment.maxAmount.toFixed(2)}
                </p>
              )}
              <button
                className="mt-3 rounded border border-red-500 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                onClick={handleDisableAutopay}
                disabled={actionLoading}
              >
                Disable Autopay
              </button>
            </div>
          ) : (
            <div className="rounded border border-gray-200 p-4">
              <p className="mb-3 text-sm text-gray-600">
                Choose a saved payment method and optional payment limit to automatically pay
                invoices on their due date.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                    value={selectedMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                  >
                    <option value="">Select a method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.provider}
                        {method.last4 ? ` •••• ${method.last4}` : ` (ID ${method.id})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Amount (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
                    value={autopayMaxAmount}
                    onChange={(e) => setAutopayMaxAmount(e.target.value)}
                    placeholder="Leave blank for no limit"
                  />
                </div>
              </div>
              <button
                className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                onClick={handleEnableAutopay}
                disabled={actionLoading || paymentMethods.length === 0}
              >
                Enable Autopay
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
