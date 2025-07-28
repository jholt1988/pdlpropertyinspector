import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { EmailVerificationBanner } from '../../src/components/EmailVerificationBanner';

const mockResend = vi.fn();
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', emailVerified: false, provider: 'email' },
    resendVerificationEmail: mockResend,
  })
}));

describe('EmailVerificationBanner', () => {
  it('renders banner when user needs verification', () => {
    const { getByText } = render(<EmailVerificationBanner />);
    expect(getByText('Please verify your email address.')).toBeTruthy();
  });

  it('calls resendVerificationEmail on button click', () => {
    const { getByRole } = render(<EmailVerificationBanner />);
    fireEvent.click(getByRole('button', { name: 'Resend Email' }));
    expect(mockResend).toHaveBeenCalledWith('test@example.com');
  });
});
