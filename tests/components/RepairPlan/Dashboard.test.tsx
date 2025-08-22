// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import Dashboard from '../../../src/components/RepairPlan/Dashboard';
import { mockAnalysisResults, mockInventoryData } from '../../mocks/analysis';

describe('Dashboard component', () => {
  it('renders stats summary', () => {
    render(
      <Dashboard
        analysisResults={mockAnalysisResults}
        inventoryData={mockInventoryData}
      />
    );

    // Find the "Total Inventory Items" card by its title
    const totalItemsCard = screen.getByText('Total Inventory Items').closest('div');
    // Assert that the number 1 is within that specific card
    if (totalItemsCard) {
      expect(within(totalItemsCard).getByText('1')).toBeInTheDocument();
    }

    // Find the "Flagged Items" card by its title
    const flaggedItemsCard = screen.getByText('Flagged Items').closest('div');
    // Assert that the number 1 is within that specific card
    if (flaggedItemsCard) {
      expect(within(flaggedItemsCard).getByText('1')).toBeInTheDocument();
    }
  });
});

