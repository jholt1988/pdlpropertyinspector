// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePropertyId, generateInspectionId, generateItemId } from '../../src/utils/idGenerator';
import { resetSequences } from '../../src/utils/sequenceGenerator';

// Helper function to fix Math.random and Date.now for predictable IDs
const withFixedRandom = (dateNow: number, mathRandom: number, fn: () => void) => {
  const originalDateNow = Date.now;
  const originalMathRandom = Math.random;
  Date.now = vi.fn(() => dateNow);
  Math.random = vi.fn(() => mathRandom);
  fn();
  Date.now = originalDateNow;
  Math.random = originalMathRandom;
};

describe('id generators', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('produce predictable formats', () => {
    // Mock Date.now and Math.random to get predictable output
    withFixedRandom(0, 0.123456789, () => {
      const prop = generatePropertyId();
      expect(prop).toMatch(/^PROP00000014FZ$/);

      const insp = generateInspectionId(prop);
      expect(insp).toMatch(/^INSP-PROP00000014FZ-0000001$/);

      const item = generateItemId(insp);
      expect(item).toMatch(/^ITEM-INSP-PROP00000014FZ-0000001-0000001$/);
    });
  });
});
