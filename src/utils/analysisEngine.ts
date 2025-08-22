import {
  InventoryItem,
  FlaggedItem,
  AnalysisResult,
  SystemConfig,
  UserLocation
} from '../types';
import { generateDetailedRepairEstimate } from '../services/generateEstimate';

export const analyzeInventoryAndGeneratePlan = async (
  inventory: InventoryItem[],
  config: SystemConfig
): Promise<AnalysisResult> => {
  const flaggedItems: FlaggedItem[] = [];
  const currentDate = new Date();

  let conditionFlags = 0;
  let lifecycleFlags = 0;
  let maintenanceFlags = 0;

  const itemsToEstimate: { item: InventoryItem; flagReason: 'condition' | 'lifecycle' | 'maintenance'; flagDetails: string[]; actionOverride?: 'fix' | 'replace' }[] = [];

  inventory.forEach(item => {
    const flagReasons: string[] = [];
    let flagReason: 'condition' | 'lifecycle' | 'maintenance' | null = null;

    // Check condition-based flags
    const poorConditions = ['Poor', 'Damaged', 'Non-functional'];
    if (poorConditions.includes(item.currentCondition)) {
      flagReasons.push(`condition: ${item.currentCondition}`);
      flagReason = 'condition';
      conditionFlags++;
    }

    // Check lifecycle-based flags using age vs expected lifespan
    const purchaseDate = new Date(item.purchaseDate);
    const monthsSincePurchase = Math.floor(
      (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const expectedLifespan = config.expectedLifespans[item.category] || config.expectedLifespans.general;
    const ageRatio = monthsSincePurchase / expectedLifespan;
    let actionOverride: 'fix' | 'replace' | undefined;

    if (ageRatio >= 0.8) {
      flagReasons.push(`lifecycle: ${monthsSincePurchase}/${expectedLifespan} months`);
      actionOverride = 'replace';
      if (flagReason !== 'condition') {
        flagReason = 'lifecycle';
      }
      lifecycleFlags++;
    } else if (ageRatio >= 0.5) {
      flagReasons.push(`lifecycle: ${monthsSincePurchase}/${expectedLifespan} months`);
      actionOverride = 'fix';
      if (flagReason !== 'condition') {
        flagReason = 'lifecycle';
      }
      lifecycleFlags++;
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
        if (!flagReason || (flagReason !== 'condition' && flagReason !== 'lifecycle')) {
          flagReason = 'maintenance';
          maintenanceFlags++;
        }
      }
    }

    if (flagReasons.length > 0 && flagReason) {
      itemsToEstimate.push({ item, flagReason, flagDetails: flagReasons, actionOverride });
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
    city: 'Default City',
    region: 'Default Region', 
    country: 'US',
    type: 'approximate'
  };

  const estimate = await generateDetailedRepairEstimate(itemsToEstimate.map(i => i.item), userLocation);

  estimate.line_items.forEach(lineItem => {
    const match = itemsToEstimate.find(i => i.item.itemName === lineItem.itemName);
    if (!match) return;
    const { item: originalItem, flagReason, flagDetails, actionOverride } = match;

    const recommendation = (actionOverride || (typeof lineItem.recommendedAction === 'string' ? lineItem.recommendedAction.toLowerCase() : undefined)) as 'fix' | 'replace';
    const flaggedItem: FlaggedItem = {
      ...originalItem,
      flagReason,
      flagDetails: flagDetails.join('; '),
      recommendation,
      estimatedRepairCost: recommendation === 'fix' ? lineItem.fix?.totalCost : undefined,
      estimatedReplacementCost: recommendation === 'replace' ? lineItem.replace?.totalCost : undefined,
      repairSteps: recommendation === 'fix' ? lineItem.instructions?.fix : lineItem.instructions?.replace,
      requiredResources: generateRequiredResources(originalItem, recommendation),
      estimatedTimeline: generateEstimatedTimeline(originalItem, recommendation),
      costBreakdown: {
        labor: recommendation === 'fix'
          ? (lineItem.fix?.laborHours || 0) * (lineItem.fix?.laborRate || 0)
          : (lineItem.replace?.laborHours || 0) * (lineItem.replace?.laborRate || 0),
        parts: recommendation === 'fix'
          ? lineItem.fix?.partsCost
          : lineItem.replace?.partsCost
      }
    };
    flaggedItems.push(flaggedItem);
  });

  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');
  const totalEstimatedCost = estimate.summary?.total_project_cost ?? flaggedItems.reduce((sum, item) =>
    sum + (item.recommendation === 'fix'
      ? (item.estimatedRepairCost || 0)
      ? (Number.isFinite(item.estimatedRepairCost) ? item.estimatedRepairCost as number : 0)
      : (Number.isFinite(item.estimatedReplacementCost) ? item.estimatedReplacementCost as number : 0)), 0);

  return {
    totalItems: inventory.length,
    flaggedItems,
    itemsToFix,
    itemsToReplace,
    totalEstimatedCost,
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