
import React, { useState, useEffect } from 'react';

/**
 * The rental application page.
 * It allows prospective tenants to apply for a rental property.
 */
const RentalApplicationPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [income, setIncome] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [monthlyDebt, setMonthlyDebt] = useState('');
  const [bankruptcyFiledYear, setBankruptcyFiledYear] = useState('');
  const [rentalHistoryComments, setRentalHistoryComments] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [previousAddress, setPreviousAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/properties/public');
        if (!res.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await res.json();
        setProperties(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find((p) => p.id === Number(selectedProperty));
      if (property) {
        setUnits(property.units);
      }
    }
  }, [selectedProperty, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/rental-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: Number(selectedProperty),
          unitId: Number(selectedUnit),
          fullName,
          email,
          phoneNumber,
          income: parseFloat(income),
          employmentStatus,
          previousAddress,
          creditScore: creditScore ? Number(creditScore) : undefined,
          monthlyDebt: monthlyDebt ? Number(monthlyDebt) : undefined,
          bankruptcyFiledYear: bankruptcyFiledYear ? Number(bankruptcyFiledYear) : undefined,
          rentalHistoryComments: rentalHistoryComments || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit application');
      }

      setSuccess(true);
      // Clear form
      setSelectedProperty('');
      setSelectedUnit('');
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setIncome('');
      setEmploymentStatus('');
      setPreviousAddress('');
      setCreditScore('');
      setMonthlyDebt('');
      setBankruptcyFiledYear('');
      setRentalHistoryComments('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
      <h1 className="text-2xl font-bold mb-4">Rental Application</h1>
      {success && <div className="bg-green-200 text-green-800 p-2 mb-4 rounded">Application submitted successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            id="unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
            disabled={!selectedProperty}
          >
            <option value="">Select a unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="income" className="block text-sm font-medium text-gray-700">Monthly Income</label>
          <input
            type="number"
            id="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="creditScore" className="block text-sm font-medium text-gray-700">Credit Score (optional)</label>
            <input
              type="number"
              id="creditScore"
              value={creditScore}
              onChange={(e) => setCreditScore(e.target.value)}
              min={300}
              max={850}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="monthlyDebt" className="block text-sm font-medium text-gray-700">Monthly Debt (optional)</label>
            <input
              type="number"
              id="monthlyDebt"
              value={monthlyDebt}
              onChange={(e) => setMonthlyDebt(e.target.value)}
              min={0}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bankruptcyFiledYear" className="block text-sm font-medium text-gray-700">Bankruptcy Year (optional)</label>
            <input
              type="number"
              id="bankruptcyFiledYear"
              value={bankruptcyFiledYear}
              onChange={(e) => setBankruptcyFiledYear(e.target.value)}
              min={1900}
              max={new Date().getFullYear()}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">Employment Status</label>
          <input
            type="text"
            id="employmentStatus"
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="previousAddress" className="block text-sm font-medium text-gray-700">Previous Address</label>
          <textarea
            id="previousAddress"
            value={previousAddress}
            onChange={(e) => setPreviousAddress(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="rentalHistoryComments" className="block text-sm font-medium text-gray-700">
            Rental History / References (optional)
          </label>
          <textarea
            id="rentalHistoryComments"
            value={rentalHistoryComments}
            onChange={(e) => setRentalHistoryComments(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Share prior landlord references or any additional context."
          />
        </div>

        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Application
        </button>
      </form>
    </div>
  );
};

export default RentalApplicationPage;
