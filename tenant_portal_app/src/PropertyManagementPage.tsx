import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from '@nextui-org/react';
import { Building2, Plus, MapPin, Home } from 'lucide-react';
import { useAuth } from './AuthContext';

interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type?: string;
  yearBuilt?: number;
  amenities?: string[];
  unitCount?: number;
}

interface Unit {
  id: number;
  name: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  floor?: number;
  features?: string[];
}

const PropertyManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: '',
    yearBuilt: '',
    amenities: [] as string[],
  });

  // Unit form state
  const [unitForm, setUnitForm] = useState({
    name: '',
    unitNumber: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    floor: '',
    features: [] as string[],
  });

  const API_BASE = 'http://localhost:3000/api';

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnits = async (propertyId: number) => {
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    fetchUnits(property.id);
  };

  const handleCreateProperty = async () => {
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyForm,
          yearBuilt: propertyForm.yearBuilt ? parseInt(propertyForm.yearBuilt) : undefined,
        }),
      });

      if (response.ok) {
        setIsPropertyModalOpen(false);
        setPropertyForm({
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          type: '',
          yearBuilt: '',
          amenities: [],
        });
        fetchProperties();
      }
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const handleCreateUnit = async () => {
    if (!selectedProperty) return;

    try {
      const response = await fetch(`${API_BASE}/properties/${selectedProperty.id}/units`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...unitForm,
          bedrooms: parseInt(unitForm.bedrooms),
          bathrooms: parseFloat(unitForm.bathrooms),
          squareFeet: parseInt(unitForm.squareFeet),
          floor: unitForm.floor ? parseInt(unitForm.floor) : undefined,
        }),
      });

      if (response.ok) {
        setIsUnitModalOpen(false);
        setUnitForm({
          name: '',
          unitNumber: '',
          bedrooms: '',
          bathrooms: '',
          squareFeet: '',
          floor: '',
          features: [],
        });
        fetchUnits(selectedProperty.id);
      }
    } catch (error) {
      console.error('Error creating unit:', error);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setPropertyForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const toggleFeature = (feature: string) => {
    setUnitForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-500 mt-1">Manage properties and units</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onClick={() => setIsPropertyModalOpen(true)}
        >
          Add Property
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties List */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Properties ({properties.length})</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {properties.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No properties found. Create one to get started.</p>
              ) : (
                properties.map(property => (
                  <Card
                    key={property.id}
                    isPressable
                    onClick={() => handlePropertyClick(property)}
                    className={`${selectedProperty?.id === property.id ? 'border-2 border-primary' : ''}`}
                  >
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{property.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <MapPin size={14} />
                            <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                          </div>
                          {property.type && (
                            <Chip size="sm" variant="flat" className="mt-2">{property.type}</Chip>
                          )}
                          {property.amenities && property.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {property.amenities.map((amenity, idx) => (
                                <Chip key={idx} size="sm" color="primary" variant="dot">
                                  {amenity}
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Units List */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedProperty ? `Units - ${selectedProperty.name}` : 'Select a Property'}
              </h2>
              {selectedProperty && (
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Plus size={16} />}
                  onClick={() => setIsUnitModalOpen(true)}
                >
                  Add Unit
                </Button>
              )}
            </CardHeader>
            <CardBody className="space-y-3">
              {!selectedProperty ? (
                <p className="text-gray-500 text-center py-8">Select a property to view units</p>
              ) : units.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No units found. Add units to this property.</p>
              ) : (
                units.map(unit => (
                  <Card key={unit.id}>
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Home size={24} className="text-success" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{unit.name}</h3>
                          <p className="text-sm text-gray-600">Unit #{unit.unitNumber}</p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-2">
                            <span>🛏️ {unit.bedrooms} bed</span>
                            <span>🚿 {unit.bathrooms} bath</span>
                            <span>📐 {unit.squareFeet} sq ft</span>
                          </div>
                          {unit.features && unit.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {unit.features.map((feature, idx) => (
                                <Chip key={idx} size="sm" color="success" variant="dot">
                                  {feature}
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Create Property Modal */}
      <Modal isOpen={isPropertyModalOpen} onClose={() => setIsPropertyModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Property</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Property Name"
                placeholder="e.g., Sunset Apartments"
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
              />
              <Input
                label="Address"
                placeholder="123 Main St"
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                />
                <Input
                  label="State"
                  placeholder="CA"
                  value={propertyForm.state}
                  onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
                />
                <Input
                  label="Zip Code"
                  placeholder="90210"
                  value={propertyForm.zipCode}
                  onChange={(e) => setPropertyForm({ ...propertyForm, zipCode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Type"
                  placeholder="e.g., Apartment, Condo"
                  value={propertyForm.type}
                  onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                />
                <Input
                  label="Year Built"
                  type="number"
                  placeholder="2020"
                  value={propertyForm.yearBuilt}
                  onChange={(e) => setPropertyForm({ ...propertyForm, yearBuilt: e.target.value })}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {['Pool', 'Gym', 'Parking', 'Elevator', 'Laundry'].map(amenity => (
                    <Chip
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      color={propertyForm.amenities.includes(amenity) ? 'primary' : 'default'}
                      variant={propertyForm.amenities.includes(amenity) ? 'solid' : 'bordered'}
                      className="cursor-pointer"
                    >
                      {amenity}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setIsPropertyModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleCreateProperty}>
              Create Property
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Unit Modal */}
      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>Add New Unit</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Unit Name"
                  placeholder="e.g., Unit A"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                />
                <Input
                  label="Unit Number"
                  placeholder="101"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Bedrooms"
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
                />
                <Input
                  label="Bathrooms"
                  type="number"
                  step="0.5"
                  value={unitForm.bathrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })}
                />
                <Input
                  label="Square Feet"
                  type="number"
                  value={unitForm.squareFeet}
                  onChange={(e) => setUnitForm({ ...unitForm, squareFeet: e.target.value })}
                />
              </div>
              <Input
                label="Floor"
                type="number"
                placeholder="1"
                value={unitForm.floor}
                onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
              />
              <div>
                <p className="text-sm font-medium mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {['AC', 'Balcony', 'Laundry', 'Parking', 'Furnished', 'Pets Allowed'].map(feature => (
                    <Chip
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      color={unitForm.features.includes(feature) ? 'success' : 'default'}
                      variant={unitForm.features.includes(feature) ? 'solid' : 'bordered'}
                      className="cursor-pointer"
                    >
                      {feature}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setIsUnitModalOpen(false)}>
              Cancel
            </Button>
            <Button color="success" onClick={handleCreateUnit}>
              Add Unit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PropertyManagementPage;
