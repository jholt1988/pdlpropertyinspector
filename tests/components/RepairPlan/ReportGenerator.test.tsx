// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import ReportGenerator from '../../../src/components/RepairPlan/ReportGenerator';
import { mockAnalysisResults } from '../../mocks/analysis';

describe('ReportGenerator component', () => {
  it('shows markdown preview', () => {
    render(<ReportGenerator analysisResults={mockAnalysisResults} />);

    // Check for the correct title and other key information
    const reportPreviewElement = screen.getByText('Report Preview');
    const parentElement = reportPreviewElement.parentElement;
    const nextElement = parentElement?.nextElementSibling;
    const preview = nextElement?.querySelector('pre');
    
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toContain('# Property Inventory Remediation Plan');
    expect(preview?.textContent).toContain('**Total Items Analyzed:** 1');
    expect(preview?.textContent).toContain('**Total Estimated Cost:** $3,500');
  });
});

