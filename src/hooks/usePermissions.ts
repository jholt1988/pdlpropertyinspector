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
function checkOwnership(resource: string, resourceId: string | undefined, userId: string): boolean {
  if (!resourceId) return false;
  try {
    const items = JSON.parse(localStorage.getItem(`${resource}s`) || '[]');
    const record = items.find((i: any) => i.id === resourceId);
    if (!record) return false;
    switch (resource) {
      case 'property':
        return record.managedBy === userId || record.owner === userId;
      case 'inspection':
        return (
          record.inspector?.id === userId ||
          record.tenant?.id === userId ||
          record.landlord?.id === userId
        );
      default:
        return false;
    }
  } catch {
    return false;
  }
}