


import React, { useState, useEffect } from 'react';

import { useAuth } from './AuthContext';



/**
 * The payments page.
 * It allows tenants to view their invoices and payments.
 */
const PaymentsPage = () => {

  const [invoices, setInvoices] = useState<any[]>([]);

  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

const [error, setError] = useState(null);
const auth = useAuth();
const token = auth && 'token' in auth ? (auth as any).token : null;
  useEffect(() => {

    const fetchData = async () => {

      try {

        const [invoicesRes, paymentsRes] = await Promise.all([

          fetch('/api/payments/invoices', {

            headers: {

              'Authorization': `Bearer ${token}`,

            },

          }),

          fetch('/api/payments', {

            headers: {

              'Authorization': `Bearer ${token}`,

            },

          }),

        ]);



        if (!invoicesRes.ok || !paymentsRes.ok) {

          throw new Error('Failed to fetch data');

        }



        const [invoicesData, paymentsData] = await Promise.all([

          invoicesRes.json(),

          paymentsRes.json(),

        ]);



        setInvoices(invoicesData);

        setPayments(paymentsData);

      } catch (error:any) {

        setError(error.message);

      } finally {

        setLoading(false);

      }

    };



    if (token) {

      fetchData();

    }

  }, [token]);



  if (loading) {

    return <div>Loading...</div>;

  }



  if (error) {

    return <div>Error: {error}</div>;

  }



  return (

    <div className="container mx-auto p-4">

      <h1 className="text-2xl font-bold mb-4">Payments</h1>



      <div className="mb-8">

        <h2 className="text-xl font-semibold mb-2">Invoices</h2>

        <table className="min-w-full bg-white">

          <thead>

            <tr>

              <th className="py-2 px-4 border-b">ID</th>

              <th className="py-2 px-4 border-b">Amount</th>

              <th className="py-2 px-4 border-b">Due Date</th>

              <th className="py-2 px-4 border-b">Status</th>

            </tr>

          </thead>

          <tbody>

            {invoices.map((invoice) => (

              <tr key={invoice.id}>

                <td className="py-2 px-4 border-b">{invoice.id}</td>

                <td className="py-2 px-4 border-b">{invoice.amount}</td>

                <td className="py-2 px-4 border-b">{new Date(invoice.dueDate).toLocaleDateString()}</td>

                <td className="py-2 px-4 border-b">{invoice.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>



      <div>

        <h2 className="text-xl font-semibold mb-2">Payments</h2>

        <table className="min-w-full bg-white">

          <thead>

            <tr>

              <th className="py-2 px-4 border-b">ID</th>

              <th className="py-2 px-4 border-b">Amount</th>

              <th className="py-2 px-4 border-b">Date</th>

            </tr>

          </thead>

          <tbody>

            {payments.map((payment) => (

              <tr key={payment.id}>

                <td className="py-2 px-4 border-b">{payment.id}</td>

                <td className="py-2 px-4 border-b">{payment.amount}</td>

                <td className="py-2 px-4 border-b">{new Date(payment.date).toLocaleDateString()}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



export default PaymentsPage;
