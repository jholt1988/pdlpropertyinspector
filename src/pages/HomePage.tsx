import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { CanCreate } from '../components/PermissionGuard';

export function HomePage() {
  const { inspections } = useStorage();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    needsAction: 0,
  });

  useEffect(() => {
    const completed = inspections.filter(i => i.status === 'completed' || i.status === 'signed').length;
    const pending = inspections.filter(i => i.status === 'in-progress').length;
    const needsAction = inspections.filter(i => 
      i.rooms.some(room => 
        room.checklistItems.some(item => item.requiresAction)
      )
    ).length;

    setStats({
      total: inspections.length,
      completed,
      pending,
      needsAction,
    });
  }, [inspections]);

  const recentInspections = inspections
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Good morning!</h1>
              <p className="text-gray-600 mt-1">Ready to inspect properties?</p>
            </div>
            <CanCreate resource="inspection">
              <Link
                to="/inspections/new"
                className="btn btn-primary bg-keycheck-primary hover:bg-keycheck-primary"
              >
                <Plus size={20} />
                New
              </Link>
            </CanCreate>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Inspections</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">{stats.needsAction}</div>
            <div className="text-sm text-gray-600 mt-1">Need Action</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <CanCreate resource="inspection">
              <Link
                to="/inspections/new?type=move-in"
                className="card hover:bg-keycheck-light transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-keycheck-light rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-keycheck-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Move-in Inspection</h3>
                    <p className="text-sm text-gray-600">Document initial condition</p>
                  </div>
                </div>
              </Link>
            </CanCreate>

            <CanCreate resource="inspection">
              <Link
                to="/inspections/new?type=move-out"
                className="card hover:bg-orange-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Move-out Inspection</h3>
                    <p className="text-sm text-gray-600">Compare & assess damage</p>
                  </div>
                </div>
              </Link>
            </CanCreate>

            <CanCreate resource="inspection">
              <Link
                to="/inspections/new?type=routine"
                className="card hover:bg-success-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
                    <Clock className="text-success" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Routine Check</h3>
                    <p className="text-sm text-gray-600">Regular maintenance</p>
                  </div>
                </div>
              </Link>
            </CanCreate>

            <Link
              to="/reports"
              className="card hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="text-gray-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Reports</h3>
                  <p className="text-sm text-gray-600">Past inspections</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Inspections */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Inspections</h2>
            <Link to="/inspections" className="text-keycheck-primary hover:text-keycheck-secondary text-sm font-medium">
              See All
            </Link>
          </div>

          {recentInspections.length > 0 ? (
            <div className="space-y-4">
              {recentInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  to={`/inspections/${inspection.id}`}
                  className="card hover:bg-gray-50 transition block"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getInspectionTypeLabel(inspection.type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Property ID: {inspection.propertyId}
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
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspections yet</h3>
              <p className="text-gray-600 mb-6">Create your first inspection to get started</p>
              <CanCreate resource="inspection">
                <Link to="/inspections/new" className="btn btn-primary">
                  <Plus size={20} />
                  Create New Inspection
                </Link>
              </CanCreate>
            </div>
          )}
          {/*Repair Projects and Estimates*/}
          <div className='card text-center py-12'>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No repair projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first repair project to get started</p>
            
                <Link to="/projects" className="btn btn-primary">
                  <Plus size={20} />
                  Create New Repair Project 
                </Link>
            </div>
          </div>
        </div>
      </div>
    
  );
}