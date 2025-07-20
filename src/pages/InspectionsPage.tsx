import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';

export function InspectionsPage() {
  const { inspections, deleteInspection } = useStorage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'move-in' | 'move-out' | 'routine'>('all');

  const filteredInspections = activeFilter === 'all' 
    ? inspections 
    : inspections.filter(inspection => inspection.type === activeFilter);

  const sortedInspections = filteredInspections.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDeleteInspection = async (inspectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      try {
        await deleteInspection(inspectionId);
      } catch (error) {
        console.error('Error deleting inspection:', error);
        alert('Failed to delete inspection. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'signed':
        return 'text-green-600 bg-green-50';
      case 'in-progress':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getInspectionTypeLabel = (type: string) => {
    switch (type) {
      case 'move-in':
        return 'Move-in';
      case 'move-out':
        return 'Move-out';
      case 'routine':
        return 'Routine';
      default:
        return type;
    }
  };

  const filters = [
    { key: 'all', label: 'All', count: inspections.length },
    { key: 'move-in', label: 'Move-in', count: inspections.filter(i => i.type === 'move-in').length },
    { key: 'move-out', label: 'Move-out', count: inspections.filter(i => i.type === 'move-out').length },
    { key: 'routine', label: 'Routine', count: inspections.filter(i => i.type === 'routine').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
              <p className="text-gray-600 mt-1">{filteredInspections.length} inspections</p>
            </div>
            <Link to="/inspections/new" className="btn btn-primary">
              <Plus size={20} />
              New
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Inspections List */}
        {sortedInspections.length > 0 ? (
          <div className="space-y-4">
            {sortedInspections.map((inspection) => (
              <div key={inspection.id} className="card">
                <Link
                  to={`/inspections/${inspection.id}`}
                  className="flex justify-between items-center hover:bg-gray-50 -m-6 p-6 rounded-xl transition"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getInspectionTypeLabel(inspection.type)}
                        </h3>
                        {inspection.unitNumber && (
                          <p className="text-sm text-blue-600 font-medium">
                            Unit {inspection.unitNumber.toString().padStart(2, '0')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Property ID: {inspection.propertyId}
                        </p>
                        <p className="text-sm text-gray-600">
                          Inspector: {inspection.inspector.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('-', ' ')}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {inspection.rooms.length} rooms
                      </span>
                      {inspection.status === 'completed' || inspection.status === 'signed' ? (
                        <span className="text-green-600">
                          Completed {inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : ''}
                        </span>
                      ) : (
                        <span className="text-orange-600">In progress</span>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={(e) => handleDeleteInspection(inspection.id, e)}
                  className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete inspection"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspections found</h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'all' 
                ? 'Create your first inspection to get started' 
                : `No ${activeFilter.replace('-', ' ')} inspections yet`}
            </p>
            <Link to="/inspections/new" className="btn btn-primary">
              <Plus size={20} />
              Create New Inspection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}