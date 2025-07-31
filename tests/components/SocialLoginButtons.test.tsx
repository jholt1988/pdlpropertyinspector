import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SocialLoginButtons } from '../../src/components/SocialLoginButtons';

vi.mock('../../src/services/socialAuthService', () => {
  return {
    SocialAuthService: { initiateSocialLogin: vi.fn(() => Promise.resolve({ success: true })) }
  };
});
import { SocialAuthService } from '../../src/services/socialAuthService';
const mockInit = vi.mocked(SocialAuthService.initiateSocialLogin);

describe('SocialLoginButtons',async  () => {
  it('calls service when provider button clicked', async () => {
    const { getByText } = render(<SocialLoginButtons />);
    await fireEvent.click(getByText(/Continue with Google/i));
    expect(mockInit).toHaveBeenCalled();
  });
});
