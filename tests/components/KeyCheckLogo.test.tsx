import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KeyCheckLogo } from '../../src/components/KeyCheckLogo';

describe('KeyCheckLogo', () => {
  it('renders with default size', () => {
    const { container } = render(<KeyCheckLogo />);
    expect(container.firstChild?.className).toContain('w-12');
    expect(container.firstChild?.className).toContain('h-12');
  });

  it('renders with custom size', () => {
    const { container } = render(<KeyCheckLogo size="lg" />);
    expect(container.firstChild?.className).toContain('w-16');
    expect(container.firstChild?.className).toContain('h-16');
  });
});
