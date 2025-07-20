import { useAuth } from '../contexts/AuthContext';

export interface Permission {
  action: string;
  resource: string;
  resourceId?: string;
}

// Define permissions for each role
const ROLE_PERMISSIONS = {
  property_manager: [
    'create:property',
    'read:property',
    'update:property',
    'delete:property',
    'create:inspection',
    'read:inspection',
    'update:inspection',
    'delete:inspection',
    'create:report',
    'read:report',
    'manage:users',
  ],
  landlord: [
    'create:property',
    'read:property:own',
    'update:property:own',
    'create:inspection:own',
    'read:inspection:own',
    'update:inspection:own',
    'read:report:own',
  ],
  tenant: [
    'read:inspection:own',
    'update:inspection:own',
    'read:report:own',
  ],
  maintenance: [
    'read:inspection',
    'update:inspection',
    'create:report',
    'read:report',
  ],
};

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (action: string, resource: string, resourceId?: string): boolean => {
    if (!user) return false;

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Check for exact permission
    const exactPermission = `${action}:${resource}`;
    if (userPermissions.includes(exactPermission)) {
      return true;
    }

    // Check for resource-specific permission (e.g., "read:property:own")
    const resourcePermission = `${action}:${resource}:own`;
    if (userPermissions.includes(resourcePermission)) {
      // Additional logic needed to verify ownership
      return checkOwnership(resource, resourceId, user.id);
    }

    return false;
  };

  const canCreate = (resource: string) => hasPermission('create', resource);
  const canRead = (resource: string, resourceId?: string) => hasPermission('read', resource, resourceId);
  const canUpdate = (resource: string, resourceId?: string) => hasPermission('update', resource, resourceId);
  const canDelete = (resource: string, resourceId?: string) => hasPermission('delete', resource, resourceId);

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    user,
  };
}

// Helper function to check ownership
function checkOwnership(_resource: string, _resourceId: string | undefined, _userId: string): boolean {
  // This would typically query your database to check ownership
  // For now, returning true as a placeholder
  // In a real app, you'd check if the user owns the resource
  return true;
}