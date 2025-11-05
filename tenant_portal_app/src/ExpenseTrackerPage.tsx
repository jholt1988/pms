
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * The expense tracker page.
 * It allows property managers to track expenses for their properties.
 */
const ExpenseTrackerPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const expenseCategories = ['MAINTENANCE', 'UTILITIES', 'TAXES', 'INSURANCE', 'REPAIRS', 'OTHER'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expensesRes, propertiesRes] = await Promise.all([
          fetch('/api/expenses', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('/api/properties', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        if (!expensesRes.ok || !propertiesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [expensesData, propertiesData] = await Promise.all([
          expensesRes.json(),
          propertiesRes.json(),
        ]);

        setExpenses(expensesData);
        setProperties(propertiesData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: Number(selectedProperty),
          unitId: selectedUnit ? Number(selectedUnit) : undefined,
          description,
          amount: parseFloat(amount),
          date: new Date(date).toISOString(),
          category,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add expense');
      }

      const newExpense = await res.json();
      setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
      // Clear form
      setSelectedProperty('');
      setSelectedUnit('');
      setDescription('');
      setAmount('');
      setDate('');
      setCategory('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete expense');
      }

      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
    } catch (error: any) {
      setError(error.message);
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
        src="/wireframes/ExpensesOverview.svg" 
        alt="Expenses Overview Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ExpenseTrackerPage;
