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
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/PaymentsConsole.svg" 
        alt="Payments Console Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );

}
