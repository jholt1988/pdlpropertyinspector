"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepairEstimatorAgent = createRepairEstimatorAgent;
// agent/repairEstimatorAgent.ts
const agents_1 = require("@openai/agents");
const laborCostTool_1 = require("../tools/laborCostTool");
const materialCostTool_1 = require("../tools/materialCostTool");
const repairInstructionsTool_1 = require("../tools/repairInstructionsTool");
function createRepairEstimatorAgent(userLocation) {
    return new agents_1.Agent({
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
            (0, laborCostTool_1.createLaborCostTool)(userLocation),
            (0, materialCostTool_1.createMaterialCostTool)(userLocation),
            (0, repairInstructionsTool_1.createRepairInstructionsTool)(userLocation),
            (0, agents_1.webSearchTool)({ userLocation })
        ]
    });
}
