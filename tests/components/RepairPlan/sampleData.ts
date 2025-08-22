import { InventoryItem, SystemConfig, AnalysisResult } from '../../../src/types';
import { analyzeInventoryAndGeneratePlan } from '../../../src/utils/analysisEngine';

export const sampleInventory: InventoryItem[] = [
  {
    itemId: '1',
    itemName: 'Boiler',
    category: 'hvac',
    currentCondition: 'Poor',
    purchaseDate: '2020-01-01',
    lastMaintenanceDate: '2020-06-01',
    originalCost: 1000,
  },
  {
    itemId: '2',
    itemName: 'Pump',
    category: 'plumbing',
    currentCondition: 'Good',
    purchaseDate: '2018-01-01',
    lastMaintenanceDate: '2019-01-01',
    originalCost: 500,
  }
];

export const sampleConfig: SystemConfig = {
  repairThreshold: 0.6,
  laborRates: {
    general: 50,
    electrical: 60,
    plumbing: 40,
    hvac: 70,
    specialized: 100,
  },
  maintenanceThresholds: {
    general: 12,
    plumbing: 6,
    hvac: 12,
  },
  expectedLifespans: {
    general: 60,
    plumbing: 120,
    hvac: 180,
  }
};

// Export a function to generate the analysis instead of the promise directly
export const generateSampleAnalysis = () => analyzeInventoryAndGeneratePlan(sampleInventory, sampleConfig);

// For tests that need a static analysis result, provide a mock
export const sampleAnalysis: AnalysisResult = {
  totalItems: 2,
  flaggedItems: [],
  itemsToFix: [],
  itemsToReplace: [],
  totalEstimatedCost: 0,
  generatedDate: new Date().toISOString(),
  summary: {
    conditionFlags: 0,
    lifecycleFlags: 0,
    maintenanceFlags: 0
  }
};
