import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KeyCheckLogo } from '../../src/components/KeyCheckLogo';

describe('KeyCheckLogo', () => {
  it('renders with default size', () => {
    const { container } = render(<KeyCheckLogo />);
    const element = container.firstChild as HTMLElement;
    expect(element?.className).toContain('w-12');
    expect(element?.className).toContain('h-12');
  });

  it('renders with custom size', () => {
    const { container } = render(<KeyCheckLogo size="lg" />);
    const element = container.firstChild as HTMLElement;
    expect(element?.className).toContain('w-16');
    expect(element?.className).toContain('h-16');
  });
});
