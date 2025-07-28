// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import AnalysisResults from '../../../src/components/RepairPlan/AnalysisResults';
import { sampleAnalysis } from './sampleData';

describe('AnalysisResults component', () => {
  it('renders tab navigation', () => {
    render(<AnalysisResults analysisResults={sampleAnalysis} />);
    expect(screen.getByRole('button', { name: /All Flagged Items/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Items to Fix/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Items to Replace/ })).toBeInTheDocument();
  });
});

