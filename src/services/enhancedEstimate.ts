// services/enhancedEstimate.ts
import { InventoryItem, DetailedEstimate, UserLocation } from '../types';
import { calculateItemDepreciation, getTradeDepreciationRate, getTradeLifetime } from '../utils/depreciationCalculator';
import { createEnhancedEstimateAgent } from '../agent/enhancedEstimateAgent';
import { run } from '@openai/agents';

export interface EnhancedEstimateLineItem {
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: string;
  location?: string;
  originalCost: number;
  currentAge: number;
  depreciatedValue: number;
  adjustedValue: number;
  conditionPenalty: number;
  expectedLifetime: number;
  annualDepreciationRate: number;
  laborRate: number;
  fix?: {
    laborHours: number;
    laborRate: number;
    partsCost: number;
    totalCost: number;
  };
  replace?: {
    laborHours: number;
    laborRate: number;
    partsCost: number;
    totalCost: number;
  };
  recommendedAction: 'Fix' | 'Replace';
  reclassificationReason?: string;
  instructions?: {
    fix?: string[];
    replace?: string[];
  };
}

export interface EnhancedDetailedEstimate {
  line_items: EnhancedEstimateLineItem[];
  summary: {
    totalOriginalCost: number;
    totalDepreciatedValue: number;
    totalAdjustedValue: number;
    totalFixCost: number;
    totalReplaceCost: number;
    totalRecommendedCost: number;
    overallRecommendation: string;
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
    reclassifiedItems: number;
  };
  metadata: {
    estimateDate: string;
    currency: string;
    location: string;
    depreciationMethod: string;
    analysisSteps: string[];
    user_location: UserLocation;
    generated_date: string;
    disclaimer: string;
  };
}

async function callEnhancedBackendAPI(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD'
): Promise<EnhancedDetailedEstimate | null> {
  try {
    console.log('🔄 Calling enhanced backend estimate API...', { 
      inventoryCount: inventoryItems.length, 
      userLocation,
      currency 
    });

    const resp = await fetch('/api/enhanced-estimate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': 'dev_api_key_example'
      },
      body: JSON.stringify({ inventoryItems, userLocation, currency }),
    });

    if (!resp.ok) {
      console.warn('❌ Enhanced backend API returned non-OK', resp.status);
      return null;
    }

    const json = await resp.json();
    console.log('✅ Enhanced backend API success');
    return json as EnhancedDetailedEstimate;
  } catch (err) {
    console.warn('❌ Failed to call enhanced backend API', err);
    return null;
  }
}

export async function generateEnhancedRepairEstimate(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD',
  onProgress?: (step: string) => void
): Promise<EnhancedDetailedEstimate> {
  console.log('🏁 Starting enhanced repair estimate generation');
  
  if (onProgress) {
    onProgress('Analysis and estimate generation has begun...');
  }

  // Try enhanced backend first
  const backendResult = await callEnhancedBackendAPI(inventoryItems, userLocation, currency);
  if (backendResult) {
    if (onProgress) {
      onProgress('Process concluded successfully!');
    }
    return backendResult;
  }

  console.log('⚠️ Enhanced backend failed, using local enhanced processing');

  // Enhanced local processing with 6-step method
  const enhancedLineItems: EnhancedEstimateLineItem[] = [];
  let totalOriginalCost = 0;
  let totalDepreciatedValue = 0;
  let totalAdjustedValue = 0;
  let reclassifiedItems = 0;

  for (const item of inventoryItems) {
    // Step 3: Calculate depreciation
    const depreciationRate = getTradeDepreciationRate(item.category);
    const depreciation = calculateItemDepreciation(item, depreciationRate);
    
    // Step 6: Get expected lifetime
    const expectedLifetime = getTradeLifetime(item.category);
    
    // Determine if reclassification occurred
    const reclassificationReason = depreciation.reclassificationNeeded 
      ? 'Depreciated value reached zero - reclassified from fix to replace'
      : undefined;
    
    if (depreciation.reclassificationNeeded) {
      reclassifiedItems++;
    }

    // Mock labor rates and costs (would be replaced by agent calls in full implementation)
    const laborRate = getLaborRateByTrade(item.category);
    const fixCosts = calculateFixCosts(item, laborRate);
    const replaceCosts = calculateReplaceCosts(item, laborRate);

    const lineItem: EnhancedEstimateLineItem = {
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category,
      currentCondition: item.currentCondition,
      location: item.location,
      originalCost: item.originalCost,
      currentAge: depreciation.currentAge,
      depreciatedValue: depreciation.depreciatedValue,
      adjustedValue: depreciation.adjustedValue,
      conditionPenalty: depreciation.conditionPenalty,
      expectedLifetime,
      annualDepreciationRate: depreciationRate,
      laborRate,
      fix: fixCosts,
      replace: replaceCosts,
      recommendedAction: depreciation.recommendedAction === 'fix' ? 'Fix' : 'Replace',
      reclassificationReason,
      instructions: {
        fix: [
          `Assess ${item.itemName} condition and depreciation status`,
          `Perform necessary repairs considering ${depreciation.conditionPenalty * 100}% condition penalty`,
          'Test functionality and verify repair quality',
          'Document maintenance for future depreciation calculations'
        ],
        replace: [
          `Remove old ${item.itemName} (original cost: $${item.originalCost})`,
          `Install new ${item.itemName} with updated specifications`,
          'Test installation and verify proper operation',
          'Update maintenance records and warranty information'
        ]
      }
    };

    enhancedLineItems.push(lineItem);
    totalOriginalCost += item.originalCost;
    totalDepreciatedValue += depreciation.depreciatedValue;
    totalAdjustedValue += depreciation.adjustedValue;
  }

  const totalFixCost = enhancedLineItems.reduce((sum, item) => sum + (item.fix?.totalCost || 0), 0);
  const totalReplaceCost = enhancedLineItems.reduce((sum, item) => sum + (item.replace?.totalCost || 0), 0);
  const totalRecommendedCost = enhancedLineItems.reduce((sum, item) =>
    sum + (item.recommendedAction === 'Fix' ? (item.fix?.totalCost || 0) : (item.replace?.totalCost || 0)), 0);

  const result: EnhancedDetailedEstimate = {
    line_items: enhancedLineItems,
    summary: {
      totalOriginalCost,
      totalDepreciatedValue,
      totalAdjustedValue,
      totalFixCost,
      totalReplaceCost,
      totalRecommendedCost,
      overallRecommendation: `Analyzed ${inventoryItems.length} items with depreciation and condition adjustments. ${reclassifiedItems} items reclassified from fix to replace.`,
      total_labor_cost: enhancedLineItems.reduce((sum, item) =>
        sum + (item.recommendedAction === 'Fix'
          ? (item.fix?.laborHours || 0) * (item.fix?.laborRate || 0)
          : (item.replace?.laborHours || 0) * (item.replace?.laborRate || 0)), 0),
      total_material_cost: enhancedLineItems.reduce((sum, item) =>
        sum + (item.recommendedAction === 'Fix'
          ? (item.fix?.partsCost || 0)
          : (item.replace?.partsCost || 0)), 0),
      total_project_cost: totalRecommendedCost,
      items_to_repair: enhancedLineItems.filter(item => item.recommendedAction === 'Fix').length,
      items_to_replace: enhancedLineItems.filter(item => item.recommendedAction === 'Replace').length,
      reclassifiedItems
    },
    metadata: {
      estimateDate: new Date().toISOString(),
      currency,
      location: `${userLocation.city}, ${userLocation.region}`,
      depreciationMethod: 'Trade-specific with condition adjustments',
      analysisSteps: [
        'Step 1: Labor rate research by trade',
        'Step 2: Current market price research',
        'Step 3: Depreciation calculation per trade',
        'Step 4: Condition status adjustments (15% increments)',
        'Step 5: Original cost basis evaluation',
        'Step 6: Lifetime analysis per trade'
      ],
      user_location: userLocation,
      generated_date: new Date().toISOString(),
      disclaimer: 'Enhanced estimate using depreciation analysis and condition-based adjustments with trade-specific parameters.'
    }
  };

  if (onProgress) {
    onProgress('Process concluded successfully!');
  }

  return result;
}

function getLaborRateByTrade(trade: string): number {
  const rates: Record<string, number> = {
    plumbing: 100,
    electrical: 95,
    hvac: 90,
    flooring: 85,
    locksmith: 110,
    painter: 70,
    carpentry: 80,
    roofing: 90,
    fencing: 75,
    landscaping: 65,
    'pest control': 60,
    foundation: 120,
    general: 85
  };
  return rates[trade.toLowerCase()] || rates.general;
}

function calculateFixCosts(item: InventoryItem, laborRate: number) {
  const baseHours = item.currentCondition === 'Non-functional' ? 4 : 
                   item.currentCondition === 'Poor' ? 3 :
                   item.currentCondition === 'Fair' ? 2 : 1.5;
  
  const partsCost = item.currentCondition === 'Non-functional' ? item.originalCost * 0.4 :
                   item.currentCondition === 'Poor' ? item.originalCost * 0.3 :
                   item.currentCondition === 'Fair' ? item.originalCost * 0.2 : 
                   item.originalCost * 0.1;

  return {
    laborHours: baseHours,
    laborRate,
    partsCost,
    totalCost: (baseHours * laborRate) + partsCost
  };
}

function calculateReplaceCosts(item: InventoryItem, laborRate: number) {
  const replaceHours = 3; // Standard replacement time
  const newItemCost = item.originalCost * 1.1; // 10% inflation factor

  return {
    laborHours: replaceHours,
    laborRate,
    partsCost: newItemCost,
    totalCost: (replaceHours * laborRate) + newItemCost
  };
}