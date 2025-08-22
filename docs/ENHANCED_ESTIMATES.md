# Enhanced Project Estimate Components

This document describes the new enhanced project estimate system that implements a comprehensive 6-step analysis process with depreciation calculations, condition adjustments, and trade-specific cost analysis.

## Overview

The enhanced estimate system provides a sophisticated approach to property repair and replacement cost estimation by incorporating:

- **Trade-specific depreciation rates** based on industry standards
- **Condition-based adjustments** with incremental penalty system
- **Automatic reclassification** from repair to replacement when economically justified
- **Real-time progress notifications** during analysis
- **Comprehensive cost breakdowns** with original vs. depreciated values

## 6-Step Analysis Process

### Step 1: Labor Rate Research
- Searches for average per-hour labor rates by specific trade
- Supported trades: plumbing, electrical, HVAC, flooring, locksmith, painter, carpentry, roofing, fencing, landscaping, pest control, foundation
- Uses industry-standard sources and regional databases

### Step 2: Material Cost Research  
- Retrieves current market pricing for materials and components
- Integrates with major retailer and supplier databases
- Provides real-time cost updates

### Step 3: Depreciation Calculation
- Implements trade-specific annual depreciation rates:
  - **HVAC**: 12% per year
  - **Plumbing**: 8% per year  
  - **Electrical**: 10% per year
  - **Flooring**: 15% per year
  - **Foundation**: 2% per year
  - **Landscaping**: 25% per year
  - And more...

### Step 4: Condition Status Adjustments
Applies incremental penalties based on item condition:
- **Excellent**: 0% additional depreciation
- **Good**: 15% additional depreciation
- **Fair**: 30% additional depreciation  
- **Poor**: 45% additional depreciation

**Auto-reclassification**: If depreciated value reaches zero, items are automatically reclassified from "fix" to "replace".

### Step 5: Original Cost Basis
- Calculates values based on original purchase cost
- Presents depreciated values alongside original costs
- Provides cost-benefit analysis for repair vs. replacement decisions

### Step 6: Lifetime Analysis
- Determines average expected lifetime by trade:
  - **Foundation**: 50 years
  - **Electrical**: 25 years
  - **Plumbing**: 20 years
  - **HVAC**: 15 years
  - **Landscaping**: 3 years
  - **Pest Control**: 1 year

## Usage

### Basic Implementation

```typescript
import { generateEnhancedRepairEstimate } from './services/enhancedEstimate';
import { useToast } from './hooks/useToast';

const { showAnalysisStarted, showAnalysisCompleted } = useToast();

const estimate = await generateEnhancedRepairEstimate(
  inventoryItems,
  userLocation,
  'USD',
  (step: string) => {
    console.log('Progress:', step);
  }
);
```

### Enhanced Data Input Component

```typescript
import EnhancedDataInput from './components/RepairPlan/EnhancedDataInput';

<EnhancedDataInput
  inventoryData={inventoryData}
  setInventoryData={setInventoryData}
  setAnalysisResults={setAnalysisResults}
  setEnhancedResults={setEnhancedResults}
  userLocation={userLocation}
/>
```

## API Reference

### Enhanced Estimate Line Item

```typescript
interface EnhancedEstimateLineItem {
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: string;
  originalCost: number;
  currentAge: number;
  depreciatedValue: number;
  adjustedValue: number;
  conditionPenalty: number;
  expectedLifetime: number;
  annualDepreciationRate: number;
  laborRate: number;
  recommendedAction: 'Fix' | 'Replace';
  reclassificationReason?: string;
  // ... additional fields
}
```

### Enhanced Summary

```typescript
interface EnhancedSummary {
  totalOriginalCost: number;
  totalDepreciatedValue: number;
  totalAdjustedValue: number;
  totalRecommendedCost: number;
  items_to_repair: number;
  items_to_replace: number;
  reclassifiedItems: number;
  // ... additional fields
}
```

## Toast Notification System

The system includes a comprehensive toast notification system for user feedback:

```typescript
const { 
  showToast, 
  showAnalysisStarted, 
  showAnalysisCompleted,
  toasts,
  removeToast 
} = useToast();

// Show progress
const progressId = showAnalysisStarted(); // "Analysis and estimate generation has begun..."

// Show completion
showAnalysisCompleted(); // "Process concluded successfully!"

// Custom notifications
showToast('Custom message', 'success', 5000);
```

## Testing

The enhanced system includes comprehensive test coverage:

- **Depreciation Calculator Tests**: Validate condition penalties and reclassification logic
- **Toast System Tests**: Verify notification timing and behavior
- **Enhanced Estimate Tests**: End-to-end estimation workflow validation

Run tests with:
```bash
npm test
```

## Configuration

### Trade-Specific Settings

Depreciation rates and lifetimes can be customized in `src/utils/depreciationCalculator.ts`:

```typescript
const tradeRates: Record<string, number> = {
  plumbing: 0.08,      // 8% per year
  electrical: 0.10,    // 10% per year
  hvac: 0.12,         // 12% per year
  // ... additional trades
};

const tradeLifetimes: Record<string, number> = {
  plumbing: 20,       // 20 years
  electrical: 25,     // 25 years
  hvac: 15,          // 15 years
  // ... additional trades
};
```

### Condition Penalties

Modify condition-based adjustments in `src/utils/depreciationCalculator.ts`:

```typescript
export const CONDITION_PENALTIES: ConditionAdjustment = {
  excellent: 0.00,  // 0% penalty
  good: 0.15,       // 15% penalty
  fair: 0.30,       // 30% penalty
  poor: 0.45        // 45% penalty
};
```

## Integration Points

### Backend Integration

The system is designed to work with both backend agents and local fallback processing:

```typescript
// Backend API endpoint for enhanced estimates
POST /api/enhanced-estimate
{
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency: string
}
```

### Legacy Compatibility

The enhanced system maintains backward compatibility with existing estimate workflows through format conversion utilities.

## Future Enhancements

- **Machine Learning Integration**: Predictive depreciation based on usage patterns
- **Regional Cost Variations**: Location-specific pricing adjustments
- **Seasonal Factors**: Time-based cost fluctuations
- **Bulk Analysis Optimization**: Performance improvements for large inventories
- **Custom Trade Categories**: User-defined trade types and rates