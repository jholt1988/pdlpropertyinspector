import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../../src/components/RepairPlan/Dashboard';
import { AnalysisResult, InventoryItem } from '../../src/types';

const analysis: AnalysisResult = {
  totalItems: 2,
  flaggedItems: [],
  itemsToFix: [],
  itemsToReplace: [],
  totalEstimatedCost: 0,
  generatedDate: new Date().toISOString(),
  summary: { conditionFlags: 0, lifecycleFlags: 0, maintenanceFlags: 0 }

};
const inventoryData: InventoryItem[] = [
  {
    itemId: '1',
    itemName: 'Old Outlet',
    category: 'electrical',
    currentCondition: 'Damaged',
    purchaseDate: '2018-01-01T00:00:00Z',
    lastMaintenanceDate: '2020-01-01T00:00:00Z',
    originalCost: 1000,
    currentMarketValue: 800,
    location: 'Kitchen',
    description: 'Needs work'
  },
  {
    itemId: '2',
    itemName: 'Old Pipe',
    category: 'plumbing',
    currentCondition: 'Fair',
    purchaseDate: '2019-06-01T00:00:00Z',
    lastMaintenanceDate: '2023-01-01T00:00:00Z',
    originalCost: 1000,
    currentMarketValue: 1000,
    location: 'Bathroom',
    description: ''
  }
];

describe('RepairPlan Dashboard', () => {
  it('renders stats', () => {
    const { getByText } = render(
      <Dashboard inventoryData={inventoryData} analysisResults={analysis} />
    );
    expect(getByText('Total Inventory Items')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });
});
