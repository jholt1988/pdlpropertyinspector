// tests/utils/depreciationCalculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateItemDepreciation,
  getTradeDepreciationRate,
  getTradeLifetime,
  CONDITION_PENALTIES
} from '../../src/utils/depreciationCalculator';
import { InventoryItem } from '../../src/types';

describe('depreciationCalculator', () => {
  const mockItem: InventoryItem = {
    itemId: 'TEST-1',
    itemName: 'Test HVAC Unit',
    category: 'hvac',
    currentCondition: 'Good',
    purchaseDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 5 years ago
    originalCost: 5000,
    lastMaintenanceDate: undefined,
    location: 'Roof'
  };

  it('calculates depreciation correctly', () => {
    const result = calculateItemDepreciation(mockItem, 0.12); // 12% annual rate

    expect(result.originalCost).toBe(5000);
    expect(result.currentAge).toBeCloseTo(5, 1); // Approximately 5 years
    expect(result.depreciatedValue).toBeCloseTo(5000 - (5000 * 0.12 * 5), 0); // $2000
    expect(result.conditionPenalty).toBe(CONDITION_PENALTIES.good);
  });

  it('applies condition penalties correctly', () => {
    const excellentItem = { ...mockItem, currentCondition: 'Excellent' as const };
    const goodItem = { ...mockItem, currentCondition: 'Good' as const };
    const fairItem = { ...mockItem, currentCondition: 'Fair' as const };
    const poorItem = { ...mockItem, currentCondition: 'Poor' as const };

    const excellentResult = calculateItemDepreciation(excellentItem, 0.12);
    const goodResult = calculateItemDepreciation(goodItem, 0.12);
    const fairResult = calculateItemDepreciation(fairItem, 0.12);
    const poorResult = calculateItemDepreciation(poorItem, 0.12);

    expect(excellentResult.conditionPenalty).toBe(0.00);
    expect(goodResult.conditionPenalty).toBe(0.15);
    expect(fairResult.conditionPenalty).toBe(0.30);
    expect(poorResult.conditionPenalty).toBe(0.45);

    // Fair condition should have lower adjusted value than good condition
    expect(fairResult.adjustedValue).toBeLessThan(goodResult.adjustedValue);
    expect(poorResult.adjustedValue).toBeLessThan(fairResult.adjustedValue);
  });

  it('recommends replace when depreciated value hits zero', () => {
    const oldItem = {
      ...mockItem,
      currentCondition: 'Poor' as const,
      purchaseDate: new Date(Date.now() - 20 * 365 * 24 * 60 * 60 * 1000).toISOString() // 20 years ago
    };

    const result = calculateItemDepreciation(oldItem, 0.12);

    expect(result.reclassificationNeeded).toBe(true);
    expect(result.recommendedAction).toBe('replace');
    expect(result.adjustedValue).toBe(0);
  });

  it('returns correct trade depreciation rates', () => {
    expect(getTradeDepreciationRate('hvac')).toBe(0.12);
    expect(getTradeDepreciationRate('plumbing')).toBe(0.08);
    expect(getTradeDepreciationRate('electrical')).toBe(0.10);
    expect(getTradeDepreciationRate('landscaping')).toBe(0.25);
    expect(getTradeDepreciationRate('foundation')).toBe(0.02);
    expect(getTradeDepreciationRate('unknown')).toBe(0.10); // default
  });

  it('returns correct trade lifetimes', () => {
    expect(getTradeLifetime('hvac')).toBe(15);
    expect(getTradeLifetime('plumbing')).toBe(20);
    expect(getTradeLifetime('electrical')).toBe(25);
    expect(getTradeLifetime('landscaping')).toBe(3);
    expect(getTradeLifetime('foundation')).toBe(50);
    expect(getTradeLifetime('unknown')).toBe(15); // default
  });
});