// utils/dataNormalization.ts
import { InventoryItem, FlaggedItem, AnalysisResult, EstimateLineItem, DetailedEstimate, EstimateResult } from '../types';

/**
 * Normalizes data between different components to ensure consistent data flow
 */

export interface NormalizedEstimateItem {
  // Core item identification
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: string;
  location?: string;
  description?: string;
  
  // Cost data
  estimatedRepairCost?: number;
  estimatedReplacementCost?: number;
  recommendedCost: number;
  
  // Action data
  recommendation: 'fix' | 'replace';
  flagReason: 'condition' | 'lifecycle' | 'maintenance';
  flagDetails: string;
  
  // Instructions and resources
  repairSteps?: string[];
  requiredResources?: string[];
  estimatedTimeline?: string;
  
  // Cost breakdown
  costBreakdown?: {
    labor?: number;
    parts?: number;
    disposal?: number;
    installation?: number;
  };
  
  // Original inventory data
  originalCost: number;
  purchaseDate: string;
  currentMarketValue?: number;
  lastMaintenanceDate?: string;
}

/**
 * Convert EstimateLineItem to normalized format
 */
export function normalizeEstimateLineItem(
  item: EstimateLineItem,
  inventoryItem?: InventoryItem
): NormalizedEstimateItem {
  const isRepair = item.recommendedAction.toLowerCase() === 'fix';
  
  return {
    // Core identification
    itemId: inventoryItem?.itemId || item.itemId,
    itemName: inventoryItem?.itemName || item.itemName,
    category: inventoryItem?.category || item.category,
    currentCondition: inventoryItem?.currentCondition || item.currentCondition,
    location: inventoryItem?.location || item.location,
    description: inventoryItem?.description,
    
    // Cost data
    estimatedRepairCost: item.fix?.totalCost,
    estimatedReplacementCost: item.replace?.totalCost,
    recommendedCost: isRepair ? (item.fix?.totalCost || 0) : (item.replace?.totalCost || 0),
    
    // Action data
    recommendation: isRepair ? 'fix' : 'replace',
    flagReason: isRepair ? 'condition' : 'lifecycle',
    flagDetails: `${item.recommendedAction} recommended based on current condition and cost analysis`,
    
    // Instructions
    repairSteps: isRepair ? item.instructions?.fix : item.instructions?.replace,
    estimatedTimeline: '1-2 weeks', // Default timeline
    
    // Cost breakdown
    costBreakdown: {
      labor: isRepair ? 
        (item.fix?.laborHours || 0) * (item.fix?.laborRate || 0) :
        (item.replace?.laborHours || 0) * (item.replace?.laborRate || 0),
      parts: isRepair ? item.fix?.partsCost : item.replace?.partsCost,
      installation: !isRepair ? item.replace?.partsCost : undefined,
      disposal: !isRepair ? 50 : undefined // Default disposal cost for replacements
    },
    
    // Original inventory data
    originalCost: inventoryItem?.originalCost || 0,
    purchaseDate: inventoryItem?.purchaseDate || new Date().toISOString().split('T')[0],
    currentMarketValue: inventoryItem?.currentMarketValue,
    lastMaintenanceDate: inventoryItem?.lastMaintenanceDate
  };
}

/**
 * Convert normalized item to FlaggedItem format for AnalysisResults
 */
export function normalizedToFlaggedItem(item: NormalizedEstimateItem): FlaggedItem {
  return {
    // InventoryItem properties
    itemId: item.itemId,
    itemName: item.itemName,
    category: item.category,
    currentCondition: item.currentCondition as any,
    purchaseDate: item.purchaseDate,
    lastMaintenanceDate: item.lastMaintenanceDate,
    originalCost: item.originalCost,
    currentMarketValue: item.currentMarketValue,
    location: item.location,
    description: item.description,
    
    // FlaggedItem specific properties
    flagReason: item.flagReason,
    flagDetails: item.flagDetails,
    recommendation: item.recommendation,
    estimatedRepairCost: item.estimatedRepairCost,
    estimatedReplacementCost: item.estimatedReplacementCost,
    repairSteps: item.repairSteps,
    requiredResources: item.requiredResources,
    estimatedTimeline: item.estimatedTimeline,
    costBreakdown: item.costBreakdown
  };
}

/**
 * Create AnalysisResult from DetailedEstimate and inventory data
 */
export function createAnalysisResultFromDetailedEstimate(
  detailedEstimate: DetailedEstimate,
  inventoryData: InventoryItem[]
): AnalysisResult {
  // Normalize all estimate line items
  const normalizedItems = detailedEstimate.line_items.map(lineItem => {
    const matchingInventoryItem = inventoryData.find(inv => 
      inv.itemName.toLowerCase().includes(lineItem.itemName.toLowerCase()) ||
      lineItem.itemName.toLowerCase().includes(inv.itemName.toLowerCase()) ||
      inv.itemId === lineItem.itemId
    );
    
    return normalizeEstimateLineItem(lineItem, matchingInventoryItem);
  });
  
  // Convert to FlaggedItem format
  const flaggedItems = normalizedItems.map(normalizedToFlaggedItem);
  
  // Separate by recommendation
  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');
  
  return {
    totalItems: inventoryData.length,
    flaggedItems,
    itemsToFix,
    itemsToReplace,
    totalEstimatedCost: detailedEstimate.summary.totalRecommendedCost,
    generatedDate: new Date().toISOString(),
    summary: {
      conditionFlags: flaggedItems.filter(item => item.flagReason === 'condition').length,
      lifecycleFlags: flaggedItems.filter(item => item.flagReason === 'lifecycle').length,
      maintenanceFlags: flaggedItems.filter(item => item.flagReason === 'maintenance').length
    }
  };
}

/**
 * Create AnalysisResult from EstimateResult (for backward compatibility)
 */
export function createAnalysisResultFromEstimateResult(
  estimateResult: EstimateResult,
  inventoryData: InventoryItem[]
): AnalysisResult {
  // Convert EstimateResult breakdown to normalized format
  const normalizedItems = estimateResult.itemized_breakdown.map(item => {
    const matchingInventoryItem = inventoryData.find(inv => 
      inv.itemName.toLowerCase().includes(item.item_description.toLowerCase()) ||
      item.item_description.toLowerCase().includes(inv.itemName.toLowerCase())
    );
    
    return {
      // Core identification
      itemId: matchingInventoryItem?.itemId || item.item_description,
      itemName: matchingInventoryItem?.itemName || item.item_description,
      category: matchingInventoryItem?.category || 'general',
      currentCondition: matchingInventoryItem?.currentCondition || 'Poor',
      location: matchingInventoryItem?.location || item.location,
      description: matchingInventoryItem?.description || item.notes,
      
      // Cost data
      estimatedRepairCost: item.issue_type === 'repair' ? item.item_total_cost : undefined,
      estimatedReplacementCost: item.issue_type === 'replace' ? item.item_total_cost : undefined,
      recommendedCost: item.item_total_cost,
      
      // Action data
      recommendation: item.issue_type === 'repair' ? 'fix' as const : 'replace' as const,
      flagReason: item.issue_type === 'repair' ? 'condition' as const : 'lifecycle' as const,
      flagDetails: item.notes || `${item.issue_type} recommended based on analysis`,
      
      // Instructions
      repairSteps: item.repair_instructions,
      estimatedTimeline: '1-2 weeks',
      
      // Cost breakdown
      costBreakdown: {
        labor: item.estimated_labor_cost,
        parts: item.estimated_material_cost,
        installation: item.issue_type === 'replace' ? item.estimated_labor_cost : undefined,
        disposal: item.issue_type === 'replace' ? 50 : undefined
      },
      
      // Original inventory data
      originalCost: matchingInventoryItem?.originalCost || 0,
      purchaseDate: matchingInventoryItem?.purchaseDate || new Date().toISOString().split('T')[0],
      currentMarketValue: matchingInventoryItem?.currentMarketValue,
      lastMaintenanceDate: matchingInventoryItem?.lastMaintenanceDate
    } as NormalizedEstimateItem;
  });
  
  // Convert to FlaggedItem format
  const flaggedItems = normalizedItems.map(normalizedToFlaggedItem);
  
  // Separate by recommendation
  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');
  
  return {
    totalItems: inventoryData.length,
    flaggedItems,
    itemsToFix,
    itemsToReplace,
    totalEstimatedCost: estimateResult.overall_project_estimate,
    generatedDate: new Date().toISOString(),
    summary: {
      conditionFlags: flaggedItems.filter(item => item.flagReason === 'condition').length,
      lifecycleFlags: flaggedItems.filter(item => item.flagReason === 'lifecycle').length,
      maintenanceFlags: flaggedItems.filter(item => item.flagReason === 'maintenance').length
    }
  };
}

/**
 * Generate fallback FlaggedItems from inventory data when no estimate is available
 */
export function createFallbackAnalysisResult(inventoryData: InventoryItem[]): AnalysisResult {
  const flaggedItems = inventoryData
    .filter(item => item.currentCondition === 'Poor' || item.currentCondition === 'Damaged' || item.currentCondition === 'Non-functional')
    .map(item => {
      const isNonFunctional = item.currentCondition === 'Non-functional';
      const repairCost = isNonFunctional ? undefined : (item.originalCost * 0.15); // 15% of original cost for repair
      const replacementCost = item.originalCost * 0.8; // 80% of original cost for replacement
      
      return {
        // InventoryItem properties
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category,
        currentCondition: item.currentCondition,
        purchaseDate: item.purchaseDate,
        lastMaintenanceDate: item.lastMaintenanceDate,
        originalCost: item.originalCost,
        currentMarketValue: item.currentMarketValue,
        location: item.location,
        description: item.description,
        
        // FlaggedItem specific properties
        flagReason: 'condition' as const,
        flagDetails: `Item condition is ${item.currentCondition} - requires attention`,
        recommendation: isNonFunctional ? 'replace' as const : 'fix' as const,
        estimatedRepairCost: repairCost,
        estimatedReplacementCost: replacementCost,
        repairSteps: isNonFunctional 
          ? [`Remove old ${item.itemName}`, `Install new ${item.itemName}`, 'Test installation']
          : [`Assess ${item.itemName} condition`, `Repair ${item.itemName}`, 'Test functionality'],
        requiredResources: isNonFunctional
          ? [`New ${item.itemName}`, 'Installation tools', 'Professional installer']
          : [`Repair materials for ${item.itemName}`, 'Basic tools', 'Replacement parts'],
        estimatedTimeline: isNonFunctional ? '2-3 weeks' : '1-2 weeks',
        costBreakdown: {
          labor: isNonFunctional ? (replacementCost * 0.3) : (repairCost || 0) * 0.6,
          parts: isNonFunctional ? (replacementCost * 0.7) : (repairCost || 0) * 0.4,
          installation: isNonFunctional ? (replacementCost * 0.3) : undefined,
          disposal: isNonFunctional ? 50 : undefined
        }
      } as FlaggedItem;
    });
  
  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');
  const totalCost = flaggedItems.reduce((sum, item) => 
    sum + (item.recommendation === 'fix' ? (item.estimatedRepairCost || 0) : (item.estimatedReplacementCost || 0)), 0);
  
  return {
    totalItems: inventoryData.length,
    flaggedItems,
    itemsToFix,
    itemsToReplace,
    totalEstimatedCost: totalCost,
    generatedDate: new Date().toISOString(),
    summary: {
      conditionFlags: flaggedItems.length,
      lifecycleFlags: itemsToReplace.length,
      maintenanceFlags: 0
    }
  };
}
