import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../src/components/Layout';

const mockLogout = vi.fn();
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Tester', role: 'property_manager' },
    logout: mockLogout,
  })
}));

describe('Layout', () => {
  it('shows user info and handles logout', () => {
    const { getByText, getByTitle } = render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(getByText('Tester')).toBeTruthy();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(getByTitle('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
    vi.restoreAllMocks();
  });
