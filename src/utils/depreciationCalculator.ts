// utils/depreciationCalculator.ts
import { InventoryItem } from '../types';

export interface DepreciationCalculation {
  originalCost: number;
  currentAge: number;
  depreciatedValue: number;
  adjustedValue: number;
  conditionPenalty: number;
  reclassificationNeeded: boolean;
  recommendedAction: 'fix' | 'replace';
}

export interface ConditionAdjustment {
  excellent: number; // 0% penalty
  good: number;      // 15% penalty
  fair: number;      // 30% penalty
  poor: number;      // 45% penalty
}

export const CONDITION_PENALTIES: ConditionAdjustment = {
  excellent: 0.00,
  good: 0.15,
  fair: 0.30,
  poor: 0.45
};

export function calculateItemDepreciation(
  item: InventoryItem,
  annualDepreciationRate: number
): DepreciationCalculation {
  const purchaseDate = new Date(item.purchaseDate);
  const currentDate = new Date();
  const ageInYears = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  // Calculate base depreciation (excellent condition)
  const baseDepreciation = item.originalCost * annualDepreciationRate * ageInYears;
  const depreciatedValue = Math.max(0, item.originalCost - baseDepreciation);
  
  // Apply condition penalty
  const conditionMapping: Record<string, keyof ConditionAdjustment> = {
    'excellent': 'excellent',
    'good': 'good', 
    'fair': 'fair',
    'poor': 'poor',
    'damaged': 'poor',
    'non-functional': 'poor'
  };
  
  const conditionKey = conditionMapping[item.currentCondition.toLowerCase()] || 'poor';
  const conditionPenalty = CONDITION_PENALTIES[conditionKey];
  
  // Additional depreciation due to condition
  const conditionDepreciation = depreciatedValue * conditionPenalty;
  const adjustedValue = Math.max(0, depreciatedValue - conditionDepreciation);
  
  // Determine if reclassification from "fix" to "replace" is needed
  const reclassificationNeeded = adjustedValue <= 0;
  const recommendedAction = reclassificationNeeded ? 'replace' : 'fix';
  
  return {
    originalCost: item.originalCost,
    currentAge: ageInYears,
    depreciatedValue,
    adjustedValue,
    conditionPenalty,
    reclassificationNeeded,
    recommendedAction
  };
}

export function getTradeDepreciationRate(trade: string): number {
  // Default depreciation rates by trade (annual rates)
  const tradeRates: Record<string, number> = {
    plumbing: 0.08,      // 8% per year
    electrical: 0.10,    // 10% per year
    hvac: 0.12,         // 12% per year
    flooring: 0.15,     // 15% per year
    locksmith: 0.05,    // 5% per year
    painter: 0.20,      // 20% per year (paint/finishes)
    carpentry: 0.06,    // 6% per year
    roofing: 0.07,      // 7% per year
    fencing: 0.09,      // 9% per year
    landscaping: 0.25,  // 25% per year (plants/seasonal)
    'pest control': 0.30, // 30% per year (treatments)
    foundation: 0.02,   // 2% per year (structural)
    general: 0.10       // 10% per year (default)
  };
  
  return tradeRates[trade.toLowerCase()] || tradeRates.general;
}

export function getTradeLifetime(trade: string): number {
  // Expected lifetimes by trade (in years)
  const tradeLifetimes: Record<string, number> = {
    plumbing: 20,       // 20 years
    electrical: 25,     // 25 years
    hvac: 15,          // 15 years
    flooring: 10,      // 10 years
    locksmith: 30,     // 30 years
    painter: 5,        // 5 years (paint/finishes)
    carpentry: 25,     // 25 years
    roofing: 20,       // 20 years
    fencing: 15,       // 15 years
    landscaping: 3,    // 3 years (plants/seasonal)
    'pest control': 1, // 1 year (treatments)
    foundation: 50,    // 50 years (structural)
    general: 15        // 15 years (default)
  };
  
  return tradeLifetimes[trade.toLowerCase()] || tradeLifetimes.general;
}