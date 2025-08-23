import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastContainer } from '../../src/components/ToastContainer';
import { Toast } from '../../src/hooks/useToast';

describe('ToastContainer', () => {
  it('returns null when there are no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemoveToast={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders toasts and handles removal', () => {
    const mockToasts: Toast[] = [
      { id: '1', message: 'Hello', type: 'success', duration: 3000 }
    ];
    const onRemove = vi.fn();

    render(<ToastContainer toasts={mockToasts} onRemoveToast={onRemove} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
