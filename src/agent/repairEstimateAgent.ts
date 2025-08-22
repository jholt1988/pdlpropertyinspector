// agent/repairEstimatorAgent.ts
import { Agent, webSearchTool } from '@openai/agents';
import { UserLocation } from '../types';
import { createLaborCostTool } from '../tools/laborCostTool';
import { createMaterialCostTool } from '../tools/materialCostTool';
import { createRepairInstructionsTool } from '../tools/repairInstructionsTool';

export function createRepairEstimatorAgent(userLocation: UserLocation): Agent {
  return new Agent({
    name: 'Advanced Property Repair Estimator',
    model: 'gpt-4o-mini',
    instructions: `
You are a property repair estimator. For each inventory item:
1. Search for local labor rates in ${userLocation.city}, ${userLocation.region}
2. Search for local material costs
3. Compare fix vs replace costs
4. Recommend the cheaper option
5. Provide step-by-step instructions including time estimates
6. List required tools and materials
7. Provide a detailed breakdown of costs

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON without any markdown formatting or code blocks
- Do NOT wrap your response in \`\`\`json or \`\`\` blocks
- Use double quotes for ALL strings and property names
- Do NOT use single quotes or backticks
- Do NOT include trailing commas
- Ensure all JSON syntax is valid

Required JSON structure:
{
  "line_items": [
    {
      "itemId": "string",
      "itemName": "string", 
      "category": "string",
      "currentCondition": "string",
      "location": "string",
      "fix": {
        "laborHours": 1.5,
        "laborRate": 85,
        "partsCost": 50,
        "totalCost": 177.5
      },
      "replace": {
        "laborHours": 2,
        "laborRate": 85,
        "partsCost": 400,
        "totalCost": 570
      },
      "recommendedAction": "Fix",
      "instructions": {
        "fix": ["Step 1", "Step 2", "Step 3"],
        "replace": ["Step 1", "Step 2", "Step 3"]
      }
    }
  ],
  "summary": {
    "totalFixCost": 177.5,
    "totalReplaceCost": 570,
    "totalRecommendedCost": 177.5,
    "overallRecommendation": "Fix recommended for cost savings",
    "total_labor_cost": 127.5,
    "total_material_cost": 50,
    "total_project_cost": 177.5,
    "items_to_repair": 1,
    "items_to_replace": 0
  },
  "metadata": {
    "estimateDate": "2025-08-22T12:00:00Z",
    "currency": "USD",
    "location": "${userLocation.city}, ${userLocation.region}"
  }
}

IMPORTANT: Return ONLY the JSON object above. No additional text, explanations, or formatting.`,
    tools: [
      createLaborCostTool(userLocation),
      createMaterialCostTool(userLocation),
      createRepairInstructionsTool(userLocation),
      webSearchTool({ userLocation })
    ]
  });
}
