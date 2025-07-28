import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'property_manager' }, isLoading: false });
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}> 
        <ProtectedRoute>
          <span>secret</span>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(getByText('secret')).toBeTruthy();
  });

  it('redirects when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, isLoading: false });
    const { container } = render(
      <MemoryRouter initialEntries={['/private']}> 
        <Routes>
          <Route path="/private" element={<ProtectedRoute><span>secret</span></ProtectedRoute>} />
          <Route path="/auth/login" element={<span>login</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(container.textContent).toContain('login');
  });
});
