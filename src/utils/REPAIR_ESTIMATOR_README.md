# Advanced Repair Cost Estimator

This module provides a sophisticated AI-powered repair cost estimation system that uses real-time web search to find current market rates for labor and materials.

## Features

- **Real Market Data**: Uses webSearchTool to find current labor rates and material costs
- **Location-Aware**: Configurable user location for accurate regional pricing
- **Repair vs Replace Analysis**: Compares costs and recommends the most economical option
- **Detailed Breakdowns**: Separate labor, material, and total costs for each item
- **Professional Instructions**: Step-by-step repair/replacement guidance
- **Comprehensive Reporting**: Summary totals and project overview

## Key Interfaces

### UserLocation
```typescript
interface UserLocation {
  city: string;
  region: string; 
  country: string;
  type: 'approximate';
}
```

### EstimateLineItem
```typescript
interface EstimateLineItem {
  item_description: string;
  location: string;
  issue_type: string;
  recommendation: 'fix' | 'replace';
  repair_costs: {
    labor_cost: number;
    material_cost: number;
    total_cost: number;
  };
  replacement_costs: {
    labor_cost: number;
    material_cost: number;
    total_cost: number;
  };
  recommended_option: {
    action: 'fix' | 'replace';
    labor_cost: number;
    material_cost: number;
    total_cost: number;
    cost_savings?: number;
  };
  repair_steps: string[];
  notes?: string;
}
```

### DetailedEstimate
```typescript
interface DetailedEstimate {
  line_items: EstimateLineItem[];
  summary: {
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
  };
  metadata: {
    user_location: UserLocation;
    currency: string;
    generated_date: string;
    disclaimer: string;
  };
}
```

## Usage

### Basic Usage
```typescript
import { generateDetailedRepairEstimate } from '../services/generateEstimate';

const userLocation = {
  city: 'Wichita',
  region: 'Kansas',
  country: 'US',
  type: 'approximate' as const
};

const inventoryItems = [
  {
    itemId: 'item-001',
    itemName: 'Kitchen Faucet',
    category: 'plumbing',
    currentCondition: 'Poor',
    purchaseDate: '2020-01-15',
    originalCost: 250,
    location: 'Kitchen'
    // ... other required fields
  }
];

const estimate = await generateDetailedRepairEstimate(
  inventoryItems,
  userLocation,
  'USD'
);
```

### Legacy Compatibility
The system maintains backward compatibility with the existing `runRepairEstimatorAgent` function:

```typescript
import { runRepairEstimatorAgent } from '../services/generateEstimate';

const result = await runRepairEstimatorAgent(
  inventoryItems,
  'Wichita, Kansas',
  'USD'
);
```

## How It Works

### 1. Cost Research Tools
The agent uses specialized tools to search for current market data:

- **Labor Cost Search**: Finds hourly rates for specific trades (electricians, plumbers, HVAC techs)
- **Material Cost Search**: Searches for current prices from major retailers and suppliers  
- **Repair Instructions Search**: Gathers professional repair/installation guidelines

### 2. Analysis Process
For each inventory item, the agent:

1. Determines the type of work required based on condition and category
2. Searches for current local labor rates for the appropriate trade
3. Searches for current material/parts costs
4. Calculates both repair and replacement costs
5. Recommends the most cost-effective option
6. Provides detailed step-by-step instructions

### 3. Cost Comparison
The system analyzes:
- **Repair Option**: Cost to fix the existing item
- **Replacement Option**: Cost to replace with new equipment
- **Recommendation**: Most economical choice with potential savings

## Output Format

The system generates comprehensive estimates with:

### Line Item Details
- Item description and location
- Issue type and recommended action
- Cost breakdown for both repair and replacement options
- Recommended option with cost savings
- Step-by-step repair instructions
- Additional notes and context

### Project Summary
- Total labor costs across all items
- Total material costs across all items
- Overall project cost
- Count of items to repair vs replace

### Metadata
- User location for pricing context
- Currency used
- Generation timestamp
- Pricing disclaimer

## Example Output

```
=== DETAILED REPAIR ESTIMATE ===
Location: Wichita, Kansas
Generated: 7/27/2025
Currency: USD

LINE ITEMS:
================================================================================
1. Kitchen Faucet (Kitchen)
   Issue: Leak at base due to poor condition
   Recommendation: REPLACE

   REPAIR OPTION:
   - Labor: $120.00
   - Materials: $45.00
   - Total: $165.00

   REPLACEMENT OPTION:
   - Labor: $80.00
   - Materials: $180.00
   - Total: $260.00

   RECOMMENDED OPTION:
   - Action: REPAIR
   - Labor: $120.00
   - Materials: $45.00
   - Total: $165.00
   - Savings: $95.00

   REPAIR STEPS:
   1. Turn off water supply valves
   2. Remove old cartridge and O-rings
   3. Install new cartridge and seals
   4. Test for proper operation and leaks

PROJECT SUMMARY:
========================================
Total Labor Cost: $120.00
Total Material Cost: $45.00
TOTAL PROJECT COST: $165.00

Items to Repair: 1
Items to Replace: 0
```

## Configuration

### Environment Variables
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### User Location
The system supports any location but requires:
- City name
- State/Region name  
- Country (currently optimized for 'US')
- Type must be 'approximate'

## Error Handling

The system includes comprehensive error handling for:
- Missing API keys
- Invalid user locations
- Search tool failures
- Malformed agent responses
- Network connectivity issues

## Performance Considerations

- Each estimate requires multiple web searches
- Response time depends on search complexity
- Consider caching results for repeated items
- Rate limiting may apply based on search volume

## Disclaimer

Cost estimates are based on current market research and may vary. Actual costs may differ based on:
- Specific site conditions
- Contractor availability
- Material quality preferences
- Local building codes
- Seasonal pricing variations

Always obtain multiple quotes for large projects.
