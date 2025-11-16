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
import { Building2, Plus, MapPin, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import { MasterDetailLayout } from './components/ui/MasterDetailLayout';
import { useMasterDetail } from './hooks/useMasterDetail';
import { useViewportCategory } from './hooks/useViewportCategory';

interface Property {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  unitCount?: number;
  status?: string;
}

interface Unit {
  id: number;
  name: string;
  propertyId: number;
  status?: string;
  rent?: number;
}

interface MarketingProfileResponse {
  availabilityStatus: string;
  marketingHeadline: string;
  marketingDescription: string;
  minRent?: number;
  maxRent?: number;
  photos?: string[];
  amenities?: string[];
}

interface MarketingFormState {
  minRent: string;
  maxRent: string;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE';
  marketingHeadline: string;
  marketingDescription: string;
  photosInput: string;
  amenitiesInput: string;
}

interface SyndicationEntry {
  channel: string;
  status: string;
  lastSyncedAt?: string;
}

interface ChannelCredentialForm {
  username: string;
  apiKey: string;
  isEnabled: boolean;
}

const createEmptyCredentialForms = (): Record<string, ChannelCredentialForm> => ({
  zillow: { username: '', apiKey: '', isEnabled: false },
  apartments: { username: '', apiKey: '', isEnabled: false },
});

const PropertyManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
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

  const { selectedItem: selectedProperty, showDetail, selectItem: selectProperty, clearSelection } = useMasterDetail<Property>();
  const viewport = useViewportCategory();

  // ... (form state and API_BASE remain the same)

  useEffect(() => {
    // ... (fetch functions remain the same)
  }, []);

  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      setMarketingProfile(null);
      return;
    }
    // ... (fetch units, marketing profile, etc.)
  }, [selectedProperty]);

  const handleBackClick = () => {
    clearSelection();
  };

  // ... (other handler functions remain the same)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading properties...</p>
      </div>
    );
  }

  const master = (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">Select a property to manage</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onClick={() => setIsPropertyModalOpen(true)}
        >
          Add Property
        </Button>
      </div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Properties ({properties.length})</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {properties.map(property => (
            <Card
              key={property.id}
              isPressable
              onClick={() => selectProperty(property)}
              className={`${selectedProperty?.id === property.id ? 'border-2 border-primary' : ''}`}
            >
              {/* ... (property card content) */}
            </Card>
          ))}
        </CardBody>
      </Card>
    </div>
  );

  const detail = (
    <div className="p-4 sm:p-6">
      {selectedProperty ? (
        <>
         {(viewport === 'mobile' || viewport === 'tablet-portrait') && (
            <Button
              isIconOnly
              variant="light"
              onClick={handleBackClick}
              className="mb-4"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ... (detail pane content) */}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a property to see the details</p>
        </div>
      )}
    </div>
  );

  return (
    <MasterDetailLayout
      master={master}
      detail={detail}
      showDetail={showDetail}
    />
  );
};

export default PropertyManagementPage;
