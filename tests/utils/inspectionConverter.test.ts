import { describe, it, expect } from 'vitest';
import { inspectionToInventoryItems } from '../../src/utils/inspectionConverter.ts';
import { Inspection } from '../../src/types';

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

describe('inspectionToInventoryItems', () => {
  it('converts checklist items to inventory entries', () => {
    withFixedDate('2024-01-01T00:00:00Z', () => {
    const inspection: Inspection = {
      id: 'INSP1',
      propertyId: 'PROP1',
      type: 'move-in',
      status: 'completed',
      createdAt: '2023-12-01T00:00:00Z',
      inspector: { id: '1', name: 'Inspector', email: 'i@example.com', role: 'property_manager' },
      rooms: [
        {
          id: 'room1',
          name: 'Kitchen',
          type: 'kitchen',
          checklistItems: [
            { id: 'c1', category: 'Electrical', item: 'Outlet', condition: 'poor', notes: 'broken', photos: [], requiresAction: true },
            { id: 'c2', category: 'Plumbing', item: 'Sink', condition: 'good', notes: '', photos: [], damageEstimate: 50, requiresAction: false }
          ]
        }
      ],
      generalNotes: '',
      signatures: [],
      reportGenerated: false,
      syncStatus: 'synced'
    } as unknown as Inspection;

    const items = inspectionToInventoryItems(inspection);
    expect(items.length).toBe(2);
    expect(items[0].itemName).toBe('Outlet');
    expect(items[0].category).toBe('electrical');
    expect(items[0].currentCondition).toBe('Poor');
    expect(items[1].itemName).toBe('Sink');
    expect(items[1].category).toBe('plumbing');
    expect(items[1].currentCondition).toBe('Good');
    });
  });
});
