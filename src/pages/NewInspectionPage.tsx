import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Home, Building2, MapPin } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { Property, Inspection, Room, UserInfo } from '../types';
import { generateRoomTemplate, generateInspectionStructure, ROOM_TYPE_OPTIONS, ROOM_TEMPLATES } from '../utils/inspectionTemplates';
import { generatePropertyId } from '../utils/idGenerator';

export function NewInspectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { properties, saveProperty, saveInspection } = useStorage();
  const preselectedType = searchParams.get('type') || '';

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(preselectedType);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newPropertyForm, setNewPropertyForm] = useState({
    address: '',
    propertyType: 'apartment' as 'apartment' | 'house' | 'condo' | 'commercial',
    units: 1,
    isMultiUnit: false,
    owner: '',
    managedBy: '',
  });
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);

  const inspectionTypes = [
    {
      id: 'move-in',
      title: 'Move-in Inspection',
      subtitle: 'Document initial property condition',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'move-out',
      title: 'Move-out Inspection',
      subtitle: 'Compare condition and assess damage',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'routine',
      title: 'Routine Inspection',
      subtitle: 'Regular maintenance check',
      color: 'bg-green-50 text-green-600',
    },
  ];

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: Building2 },
    { id: 'house', label: 'House', icon: Home },
    { id: 'condo', label: 'Condo', icon: Building2 },
    { id: 'commercial', label: 'Commercial', icon: Building2 },
  ];

  useEffect(() => {
    if (preselectedType) {
      setSelectedType(preselectedType);
      setStep(2);
    }
  }, [preselectedType]);

  useEffect(() => {
    if (step === 3) {
      initializeRoomsFromTemplate();
    }
  }, [step]);

  const initializeRoomsFromTemplate = () => {
    const templateRooms = generateInspectionStructure(false);
    setRooms(templateRooms);
  };

  const handleCreateProperty = async () => {
    if (!newPropertyForm.address || !newPropertyForm.owner || !newPropertyForm.managedBy) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const newProperty: Property = {
        id: generatePropertyId(),
        address: newPropertyForm.address,
        propertyType: newPropertyForm.propertyType,
        units: newPropertyForm.units,
        isMultiUnit: newPropertyForm.isMultiUnit,
        owner: newPropertyForm.owner,
        managedBy: newPropertyForm.managedBy,
      };

      await saveProperty(newProperty);
      setSelectedProperty(newProperty);
      setShowNewPropertyForm(false);
      setStep(3);
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please try again.');
    }
  };

  const addRoom = () => {
    const newRoom = generateRoomTemplate('living', `Room ${rooms.length + 1}`);
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const updateRoomName = (roomId: string, name: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, name } : room
    ));
  };

  const updateRoomType = (roomId: string, type: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const newRoom = generateRoomTemplate(type, room.name);
        return { ...newRoom, id: roomId, name: room.name };
      }
      return room;
    }));
  };

  const addRoomFromTemplate = (templateType: string, customName?: string) => {
    const roomOption = ROOM_TYPE_OPTIONS.find(option => option.value === templateType);
    const roomName = customName || roomOption?.label || 'New Room';
    const newRoom = generateRoomTemplate(templateType, roomName);
    setRooms([...rooms, newRoom]);
  };

  const createInspection = async () => {
    if (!selectedProperty || rooms.length === 0) {
      alert('Please select a property and add at least one room.');
      return;
    }

    try {
      const inspector: UserInfo = {
        id: 'user_1',
        name: 'John Inspector',
        email: 'john@inspector.com',
        role: 'property_manager',
      };

      const newInspection: Inspection = {
        id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        propertyId: selectedProperty.id,
        type: selectedType as any,
        status: 'in-progress',
        createdAt: new Date().toISOString(),
        inspector,
        rooms,
        generalNotes: '',
        signatures: [],
        reportGenerated: false,
        syncStatus: 'offline',
      };

      await saveInspection(newInspection);
      navigate(`/inspections/${newInspection.id}`);
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Failed to create inspection. Please try again.');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Inspection Type</h2>
        <p className="text-gray-600">Choose the type of inspection you want to perform</p>
      </div>

      <div className="space-y-4">
        {inspectionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`w-full p-4 rounded-xl border-2 transition text-left ${
              selectedType === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${type.color}`}>
                <div className="w-3 h-3 rounded-full bg-current" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => selectedType && setStep(2)}
        disabled={!selectedType}
        className={`w-full btn ${selectedType ? 'btn-primary' : 'btn-secondary'}`}
      >
        Continue
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Property</h2>
        <p className="text-gray-600">Choose the property to inspect or add a new one</p>
      </div>

      {!showNewPropertyForm && (
        <>
          <button
            onClick={() => setShowNewPropertyForm(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Plus size={20} />
              <span className="font-medium">Add New Property</span>
            </div>
          </button>

          <div className="space-y-3">
            {properties.map((property) => (
              <button
                key={property.id}
                onClick={() => setSelectedProperty(property)}
                className={`w-full p-4 rounded-xl border-2 transition text-left ${
                  selectedProperty?.id === property.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.address}</h3>
                    <p className="text-sm text-gray-600">
                      {property.propertyType} • Owner: {property.owner}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedProperty && setStep(3)}
            disabled={!selectedProperty}
            className={`w-full btn ${selectedProperty ? 'btn-primary' : 'btn-secondary'}`}
          >
            Continue
          </button>
        </>
      )}

      {showNewPropertyForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Property</h3>

          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Property Address *</label>
              <input
                type="text"
                className="form-input"
                value={newPropertyForm.address}
                onChange={(e) => setNewPropertyForm({ ...newPropertyForm, address: e.target.value })}
                placeholder="Enter property address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Property Type</label>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewPropertyForm({ ...newPropertyForm, propertyType: type.id as any })}
                    className={`p-3 rounded-lg border flex items-center gap-2 transition ${
                      newPropertyForm.propertyType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <type.icon size={16} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Property Configuration</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newPropertyForm.isMultiUnit}
                    onChange={(e) => setNewPropertyForm({ 
                      ...newPropertyForm, 
                      isMultiUnit: e.target.checked,
                      units: e.target.checked ? newPropertyForm.units : 1
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Multi-unit property</span>
                </label>
                
                {newPropertyForm.isMultiUnit && (
                  <div>
                    <label className="form-label">Number of Units</label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      className="form-input"
                      value={newPropertyForm.units}
                      onChange={(e) => setNewPropertyForm({ 
                        ...newPropertyForm, 
                        units: parseInt(e.target.value) || 2 
                      })}
                      placeholder="Enter number of units"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Building details, special notes"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Property Owner *</label>
              <input
                type="text"
                className="form-input"
                value={newPropertyForm.owner}
                onChange={(e) => setNewPropertyForm({ ...newPropertyForm, owner: e.target.value })}
                placeholder="Enter owner name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Managed By *</label>
              <input
                type="text"
                className="form-input"
                value={newPropertyForm.managedBy}
                onChange={(e) => setNewPropertyForm({ ...newPropertyForm, managedBy: e.target.value })}
                placeholder="Enter management company"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewPropertyForm(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProperty}
                className="flex-1 btn btn-primary"
              >
                Create Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Rooms</h2>
        <p className="text-gray-600">Add and customize rooms for this inspection</p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                value={room.name}
                onChange={(e) => updateRoomName(room.id, e.target.value)}
                className="flex-1 form-input"
                placeholder="Room name"
              />
              <select
                value={room.type}
                onChange={(e) => updateRoomType(room.id, e.target.value)}
                className="form-input w-48"
              >
                {ROOM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeRoom(room.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {room.checklistItems.length} inspection points included
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Templates */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Quick Add Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          {ROOM_TYPE_OPTIONS.filter(option => ['bedroom', 'bathroom', 'kitchen', 'living_room'].includes(option.value)).map((option) => (
            <button
              key={option.value}
              onClick={() => addRoomFromTemplate(option.value)}
              className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500">
                {ROOM_TEMPLATES[option.value]?.length || 0} inspection points
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={addRoom}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Plus size={20} />
            <span className="font-medium">Add Custom Room</span>
          </div>
        </button>
      </div>

      {/* Sections Overview */}
      <div className="card bg-blue-50">
        <h3 className="font-medium text-blue-900 mb-2">Inspection Structure</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Exterior Section: Building, landscaping, parking areas</div>
          <div>• Interior Section: All indoor rooms and spaces</div>
          {selectedProperty?.isMultiUnit && (
            <div>• Common Areas: Shared spaces (first unit only)</div>
          )}
        </div>
      </div>

      <button
        onClick={createInspection}
        disabled={rooms.length === 0}
        className={`w-full btn ${rooms.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
      >
        Create Inspection
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">New Inspection</h1>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex-1 h-2 rounded-full ${
                  step >= stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="container py-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}