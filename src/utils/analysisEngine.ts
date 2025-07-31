import {
  InventoryItem,
  FlaggedItem,
  AnalysisResult,
  SystemConfig,
  UserLocation
} from '../types';
import { generateDetailedRepairEstimate } from './customRepairEstimator';

export const analyzeInventoryAndGeneratePlan = async (
  inventory: InventoryItem[],
  config: SystemConfig
): Promise<AnalysisResult> => {
  const flaggedItems: FlaggedItem[] = [];
  const currentDate = new Date();

  let conditionFlags = 0;
  let lifecycleFlags = 0;
  let maintenanceFlags = 0;

  const itemsToEstimate: InventoryItem[] = [];

  inventory.forEach(item => {
    const flagReasons: string[] = [];
    let flagReason: 'condition' | 'lifecycle' | 'maintenance' = 'condition';

    // Check condition-based flags
    const poorConditions = ['Poor', 'Damaged', 'Non-functional'];
    if (poorConditions.includes(item.currentCondition)) {
      flagReasons.push(`condition: ${item.currentCondition}`);
      flagReason = 'condition';
      conditionFlags++;
    }

    // Check lifecycle-based flags
    const purchaseDate = new Date(item.purchaseDate);
    const monthsSincePurchase = Math.floor(
      (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const expectedLifespan = config.expectedLifespans[item.category] || config.expectedLifespans.general;

    if (monthsSincePurchase >= expectedLifespan * 0.8) {
      flagReasons.push(
        `lifecycle: approaching/exceeding expected lifespan (${monthsSincePurchase}/${expectedLifespan} months)`
      );
      if (flagReason !== 'condition') {
        flagReason = 'lifecycle';
        lifecycleFlags++;
      }
    }

    // Check maintenance-based flags
    if (item.lastMaintenanceDate) {
      const lastMaintenanceDate = new Date(item.lastMaintenanceDate);
      const monthsSinceMaintenance = Math.floor(
        (currentDate.getTime() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const maintenanceThreshold =
        config.maintenanceThresholds[item.category] || config.maintenanceThresholds.general || 24;

      if (monthsSinceMaintenance > maintenanceThreshold) {
        flagReasons.push(`maintenance: overdue by ${monthsSinceMaintenance - maintenanceThreshold} months`);
        if (flagReason !== 'condition' && flagReason !== 'lifecycle') {
          flagReason = 'maintenance';
          maintenanceFlags++;
        }
      }
    }

    if (flagReasons.length > 0) {
      itemsToEstimate.push(item);
    }
  });

  if (itemsToEstimate.length === 0) {
    return {
      totalItems: inventory.length,
      flaggedItems: [],
      itemsToFix: [],
      itemsToReplace: [],
      totalEstimatedCost: 0,
      generatedDate: new Date().toISOString(),
      summary: {
        conditionFlags: 0,
        lifecycleFlags: 0,
        maintenanceFlags: 0
      }
    };
  }

  const userLocation: UserLocation = {
    ...config.userLocation,
    type: 'approximate'
  };

  const estimate = await generateDetailedRepairEstimate(itemsToEstimate, userLocation);

  estimate.line_items.forEach(lineItem => {
    const originalItem = inventory.find(invItem => invItem.itemName === lineItem.item_description)!;

    const flaggedItem: FlaggedItem = {
      ...originalItem,
      flagReason: 'condition', // This can be refined
      flagDetails: `Flagged for: ${lineItem.issue_type}`,
      recommendation: lineItem.recommended_option.action,
      estimatedRepairCost: lineItem.repair_costs.total_cost,
      estimatedReplacementCost: lineItem.replacement_costs.total_cost,
      repairSteps: lineItem.repair_steps,
      requiredResources: generateRequiredResources(originalItem, lineItem.recommended_option.action),
      estimatedTimeline: generateEstimatedTimeline(originalItem, lineItem.recommended_option.action),
      costBreakdown: {
        labor: lineItem.recommended_option.labor_cost,
        parts: lineItem.recommended_option.material_cost
      }
    };
    flaggedItems.push(flaggedItem);
  });

  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');

  return {
    totalItems: inventory.length,
    flaggedItems,
    itemsToFix,
    itemsToReplace,
    totalEstimatedCost: estimate.summary.total_project_cost,
    generatedDate: new Date().toISOString(),
    summary: {
      conditionFlags,
      lifecycleFlags,
      maintenanceFlags
    }
  };
};

const generateRequiredResources = (item: InventoryItem, recommendation: 'fix' | 'replace'): string[] => {
  const baseResources = {
    fix: {
      electrical: ['Certified electrician', 'Electrical parts and components', 'Safety equipment', 'Testing instruments'],
      plumbing: ['Licensed plumber', 'Plumbing parts and fittings', 'Specialized plumbing tools', 'Sealants and adhesives'],
      hvac: ['HVAC technician', 'Replacement parts and filters', 'Refrigerant (if applicable)', 'Calibration tools'],
      general: ['Qualified maintenance technician', 'Replacement parts', 'Standard tools', 'Safety equipment']
    },
    replace: {
      electrical: ['New electrical equipment', 'Certified electrician', 'Installation materials', 'Disposal service'],
      plumbing: ['Replacement plumbing fixture', 'Licensed plumber', 'Connection materials', 'Old equipment disposal'],
      hvac: ['New HVAC equipment', 'HVAC contractor', 'Installation kit', 'Equipment disposal service'],
      general: ['Replacement item', 'Installation service', 'Mounting/connection hardware', 'Disposal coordination']
    }
  };

  const category = item.category in baseResources[recommendation] ? item.category : 'general';
  return baseResources[recommendation][category as keyof typeof baseResources.fix];
};

const generateEstimatedTimeline = (item: InventoryItem, recommendation: 'fix' | 'replace'): string => {
  const timelines = {
    fix: {
      electrical: '1-2 business days',
      plumbing: '0.5-1 business day',
      hvac: '1-3 business days',
      general: '0.5-1 business day'
    },
    replace: {
      electrical: '1-2 weeks (including procurement)',
      plumbing: '3-5 business days (including procurement)',
      hvac: '2-4 weeks (including procurement and installation)',
      general: '1-2 weeks (including procurement)'
    }
  };

  const category = item.category in timelines[recommendation] ? item.category : 'general';
  return timelines[recommendation][category as keyof typeof timelines.fix];
};