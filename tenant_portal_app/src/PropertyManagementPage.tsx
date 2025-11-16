import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Textarea,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { Building2, Plus, MapPin, Home } from 'lucide-react';
import { useAuth } from './AuthContext';

interface PropertyAmenitySummary {
  amenity?: {
    key: string;
    label: string;
  };
  isFeatured?: boolean;
}

interface PropertyPhotoSummary {
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

interface MarketingProfileSummary {
  minRent?: number;
  maxRent?: number;
  availabilityStatus?: string;
  marketingHeadline?: string;
  marketingDescription?: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type?: string;
  yearBuilt?: number;
  amenities?: PropertyAmenitySummary[];
  photos?: PropertyPhotoSummary[];
  marketingProfile?: MarketingProfileSummary | null;
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

interface MarketingProfileResponse {
  property: { id: number; name: string; address: string };
  marketingProfile?: MarketingProfileSummary | null;
  photos: PropertyPhotoSummary[];
  amenities: { key: string; label: string; isFeatured?: boolean }[];
  unitCount: number;
}

interface SyndicationEntry {
  id: number;
  channel: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string | null;
  updatedAt?: string;
}

interface ChannelCredentialForm {
  apiKey?: string;
  endpoint?: string;
  username?: string;
  password?: string;
  ftpHost?: string;
  ftpUsername?: string;
  ftpPassword?: string;
}

interface MarketingFormState {
  minRent: string;
  maxRent: string;
  availabilityStatus: string;
  marketingHeadline: string;
  marketingDescription: string;
  photosInput: string;
  amenitiesInput: string;
}

const availabilityStatuses = ['AVAILABLE', 'LIMITED', 'WAITLISTED', 'COMING_SOON', 'UNAVAILABLE'];
const channelLabels: Record<string, string> = {
  ZILLOW: 'Zillow',
  APARTMENTS_DOT_COM: 'Apartments.com',
};

const createEmptyCredentialForms = (): Record<string, ChannelCredentialForm> => ({
  ZILLOW: { apiKey: '', endpoint: '' },
  APARTMENTS_DOT_COM: { ftpHost: '', ftpUsername: '', ftpPassword: '' },
});

const PropertyManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [marketingProfile, setMarketingProfile] = useState<MarketingProfileResponse | null>(null);
  const [marketingProfileLoading, setMarketingProfileLoading] = useState(false);
  const [marketingForm, setMarketingForm] = useState<MarketingFormState>({
    minRent: '',
    maxRent: '',
    availabilityStatus: 'AVAILABLE',
    marketingHeadline: '',
    marketingDescription: '',
    photosInput: '',
    amenitiesInput: '',
  });
  const [marketingSaving, setMarketingSaving] = useState(false);
  const [syndicationStatus, setSyndicationStatus] = useState<SyndicationEntry[]>([]);
  const [syndicationLoading, setSyndicationLoading] = useState(false);
  const [credentialForms, setCredentialForms] = useState<Record<string, ChannelCredentialForm>>(createEmptyCredentialForms());
  const [savingCredential, setSavingCredential] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pausing, setPausing] = useState(false);

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
    fetchChannelCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      setMarketingProfile(null);
      hydrateMarketingForm(null);
      setSyndicationStatus([]);
      return;
    }

    fetchUnits(selectedProperty.id);
    fetchMarketingProfileData(selectedProperty.id);
    fetchSyndicationStatus(selectedProperty.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty]);

  const fetchUnits = async (propertyId: number) => {
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}`, {
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

  const hydrateMarketingForm = (payload: MarketingProfileResponse | null) => {
    if (!payload) {
      setMarketingForm({
        minRent: '',
        maxRent: '',
        availabilityStatus: 'AVAILABLE',
        marketingHeadline: '',
        marketingDescription: '',
        photosInput: '',
        amenitiesInput: '',
      });
      return;
    }

    setMarketingForm({
      minRent: payload.marketingProfile?.minRent ? String(payload.marketingProfile.minRent) : '',
      maxRent: payload.marketingProfile?.maxRent ? String(payload.marketingProfile.maxRent) : '',
      availabilityStatus: payload.marketingProfile?.availabilityStatus || 'AVAILABLE',
      marketingHeadline: payload.marketingProfile?.marketingHeadline || '',
      marketingDescription: payload.marketingProfile?.marketingDescription || '',
      photosInput:
        payload.photos?.map((photo) => `${photo.url}${photo.caption ? ` | ${photo.caption}` : ''}`).join('\n') || '',
      amenitiesInput: payload.amenities?.map((amenity) => amenity.label).join(', ') || '',
    });
  };

  const fetchMarketingProfileData = async (propertyId: number) => {
    try {
      setMarketingProfileLoading(true);
      const response = await fetch(`${API_BASE}/properties/${propertyId}/marketing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMarketingProfile(data);
        hydrateMarketingForm(data);
      } else {
        setMarketingProfile(null);
        hydrateMarketingForm(null);
      }
    } catch (error) {
      console.error('Error fetching marketing profile:', error);
    } finally {
      setMarketingProfileLoading(false);
    }
  };

  const fetchSyndicationStatus = async (propertyId: number) => {
    try {
      setSyndicationLoading(true);
      const response = await fetch(`${API_BASE}/listings/syndication/${propertyId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSyndicationStatus(data);
      } else {
        setSyndicationStatus([]);
      }
    } catch (error) {
      console.error('Error fetching syndication status:', error);
    } finally {
      setSyndicationLoading(false);
    }
  };

  const fetchChannelCredentials = async () => {
    try {
      const response = await fetch(`${API_BASE}/listings/syndication/credentials/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const next = createEmptyCredentialForms();
        data.forEach((credential: { channel: string; config: ChannelCredentialForm }) => {
          next[credential.channel] = {
            ...(next[credential.channel] || {}),
            ...credential.config,
          };
        });
        setCredentialForms(next);
      }
    } catch (error) {
      console.error('Error fetching channel credentials:', error);
    }
  };

  const handleMarketingSave = async () => {
    if (!selectedProperty) return;
    setMarketingSaving(true);
    try {
      const photos = marketingForm.photosInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [url, caption] = line.split('|');
          return {
            url: url.trim(),
            caption: caption?.trim(),
            isPrimary: index === 0,
            displayOrder: index,
          };
        });

      const amenities = marketingForm.amenitiesInput
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((label) => ({
          key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          label,
          isFeatured: label.toLowerCase().includes('featured'),
        }));

      const payload: Record<string, unknown> = {
        minRent: marketingForm.minRent ? Number(marketingForm.minRent) : undefined,
        maxRent: marketingForm.maxRent ? Number(marketingForm.maxRent) : undefined,
        availabilityStatus: marketingForm.availabilityStatus,
        marketingHeadline: marketingForm.marketingHeadline,
        marketingDescription: marketingForm.marketingDescription,
      };

      if (photos.length) {
        payload.photos = photos;
      }
      if (amenities.length) {
        payload.amenities = amenities;
      }

      const response = await fetch(`${API_BASE}/properties/${selectedProperty.id}/marketing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setMarketingProfile(data);
        hydrateMarketingForm(data);
      }
    } catch (error) {
      console.error('Error saving marketing profile:', error);
    } finally {
      setMarketingSaving(false);
    }
  };

  const handleTriggerSyndication = async () => {
    if (!selectedProperty) return;
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/listings/syndication/${selectedProperty.id}/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      fetchSyndicationStatus(selectedProperty.id);
    } catch (error) {
      console.error('Error triggering syndication:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handlePauseSyndication = async () => {
    if (!selectedProperty) return;
    setPausing(true);
    try {
      await fetch(`${API_BASE}/listings/syndication/${selectedProperty.id}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      fetchSyndicationStatus(selectedProperty.id);
    } catch (error) {
      console.error('Error pausing syndication:', error);
    } finally {
      setPausing(false);
    }
  };

  const handleCredentialInputChange = (
    channel: string,
    field: keyof ChannelCredentialForm,
    value: string,
  ) => {
    setCredentialForms((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value,
      },
    }));
  };

  const handleCredentialSave = async (channel: string) => {
    setSavingCredential(channel);
    try {
      const form = credentialForms[channel];
      const sanitized = Object.entries(form || {})
        .filter(([, value]) => Boolean(value))
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }), {} as Record<string, string>);

      await fetch(`${API_BASE}/listings/syndication/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, ...sanitized }),
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
    } finally {
      setSavingCredential(null);
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
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
                            <span>
                              {property.address}
                              {property.city ? `, ${property.city}` : ''}
                              {property.state ? `, ${property.state}` : ''}
                              {property.zipCode ? ` ${property.zipCode}` : ''}
                            </span>
                          </div>
                          {property.type && (
                            <Chip size="sm" variant="flat" className="mt-2">{property.type}</Chip>
                          )}
                          {property.marketingProfile && (
                            <Chip size="sm" color="secondary" variant="flat" className="mt-2">
                              Rent {property.marketingProfile.minRent ? `$${property.marketingProfile.minRent}` : 'N/A'} - {property.marketingProfile.maxRent ? `$${property.marketingProfile.maxRent}` : 'N/A'}
                            </Chip>
                          )}
                          {property.amenities && property.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {property.amenities
                                .map((amenity, idx) => ({
                                  key: `${property.id}-${idx}`,
                                  label: amenity.amenity?.label || amenity.amenity?.key || 'Amenity',
                                }))
                                .filter((amenity) => amenity.label)
                                .map((amenity) => (
                                  <Chip key={amenity.key} size="sm" color="primary" variant="dot">
                                    {amenity.label}
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

      {selectedProperty && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Marketing Profile</h2>
              <p className="text-sm text-gray-500">Normalize rent ranges, amenities, photos, and availability before syndication.</p>
            </CardHeader>
            <CardBody>
              {marketingProfileLoading ? (
                <p className="text-gray-500">Loading marketing profile...</p>
              ) : (
                <div className="space-y-4">
                  {marketingProfile && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>{marketingProfile.photos?.length || 0} photos</span>
                      <span>{marketingProfile.amenities?.length || 0} amenities</span>
                      <span>{marketingProfile.unitCount} units</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Minimum Rent"
                      type="number"
                      value={marketingForm.minRent}
                      onChange={(e) => setMarketingForm((prev) => ({ ...prev, minRent: e.target.value }))}
                    />
                    <Input
                      label="Maximum Rent"
                      type="number"
                      value={marketingForm.maxRent}
                      onChange={(e) => setMarketingForm((prev) => ({ ...prev, maxRent: e.target.value }))}
                    />
                  </div>
                  <Select
                    label="Availability"
                    selectedKeys={new Set([marketingForm.availabilityStatus])}
                    onChange={(e) => setMarketingForm((prev) => ({ ...prev, availabilityStatus: e.target.value }))}
                  >
                    {availabilityStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Marketing Headline"
                    value={marketingForm.marketingHeadline}
                    onChange={(e) => setMarketingForm((prev) => ({ ...prev, marketingHeadline: e.target.value }))}
                  />
                  <Textarea
                    label="Description"
                    value={marketingForm.marketingDescription}
                    onChange={(e) => setMarketingForm((prev) => ({ ...prev, marketingDescription: e.target.value }))}
                  />
                  <Textarea
                    label="Photo URLs (one per line, optional caption with |)"
                    value={marketingForm.photosInput}
                    onChange={(e) => setMarketingForm((prev) => ({ ...prev, photosInput: e.target.value }))}
                  />
                  <Input
                    label="Amenities (comma separated)"
                    value={marketingForm.amenitiesInput}
                    onChange={(e) => setMarketingForm((prev) => ({ ...prev, amenitiesInput: e.target.value }))}
                  />
                  <div className="flex justify-end">
                    <Button color="primary" onClick={handleMarketingSave} isDisabled={marketingSaving}>
                      {marketingSaving ? 'Saving...' : 'Save Marketing Profile'}
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <div className="flex justify-between w-full items-center">
                <div>
                  <h2 className="text-xl font-semibold">Listing Syndication</h2>
                  <p className="text-sm text-gray-500">Monitor statuses and run feeds on demand.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex gap-2">
                <Button color="primary" size="sm" onClick={handleTriggerSyndication} isDisabled={syncing}>
                  {syncing ? 'Syncing...' : 'Manual Re-sync'}
                </Button>
                <Button variant="bordered" size="sm" onClick={handlePauseSyndication} isDisabled={pausing}>
                  {pausing ? 'Pausing...' : 'Pause Channels'}
                </Button>
              </div>
              {syndicationLoading ? (
                <p className="text-gray-500">Loading syndication status...</p>
              ) : syndicationStatus.length === 0 ? (
                <p className="text-gray-500 text-sm">No syndication activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {syndicationStatus.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            {channelLabels[entry.channel as keyof typeof channelLabels] || entry.channel}
                          </p>
                          <p className="text-xs text-gray-500">
                            Retries {entry.retryCount}/{entry.maxRetries}
                          </p>
                        </div>
                        <Chip size="sm" color={entry.status === 'SUCCESS' ? 'success' : entry.status === 'FAILED' ? 'danger' : entry.status === 'PAUSED' ? 'default' : 'warning'}>
                          {entry.status.replace(/_/g, ' ')}
                        </Chip>
                      </div>
                      {entry.lastError && (
                        <p className="text-xs text-danger mt-2">Last error: {entry.lastError}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Updated {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Channel Credentials</h2>
            <p className="text-sm text-gray-500">Store marketplace credentials so scheduled workers can push listings.</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(credentialForms).map(([channel, form]) => (
                <div key={channel} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">{channelLabels[channel] || channel}</h3>
                  {channel === 'ZILLOW' && (
                    <>
                      <Input
                        label="API Key"
                        value={form?.apiKey || ''}
                        onChange={(e) => handleCredentialInputChange(channel, 'apiKey', e.target.value)}
                      />
                      <Input
                        label="Endpoint (optional)"
                        value={form?.endpoint || ''}
                        onChange={(e) => handleCredentialInputChange(channel, 'endpoint', e.target.value)}
                      />
                    </>
                  )}
                  {channel === 'APARTMENTS_DOT_COM' && (
                    <>
                      <Input
                        label="FTP Host"
                        value={form?.ftpHost || ''}
                        onChange={(e) => handleCredentialInputChange(channel, 'ftpHost', e.target.value)}
                      />
                      <Input
                        label="FTP Username"
                        value={form?.ftpUsername || ''}
                        onChange={(e) => handleCredentialInputChange(channel, 'ftpUsername', e.target.value)}
                      />
                      <Input
                        label="FTP Password"
                        type="password"
                        value={form?.ftpPassword || ''}
                        onChange={(e) => handleCredentialInputChange(channel, 'ftpPassword', e.target.value)}
                      />
                    </>
                  )}
                  <Button
                    size="sm"
                    color="primary"
                    onClick={() => handleCredentialSave(channel)}
                    isDisabled={savingCredential === channel}
                  >
                    {savingCredential === channel ? 'Saving...' : 'Save Credentials'}
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
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
