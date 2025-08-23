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
  const now = new Date();

  inspection.rooms.forEach(room => {
    room.checklistItems.forEach(check => {
      // Helper to push a converted inventory item
      const pushItem = (name: string, condition: ChecklistItem['condition'], age?: number) => {
        const purchaseDate = age
          ? new Date(now.getFullYear() - age, now.getMonth(), now.getDate()).toISOString()
          : now.toISOString();
        items.push({
          itemId: `${inspection.id}_${room.id}_${check.id}_${name.replace(/\s+/g, '')}`,
          itemName: name,
          category: check.category.toLowerCase(),
          currentCondition: mapCondition(condition),
          purchaseDate,
          // Cost is no longer collected during inspection so default to 0
          originalCost: 0,
          location: room.name,
          description: check.notes
        });
      };

      // If the checklist entry contains sub-items, convert each one individually
      if (check.subItems && check.subItems.length > 0) {
        check.subItems.forEach(sub => {
          if (sub.condition) {
            pushItem(sub.name, sub.condition, sub.estimatedAge);
          }
        });
      } else if (check.condition) {
        pushItem(check.item, check.condition, check.estimatedAge);
      }
    });
  });

  return items;
}

