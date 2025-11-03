
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Expense Tracker</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add New Expense</h2>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label htmlFor="property" className="block text-sm font-medium text-gray-700">Property</label>
            <select
              id="property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit (Optional)</label>
            <select
              id="unit"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Select a unit</option>
              {selectedProperty && properties.find(p => p.id === Number(selectedProperty))?.units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a category</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Expense
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">All Expenses</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Property</th>
              <th className="py-2 px-4 border-b">Unit</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b">Date</th>
              <th className="py-2 px-4 border-b">Category</th>
              <th className="py-2 px-4 border-b">Recorded By</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="py-2 px-4 border-b">{expense.property.name}</td>
                <td className="py-2 px-4 border-b">{expense.unit?.name || 'N/A'}</td>
                <td className="py-2 px-4 border-b">{expense.description}</td>
                <td className="py-2 px-4 border-b">${expense.amount}</td>
                <td className="py-2 px-4 border-b">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">{expense.category}</td>
                <td className="py-2 px-4 border-b">{expense.recordedBy.username}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTrackerPage;
