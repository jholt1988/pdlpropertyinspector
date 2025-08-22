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
            { id: 'c1', category: 'Electrical', item: 'Outlet', condition: 'poor', notes: 'broken', photos: [], requiresAction: true, estimatedAge: 10 },
            {
              id: 'c2',
              category: 'Appliances',
              item: 'Kitchen appliances',
              condition: null,
              notes: '',
              photos: [],
              requiresAction: false,
              subItems: [
                { id: 'c2a', name: 'Refrigerator', condition: 'good', estimatedAge: 3 },
                { id: 'c2b', name: 'Stove', condition: 'fair', estimatedAge: 6 }
              ]
            }
          ]
        }
      ],
      generalNotes: '',
      signatures: [],
      reportGenerated: false,
      syncStatus: 'synced'
    } as unknown as Inspection;

    const items = inspectionToInventoryItems(inspection);
    expect(items.length).toBe(3);
    expect(items[0].itemName).toBe('Outlet');
    expect(items[0].category).toBe('electrical');
    expect(items[0].currentCondition).toBe('Poor');
    expect(items[1].itemName).toBe('Refrigerator');
    expect(items[1].category).toBe('appliances');
    expect(items[2].itemName).toBe('Stove');
    expect(items[2].currentCondition).toBe('Fair');
    });
  });
});
