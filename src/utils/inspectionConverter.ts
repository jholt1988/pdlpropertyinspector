import { Inspection, InventoryItem, ChecklistItem } from '../types';

function mapCondition(condition: ChecklistItem['condition']): InventoryItem['currentCondition'] {
  switch (condition) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
    default:
      return 'Good';
  }
}

export function inspectionToInventoryItems(inspection: Inspection): InventoryItem[] {
  const items: InventoryItem[] = [];

  inspection.rooms.forEach(room => {
    room.checklistItems.forEach(check => {
      const needsAction = check.requiresAction || (check.condition === 'poor') || (check.damageEstimate && check.damageEstimate > 0);
      if (!needsAction) return;

      const item: InventoryItem = {
        itemId: `${inspection.id}_${room.id}_${check.id}`,
        itemName: check.item,
        category: check.category.toLowerCase(),
        currentCondition: mapCondition(check.condition),
        purchaseDate: new Date().toISOString(),
        originalCost: check.damageEstimate || 0,
        location: room.name,
        description: check.notes
      };
      items.push(item);
    });
  });

  return items;
}

