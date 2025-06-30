import { useState } from 'react';
import { User, Settings, Bell, Shield, HelpCircle, Edit3, Save, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';

export function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const { inspections, properties } = useStorage();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(user || {
    id: '',
    name: '',
    email: '',
    role: 'property_manager' as const,
    company: '',
    phone: '',
    createdAt: '',
  });
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    autoSyncEnabled: true,
    offlineMode: false,
  });

  const saveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditedProfile(user || editedProfile);
    setIsEditing(false);
  };

  const roleOptions = [
    { value: 'property_manager', label: 'Property Manager' },
    { value: 'landlord', label: 'Landlord' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'maintenance', label: 'Maintenance Staff' },
  ];

  // Calculate stats
  const completedInspections = inspections.filter(i => i.status === 'completed' || i.status === 'signed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <Camera className="text-white" size={12} />
                </button>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-blue-600 font-medium">
                {roleOptions.find(r => r.value === user?.role)?.label}
              </p>
              <p className="text-gray-600">{user?.company}</p>
            </div>
            <button
              onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : isEditing ? (
                <>
                  <Save size={16} />
                  Save
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{inspections.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Inspections</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">{completedInspections}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{completedInspections}</div>
            <div className="text-sm text-gray-600 mt-1">Reports</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-orange-600">{properties.length}</div>
            <div className="text-sm text-gray-600 mt-1">Properties</div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                />
              ) : (
                <p className="py-2 text-gray-900">{user?.name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  className="form-input"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                />
              ) : (
                <p className="py-2 text-gray-900">{user?.email}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              {isEditing ? (
                <select
                  className="form-input"
                  value={editedProfile.role}
                  onChange={(e) => setEditedProfile({ ...editedProfile, role: e.target.value as any })}
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="py-2 text-gray-900">
                  {roleOptions.find(r => r.value === user?.role)?.label}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="form-input"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                />
              ) : (
                <p className="py-2 text-gray-900">{user?.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={editedProfile.company}
                  onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                />
              ) : (
                <p className="py-2 text-gray-900">{user?.company || 'Not provided'}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button onClick={cancelEdit} className="flex-1 btn btn-secondary">
                  Cancel
                </button>
                <button onClick={saveProfile} className="flex-1 btn btn-primary">
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* App Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">App Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="text-gray-400" size={20} />
                <span className="text-gray-900">Push Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Settings className="text-gray-400" size={20} />
                <span className="text-gray-900">Auto Sync</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSyncEnabled}
                  onChange={(e) => setSettings({ ...settings, autoSyncEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Shield className="text-gray-400" size={20} />
                <span className="text-gray-900">Offline Mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.offlineMode}
                  onChange={(e) => setSettings({ ...settings, offlineMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => alert('Syncing data with cloud storage...')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition"
            >
              <Settings className="text-blue-600" size={20} />
              <div>
                <div className="font-medium text-gray-900">Sync Data</div>
                <div className="text-sm text-gray-600">Last synced: Just now</div>
              </div>
            </button>

            <button
              onClick={() => alert('Export all inspections and reports')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition"
            >
              <div>
                <div className="font-medium text-gray-900">Export Data</div>
                <div className="text-sm text-gray-600">Download all your data</div>
              </div>
            </button>

            <button
              onClick={() => alert('Opening help documentation...')}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition"
            >
              <HelpCircle className="text-green-600" size={20} />
              <div>
                <div className="font-medium text-gray-900">Help & Support</div>
                <div className="text-sm text-gray-600">Get help using the app</div>
              </div>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Account ID:</strong> {user?.id}</p>
            <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
            <p><strong>Last login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}