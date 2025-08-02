import { FlaggedItem, EstimateLine, EstimateResult, InventoryItem,  } from '../types';
import { runRepairEstimatorAgent } from './customRepairEstimator';

export interface InspectionItem extends InventoryItem {

  item_description: string;
  issue_type: string;
  location_in_property: string;
  area_identifier?: string;
}

export async function estimateRepairCosts(
  flaggedItems: FlaggedItem[],
  area: string
): Promise<EstimateResult> {
  const inspectionData: InspectionItem[] = flaggedItems.map(item => ({
    item_description: item.itemName,
    itemId: item.itemId,
    itemName: item.itemName,
    category: item.category,
    currentCondition: item.currentCondition,
    purchaseDate: item.purchaseDate,
    lastMaintenanceDate: item.lastMaintenanceDate,
    originalCost: item.originalCost,
    currentMarketValue: item.currentMarketValue,
    issue_type: item.flagReason,
    location_in_property: item.location || 'unknown'
  }));
  return runRepairEstimatorAgent(inspectionData, area, 'USD');
}
