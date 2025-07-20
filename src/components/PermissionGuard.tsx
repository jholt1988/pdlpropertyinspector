import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  action: string;
  resource: string;
  resourceId?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If multiple permissions, require all vs any
}

export function PermissionGuard({ 
  children, 
  action, 
  resource, 
  resourceId, 
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(action, resource, resourceId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function CanCreate({ resource, children, fallback }: { 
  resource: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard action="create" resource={resource} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanEdit({ resource, resourceId, children, fallback }: { 
  resource: string; 
  resourceId?: string;
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard action="update" resource={resource} resourceId={resourceId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({ resource, resourceId, children, fallback }: { 
  resource: string; 
  resourceId?: string;
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard action="delete" resource={resource} resourceId={resourceId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}