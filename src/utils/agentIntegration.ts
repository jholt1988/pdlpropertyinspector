import { FlaggedItem, EstimateLine, EstimateResult } from '../types';
import { runRepairEstimatorAgent } from './customRepairEstimator';

export interface InspectionItem {
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
    issue_type: item.flagReason,
    location_in_property: item.location || 'unknown'
  }));
  return runRepairEstimatorAgent(inspectionData, area, 'USD');
}
