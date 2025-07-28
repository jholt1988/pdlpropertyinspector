import { describe, it, expect } from 'vitest';
import { generatePropertyId, generateInspectionId, generateUniqueId } from '../../src/utils/idGenerator.ts';

function withFixedRandom<T>(time: number, rand: number, fn: () => T): T {
  const realRandom = Math.random;
  const realDateNow = Date.now;
  Math.random = () => rand;
  Date.now = () => time;
  try {
    return fn();
  } finally {
    Math.random = realRandom;
    Date.now = realDateNow;
  }
}

describe('id generators', () => {
  it('produce predictable formats', () => {
    withFixedRandom(0, 0.123456789, () => {
      const prop = generatePropertyId();
      expect(prop).toMatch(/^PROP0000004FZZ$/);

      const insp = generateInspectionId(prop, 3);
      expect(insp).toBe(`${prop}-UNIT03`);

      const uid = generateUniqueId('PRE_');
      expect(uid).toMatch(/^PRE_0_4fzzzxjyl$/);
    });
  });
});
