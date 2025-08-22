import { AnalysisResult, FlaggedItem, InventoryItem } from '../../src/types';

const mockInventoryItem: InventoryItem = {
  itemId: 'ITEM-1',
  itemName: 'HVAC Unit',
  category: 'hvac',
  location: 'Roof',
  purchaseDate: '2015-01-10T00:00:00.000Z',
  originalCost: 5000,
  currentCondition: 'Fair',
  lastMaintenanceDate: '2024-01-15T00:00:00.000Z',
};

const mockFlaggedItem: FlaggedItem = {
  ...mockInventoryItem,
  recommendation: 'replace',
  reason: 'Item is past its expected lifecycle.',
  estimatedCost: 3500,
  priority: 'high',
  requiredResources: ['HVAC Contractor', 'New HVAC Unit'],
  estimatedTimeline: '1-2 weeks',
};

export const mockAnalysisResults: AnalysisResult = {
  totalItems: 1,
  flaggedItems: [mockFlaggedItem],
  itemsToFix: [],
  itemsToReplace: [mockFlaggedItem],
  totalEstimatedCost: 3500,
  generatedDate: new Date().toISOString(),
  summary: {
    conditionFlags: 0,
    lifecycleFlags: 1,
    maintenanceFlags: 0,
  },
};

export const mockInventoryData: InventoryItem[] = [mockInventoryItem];