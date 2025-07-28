import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../../src/components/RepairPlan/Dashboard';
import { AnalysisResult } from '../../src/types';

const analysis: AnalysisResult = {
  totalItems: 2,
  flaggedItems: [],
  itemsToFix: [],
  itemsToReplace: [],
  totalEstimatedCost: 0,
  generatedDate: new Date().toISOString(),
  summary: { conditionFlags: 0, lifecycleFlags: 0, maintenanceFlags: 0 }
};

describe('RepairPlan Dashboard', () => {
  it('renders stats', () => {
    const { getByText } = render(
      <Dashboard inventoryData={inventoryData} analysisResults={analysis} />
    );
    expect(getByText('Total Inventory Items')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });
});
