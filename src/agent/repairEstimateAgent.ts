// agent/repairEstimatorAgent.ts
import { Agent, webSearchTool } from '@openai/agents';
import { UserLocation } from '../types';
import { createLaborCostTool } from '../tools/laborCostTool';
import { createMaterialCostTool } from '../tools/materialCostTool';
import { createRepairInstructionsTool } from '../tools/repairInstructionsTool';

export function createRepairEstimatorAgent(userLocation: UserLocation): Agent {
  return new Agent({
    name: 'Advanced Property Repair Estimator',
    model: 'o4-mini',
    instructions: `
You are a property repair estimator. For each inventory item:
1. Search for local labor rates 
2. Search for local material costs
3. Compare fix vs replace
4. Recommend the cheaper option
5. Provide step-by-step instructions including time estimates
6. List Required tools and materials
7. Provide a detailed breakdown of costs that includes: installation, labor, materials, and disposal
8. Include estimated time to complete each line item
Respond with structured JSON including line_items, summary, and metadata.
Data should be normalized in the following format: "{itemId: inventoryItem?.itemId || item.itemId,
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
    flagDetails: \`\${item.recommendedAction} recommended based on current condition and cost analysis\`,
    
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
  };"`,
    tools: [
      createLaborCostTool(userLocation),
      createMaterialCostTool(userLocation),
      createRepairInstructionsTool(userLocation),
      webSearchTool({ userLocation })
    ]
  });
}
