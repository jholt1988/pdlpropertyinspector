// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../../src/components/RepairPlan/Dashboard';
import { sampleInventory, sampleAnalysis } from './sampleData';

describe('Dashboard component', () => {
  it('renders stats summary', () => {
    render(<Dashboard inventoryData={sampleInventory} analysisResults={sampleAnalysis} />);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Inventory Items')).toBeInTheDocument();
    expect(screen.getByText('Total Estimated Remediation Cost')).toBeInTheDocument();
  });
});

