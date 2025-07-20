import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Camera, Users } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { Inspection, ChecklistItem } from '../types';

export function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInspection, saveInspection } = useStorage();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const data = getInspection(id);
      if (data) {
        setInspection(data);
      } else {
        alert('Inspection not found.');
        navigate('/inspections');
      }
    }
    setLoading(false);
  }, [id, getInspection, navigate]);

  const updateChecklistItem = (roomIndex: number, itemIndex: number, updates: Partial<ChecklistItem>) => {
    if (!inspection) return;

    const updatedInspection = { ...inspection };
    updatedInspection.rooms[roomIndex].checklistItems[itemIndex] = {
      ...updatedInspection.rooms[roomIndex].checklistItems[itemIndex],
      ...updates,
    };

    setInspection(updatedInspection);
    saveInspection(updatedInspection);
  };

  const updateGeneralNotes = (notes: string) => {
    if (!inspection) return;
    const updatedInspection = { ...inspection, generalNotes: notes };
    setInspection(updatedInspection);
    saveInspection(updatedInspection);
  };

  const completeInspection = async () => {
    if (!inspection) return;

    const incompleteItems = inspection.rooms.some(room =>
      room.checklistItems.some(item => item.condition === null)
    );

    if (incompleteItems) {
      if (!window.confirm('Some items have not been rated. Are you sure you want to complete this inspection?')) {
        return;
      }
    }

    const updatedInspection = {
      ...inspection,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    };
    
    setInspection(updatedInspection);
    await saveInspection(updatedInspection);
    alert('Inspection completed successfully!');
  };

  const navigateToNextItem = () => {
    if (!inspection) return;

    const currentRoom = inspection.rooms[activeRoomIndex];
    if (activeItemIndex < currentRoom.checklistItems.length - 1) {
      setActiveItemIndex(activeItemIndex + 1);
    } else if (activeRoomIndex < inspection.rooms.length - 1) {
      setActiveRoomIndex(activeRoomIndex + 1);
      setActiveItemIndex(0);
    }
  };

  const navigateToPreviousItem = () => {
    if (activeItemIndex > 0) {
      setActiveItemIndex(activeItemIndex - 1);
    } else if (activeRoomIndex > 0) {
      setActiveRoomIndex(activeRoomIndex - 1);
      const previousRoom = inspection?.rooms[activeRoomIndex - 1];
      if (previousRoom) {
        setActiveItemIndex(previousRoom.checklistItems.length - 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading inspection...</div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Inspection not found</div>
        </div>
      </div>
    );
  }

  const currentRoom = inspection.rooms[activeRoomIndex];
  const currentItem = currentRoom?.checklistItems[activeItemIndex];
  const progress = inspection.rooms.reduce((total, room) => {
    return total + room.checklistItems.filter(item => item.condition !== null).length;
  }, 0);
  const totalItems = inspection.rooms.reduce((total, room) => total + room.checklistItems.length, 0);

  const CONDITIONS = [
    { key: 'excellent', label: 'Excellent', color: 'bg-green-600' },
    { key: 'good', label: 'Good', color: 'bg-blue-600' },
    { key: 'fair', label: 'Fair', color: 'bg-orange-600' },
    { key: 'poor', label: 'Poor', color: 'bg-red-600' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {inspection.type.replace('-', ' ')} Inspection
                </h1>
                {inspection.unitNumber && (
                  <p className="text-sm text-blue-600 font-medium">
                    Unit {inspection.unitNumber.toString().padStart(2, '0')}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {progress}/{totalItems} items completed
                </p>
              </div>
            </div>
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
              <Save size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress / totalItems) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {Math.round((progress / totalItems) * 100)}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* Room Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex gap-2 overflow-x-auto">
            {inspection.rooms.map((room, index) => (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoomIndex(index);
                  setActiveItemIndex(0);
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  activeRoomIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="text-sm font-medium">{room.name}</div>
                <div className="text-xs">
                  {room.checklistItems.filter(item => item.condition !== null).length}/{room.checklistItems.length}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Item */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-6">
          {currentItem && (
            <div className="card mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-blue-600 font-medium">{currentItem.category}</div>
                <div className="text-sm text-gray-500">
                  {activeItemIndex + 1} of {currentRoom.checklistItems.length}
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentItem.item}</h2>

              {/* Condition Rating */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Condition Rating</h3>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((condition) => (
                    <button
                      key={condition.key}
                      onClick={() =>
                        updateChecklistItem(activeRoomIndex, activeItemIndex, { condition: condition.key })
                      }
                      className={`p-3 rounded-lg border-2 transition ${
                        currentItem.condition === condition.key
                          ? `${condition.color} text-white border-transparent`
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Photos ({currentItem.photos.length}/5)</h3>
                  <button className="btn btn-secondary">
                    <Camera size={16} />
                    Add Photo
                  </button>
                </div>
                {currentItem.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {currentItem.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input form-textarea"
                  value={currentItem.notes}
                  onChange={(e) =>
                    updateChecklistItem(activeRoomIndex, activeItemIndex, { notes: e.target.value })
                  }
                  placeholder="Add any specific observations or issues..."
                  rows={4}
                />
              </div>

              {/* Damage Assessment */}
              {(currentItem.condition === 'poor' || currentItem.condition === 'fair') && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Damage Assessment</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={currentItem.requiresAction}
                        onChange={(e) =>
                          updateChecklistItem(activeRoomIndex, activeItemIndex, {
                            requiresAction: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Requires Action</span>
                    </label>

                    <div className="form-group">
                      <label className="form-label">Estimated Cost ($)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={currentItem.damageEstimate || ''}
                        onChange={(e) => {
                          const estimate = parseFloat(e.target.value) || 0;
                          updateChecklistItem(activeRoomIndex, activeItemIndex, {
                            damageEstimate: estimate,
                          });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General Notes */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-3">General Inspection Notes</h3>
            <textarea
              className="form-input form-textarea"
              value={inspection.generalNotes}
              onChange={(e) => updateGeneralNotes(e.target.value)}
              placeholder="Add any general observations about the property..."
              rows={6}
            />
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="bg-white border-t border-gray-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={navigateToPreviousItem}
              disabled={activeRoomIndex === 0 && activeItemIndex === 0}
              className={`btn ${
                activeRoomIndex === 0 && activeItemIndex === 0 ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-3">
              {inspection.status === 'in-progress' && (
                <button onClick={completeInspection} className="btn btn-success">
                  <CheckCircle size={16} />
                  Complete
                </button>
              )}

              {inspection.status === 'completed' && (
                <button className="btn btn-primary">
                  <Users size={16} />
                  Sign
                </button>
              )}
            </div>

            <button
              onClick={navigateToNextItem}
              disabled={
                activeRoomIndex === inspection.rooms.length - 1 &&
                activeItemIndex === currentRoom.checklistItems.length - 1
              }
              className={`btn ${
                activeRoomIndex === inspection.rooms.length - 1 &&
                activeItemIndex === currentRoom.checklistItems.length - 1
                  ? 'btn-secondary'
                  : 'btn-primary'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}