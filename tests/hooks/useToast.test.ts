// tests/hooks/useToast.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../src/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('adds and removes toasts', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toHaveLength(0);

    act(() => {
      result.current.showToast('Test message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('info');

    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-removes toasts after duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'info', 3000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not auto-remove toasts with duration 0', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Persistent message', 'info', 0);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('provides analysis-specific toast methods', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showAnalysisStarted();
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toContain('Analysis and estimate generation has begun');
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].duration).toBe(0); // Persistent

    act(() => {
      result.current.showAnalysisCompleted();
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[1].message).toContain('Process concluded successfully');
    expect(result.current.toasts[1].type).toBe('success');
  });
});