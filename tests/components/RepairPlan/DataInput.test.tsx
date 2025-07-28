// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import DataInput from '../../../src/components/RepairPlan/DataInput';
import { sampleInventory, sampleAnalysis, sampleConfig } from './sampleData';

vi.mock('../../../src/contexts/StorageContext', () => ({
  useStorage: () => ({ inspections: [] })
}));

describe('DataInput component', () => {
  it('renders table rows for inventory', () => {
    const setInventoryData = vi.fn();
    const setAnalysisResults = vi.fn();
    render(
      <DataInput
        inventoryData={sampleInventory}
        setInventoryData={setInventoryData}
        setAnalysisResults={setAnalysisResults}
        systemConfig={sampleConfig}
      />
    );
    expect(screen.getByText(/Current Inventory/)).toBeInTheDocument();
    expect(screen.getByText('Boiler')).toBeInTheDocument();
  });
});


