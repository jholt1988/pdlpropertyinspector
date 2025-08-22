import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PermissionGuard } from '../../src/components/PermissionGuard';

const mockHasPermission = vi.fn();
vi.mock('../../src/hooks/usePermissions.ts', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission })
}));

describe('PermissionGuard', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
    mockHasPermission.mockReturnValue(false);
  });
  it('renders children when permission granted', () => {
    mockHasPermission.mockReturnValue(true);
    const { getByText } = render(
      <PermissionGuard action="read" resource="test">
        <span>allowed</span>
      </PermissionGuard>
    );
    expect(getByText('allowed')).toBeTruthy();
  });

  it('renders fallback when permission denied', () => {
    const { getByText } = render(
      <PermissionGuard action="read" resource="test" fallback={<span>no</span>}>
        <span>allowed</span>
      </PermissionGuard>
    );
    expect(getByText('no')).toBeTruthy();
  });
});
