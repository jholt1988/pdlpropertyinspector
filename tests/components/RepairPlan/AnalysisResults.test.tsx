// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import AnalysisResults from '../../../src/components/RepairPlan/AnalysisResults';
import { mockAnalysisResults } from '../../mocks/analysis';

describe('AnalysisResults component', () => {
  it('renders tab navigation', () => {
    render(<AnalysisResults analysisResults={mockAnalysisResults} />);

    // Check that the buttons are rendered with the correct counts
    expect(screen.getByRole('button', { name: /All Flagged Items/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Items to Fix/ })).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /Items to Replace/ })).toHaveTextContent('1');
  });
});

