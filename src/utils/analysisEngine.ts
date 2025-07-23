import { InventoryItem, FlaggedItem, AnalysisResult, SystemConfig } from '../types';

export const analyzeInventory = (inventory: InventoryItem[], config: SystemConfig): AnalysisResult => {
  const flaggedItems: FlaggedItem[] = [];
  const currentDate = new Date();
  
  let conditionFlags = 0;
  let lifecycleFlags = 0;
  let maintenanceFlags = 0;

  inventory.forEach(item => {
    const flagReasons: string[] = [];
    let recommendation: 'fix' | 'replace' = 'fix';
    let estimatedRepairCost = 0;
    let estimatedReplacementCost = 0;
    let flagReason: 'condition' | 'lifecycle' | 'maintenance' = 'condition';
    let flagDetails = '';

    // Check condition-based flags
    const poorConditions = ['Poor', 'Damaged', 'Non-functional'];
    if (poorConditions.includes(item.currentCondition)) {
      flagReasons.push(`condition: ${item.currentCondition}`);
      flagReason = 'condition';
      conditionFlags++;
    }

    // Check lifecycle-based flags
    const purchaseDate = new Date(item.purchaseDate);
    const monthsSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedLifespan = config.expectedLifespans[item.category] || config.expectedLifespans.general;
    
    if (monthsSincePurchase >= expectedLifespan * 0.8) {
      flagReasons.push(`lifecycle: approaching/exceeding expected lifespan (${monthsSincePurchase}/${expectedLifespan} months)`);
      if (flagReason === 'condition') {
        flagReason = 'lifecycle';
        lifecycleFlags++;
      }
    }

    // Check maintenance-based flags
    if (item.lastMaintenanceDate) {
      const lastMaintenanceDate = new Date(item.lastMaintenanceDate);
      const monthsSinceMaintenance = Math.floor((currentDate.getTime() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const maintenanceThreshold = config.maintenanceThresholds[item.category] || config.maintenanceThresholds.general || 24;
      
      if (monthsSinceMaintenance > maintenanceThreshold) {
        flagReasons.push(`maintenance: overdue by ${monthsSinceMaintenance - maintenanceThreshold} months`);
        if (flagReason !== 'condition') {
          flagReason = 'maintenance';
          maintenanceFlags++;
        }
      }
    }

    // Only process items with flags
    if (flagReasons.length === 0) return;

    // Calculate costs
    const laborRate = config.laborRates[item.category] || config.laborRates.general;
    const itemValue = item.currentMarketValue || item.originalCost;

    // Estimate repair cost based on condition and category
    let repairHours = 2; // Base hours
    switch (item.currentCondition) {
      case 'Poor':
        repairHours = 4;
        break;
      case 'Damaged':
        repairHours = 6;
        break;
      case 'Non-functional':
        repairHours = 8;
        break;
    }

    const laborCost = laborRate * repairHours;
    const partsCost = itemValue * 0.2; // Estimate 20% of item value for parts
    estimatedRepairCost = laborCost + partsCost;

    // Estimate replacement cost
    const newUnitCost = itemValue * 1.1; // Assume 10% price increase for new units
    const installationCost = laborRate * 2; // 2 hours for installation
    const disposalCost = 50; // Standard disposal fee
    estimatedReplacementCost = newUnitCost + installationCost + disposalCost;

    // Apply repair threshold logic
    const repairRatio = estimatedRepairCost / itemValue;
    recommendation = repairRatio > config.repairThreshold ? 'replace' : 'fix';

    // Generate detailed information
    flagDetails = `Item flagged due to ${flagReasons.join(', ')}. ` +
      `Cost analysis: repair ($${estimatedRepairCost.toLocaleString()}) vs replace ($${estimatedReplacementCost.toLocaleString()}) ` +
      `against item value of $${itemValue.toLocaleString()}.`;

    const repairSteps = generateRepairSteps(item, recommendation);
    const requiredResources = generateRequiredResources(item, recommendation);
    const estimatedTimeline = generateEstimatedTimeline(item, recommendation);

    const flaggedItem: FlaggedItem = {
      ...item,
      flagReason,
      flagDetails,
      recommendation,
      estimatedRepairCost,
      estimatedReplacementCost,
      repairSteps,
      requiredResources,
      estimatedTimeline,
      costBreakdown: {
        labor: laborCost,
        parts: recommendation === 'fix' ? partsCost : newUnitCost,
        installation: recommendation === 'replace' ? installationCost : undefined,
        disposal: recommendation === 'replace' ? disposalCost : undefined
      }
    };

    flaggedItems.push(flaggedItem);
  });

  const itemsToFix = flaggedItems.filter(item => item.recommendation === 'fix');
  const itemsToReplace = flaggedItems.filter(item => item.recommendation === 'replace');
  
  const totalEstimatedCost = flaggedItems.reduce((sum, item) => {
    return sum + (item.recommendation === 'fix' ? item.estimatedRepairCost! : item.estimatedReplacementCost!);
  }, 0);

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

const generateRepairSteps = (item: InventoryItem, recommendation: 'fix' | 'replace'): string[] => {
  const baseSteps = {
    fix: {
      electrical: [
        'Conduct safety inspection and power isolation',
        'Diagnose specific electrical fault',
        'Replace faulty components or wiring',
        'Test functionality and safety compliance',
        'Document maintenance and update records'
      ],
      plumbing: [
        'Isolate water supply to affected area',
        'Assess extent of plumbing issue',
        'Replace or repair damaged pipes/fixtures',
        'Test for leaks and proper water pressure',
        'Restore water supply and document work'
      ],
      hvac: [
        'Shut down HVAC system safely',
        'Inspect and clean all components',
        'Replace worn or damaged parts',
        'Calibrate system controls and sensors',
        'Test system operation and efficiency'
      ],
      general: [
        'Assess current condition and damage extent',
        'Gather necessary tools and replacement parts',
        'Perform repair according to manufacturer guidelines',
        'Test functionality and safety',
        'Update maintenance records'
      ]
    },
    replace: {
      electrical: [
        'Source equivalent or upgraded electrical component',
        'Schedule certified electrician for installation',
        'Safely remove existing equipment',
        'Install new equipment per electrical codes',
        'Test and commission new installation'
      ],
      plumbing: [
        'Procure replacement plumbing fixture/component',
        'Schedule licensed plumber for installation',
        'Remove old plumbing equipment',
        'Install new component with proper connections',
        'Test system and verify compliance with codes'
      ],
      hvac: [
        'Select appropriate replacement HVAC equipment',
        'Coordinate with HVAC contractor for installation',
        'Remove and dispose of old equipment properly',
        'Install new equipment with proper connections',
        'Commission system and verify performance'
      ],
      general: [
        'Identify suitable replacement item',
        'Coordinate procurement and delivery',
        'Remove existing item safely',
        'Install replacement item properly',
        'Verify functionality and document installation'
      ]
    }
  };

  const category = item.category in baseSteps[recommendation] ? item.category : 'general';
  return baseSteps[recommendation][category as keyof typeof baseSteps.fix];
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