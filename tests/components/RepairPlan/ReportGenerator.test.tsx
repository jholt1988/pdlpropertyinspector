// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import ReportGenerator from '../../../src/components/RepairPlan/ReportGenerator';
import { sampleAnalysis } from './sampleData';

describe('ReportGenerator component', () => {
  it('shows markdown preview', () => {
    render(<ReportGenerator analysisResults={sampleAnalysis} />);
    expect(screen.getByText(/Property Inventory Remediation Plan/)).toBeInTheDocument();
  });
});

