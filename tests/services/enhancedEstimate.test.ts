// tests/services/enhancedEstimate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEnhancedRepairEstimate } from '../../src/services/enhancedEstimate';
import { InventoryItem, UserLocation } from '../../src/types';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('enhancedEstimate', () => {
  const mockUserLocation: UserLocation = {
    city: 'Test City',
    region: 'Test Region',
    country: 'US',
    type: 'approximate'
  };

  const mockInventoryItems: InventoryItem[] = [
    {
      itemId: 'HVAC-1',
      itemName: 'HVAC Unit',
      category: 'hvac',
      currentCondition: 'Fair',
      purchaseDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      originalCost: 5000,
      location: 'Roof'
    },
    {
      itemId: 'PLUMB-1',
      itemName: 'Water Heater',
      category: 'plumbing',
      currentCondition: 'Poor',
      purchaseDate: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      originalCost: 1200,
      location: 'Basement'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to simulate backend failure, forcing local processing
    (fetch as any).mockRejectedValue(new Error('Backend not available'));
  });

  it('generates enhanced estimates with depreciation calculations', async () => {
    const progressCallbackMock = vi.fn();
    
    const result = await generateEnhancedRepairEstimate(
      mockInventoryItems,
      mockUserLocation,
      'USD',
      progressCallbackMock
    );

    expect(result).toBeDefined();
    expect(result.line_items).toHaveLength(2);
    expect(result.summary).toBeDefined();
    expect(result.metadata).toBeDefined();

    // Check that progress callback was called
    expect(progressCallbackMock).toHaveBeenCalledWith('Analysis and estimate generation has begun...');
    expect(progressCallbackMock).toHaveBeenCalledWith('Process concluded successfully!');
  });

  it('includes depreciation data in line items', async () => {
    const result = await generateEnhancedRepairEstimate(
      mockInventoryItems,
      mockUserLocation
    );

    const hvacItem = result.line_items.find(item => item.itemId === 'HVAC-1');
    const plumbingItem = result.line_items.find(item => item.itemId === 'PLUMB-1');

    expect(hvacItem).toBeDefined();
    expect(plumbingItem).toBeDefined();

    if (hvacItem && plumbingItem) {
      // HVAC item should have depreciation data
      expect(hvacItem.originalCost).toBe(5000);
      expect(hvacItem.currentAge).toBeGreaterThan(4);
      expect(hvacItem.depreciatedValue).toBeLessThan(hvacItem.originalCost);
      expect(hvacItem.adjustedValue).toBeLessThanOrEqual(hvacItem.depreciatedValue);
      expect(hvacItem.conditionPenalty).toBe(0.30); // Fair condition = 30%
      expect(hvacItem.annualDepreciationRate).toBe(0.12); // HVAC rate
      expect(hvacItem.expectedLifetime).toBe(15); // HVAC lifetime

      // Poor condition plumbing item should have higher penalty
      expect(plumbingItem.conditionPenalty).toBe(0.45); // Poor condition = 45%
      expect(plumbingItem.annualDepreciationRate).toBe(0.08); // Plumbing rate
      expect(plumbingItem.expectedLifetime).toBe(20); // Plumbing lifetime
    }
  });

  it('handles reclassification when depreciated value hits zero', async () => {
    const oldItems: InventoryItem[] = [
      {
        itemId: 'OLD-1',
        itemName: 'Ancient HVAC',
        category: 'hvac',
        currentCondition: 'Poor',
        purchaseDate: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 25 years old
        originalCost: 1000,
        location: 'Roof'
      }
    ];

    const result = await generateEnhancedRepairEstimate(oldItems, mockUserLocation);
    
    expect(result.summary.reclassifiedItems).toBeGreaterThan(0);
    
    const oldItem = result.line_items[0];
    expect(oldItem.recommendedAction).toBe('Replace');
    expect(oldItem.reclassificationReason).toContain('Depreciated value reached zero');
  });

  it('calculates summary totals correctly', async () => {
    const result = await generateEnhancedRepairEstimate(
      mockInventoryItems,
      mockUserLocation
    );

    expect(result.summary.totalOriginalCost).toBe(
      mockInventoryItems.reduce((sum, item) => sum + item.originalCost, 0)
    );
    
    expect(result.summary.totalRecommendedCost).toBeGreaterThan(0);
    expect(result.summary.total_project_cost).toBe(result.summary.totalRecommendedCost);
    
    const repairItems = result.summary.items_to_repair;
    const replaceItems = result.summary.items_to_replace;
    expect(repairItems + replaceItems).toBe(mockInventoryItems.length);
  });

  it('includes metadata with analysis steps', async () => {
    const result = await generateEnhancedRepairEstimate(
      mockInventoryItems,
      mockUserLocation,
      'CAD' // Test different currency
    );

    expect(result.metadata.currency).toBe('CAD');
    expect(result.metadata.location).toBe('Test City, Test Region');
    expect(result.metadata.depreciationMethod).toContain('Trade-specific with condition adjustments');
    expect(result.metadata.analysisSteps).toHaveLength(6);
    expect(result.metadata.analysisSteps[0]).toContain('Step 1');
    expect(result.metadata.analysisSteps[5]).toContain('Step 6');
  });
});