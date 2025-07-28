import { describe, it, expect } from 'vitest';
import { analyzeInventory } from '../../src/utils/analysisEngine.ts';
import { InventoryItem, SystemConfig } from '../../src/types';

function withFixedDate<T>(iso: string, fn: () => T): T {
  const RealDate = Date;
  const fixed = new RealDate(iso).getTime();
  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixed);
      } else {
        // @ts-ignore
        super(...args);
      }
    }
    static now() { return fixed; }
  }
  // @ts-ignore
  global.Date = MockDate;
  try {
    return fn();
  } finally {
    global.Date = RealDate;
  }
}

describe('analyzeInventory', () => {
  it('produces correct counts and costs', () => {
    withFixedDate('2024-01-01T00:00:00Z', () => {
      const inventory: InventoryItem[] = [
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

    const config: SystemConfig = {
      repairThreshold: 0.5,
      laborRates: {
        general: 50,
        electrical: 75,
        plumbing: 65,
        hvac: 80,
        specialized: 90
      },
      maintenanceThresholds: {
        general: 24,
        electrical: 12,
        plumbing: 18
      },
      expectedLifespans: {
        general: 60,
        electrical: 60,
        plumbing: 60
      }
    };

    const result = analyzeInventory(inventory, config);
    expect(result.totalItems).toBe(2);
    expect(result.flaggedItems.length).toBe(2);
    expect(result.itemsToFix.length).toBe(1);
    expect(result.itemsToReplace.length).toBe(1);
    expect(result.totalEstimatedCost).toBe(1410);

    const [first, second] = result.flaggedItems;
    expect(first.recommendation).toBe('replace');
    expect(second.recommendation).toBe('fix');
    expect(first.estimatedReplacementCost).toBe(1080);
    expect(second.estimatedRepairCost).toBe(330);

    expect(result.summary).toEqual({
      conditionFlags: 1,
      lifecycleFlags: 2,
      maintenanceFlags: 1
    });
    });
  });
});
