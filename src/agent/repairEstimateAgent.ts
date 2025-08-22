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

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks. 
Do NOT wrap your response in \`\`\`json or \`\`\` blocks.

Expected JSON structure:
{
  "line_items": [
    {
      "itemId": "string",
      "itemName": "string", 
      "category": "string",
      "currentCondition": "string",
      "location": "string",
      "fix": {
        "laborHours": number,
        "laborRate": number,
        "partsCost": number,
        "totalCost": number
      },
      "replace": {
        "laborHours": number,
        "laborRate": number,
        "partsCost": number,
        "totalCost": number
      },
      "recommendedAction": "Fix" | "Replace",
      "instructions": {
        "fix": ["step1", "step2"],
        "replace": ["step1", "step2"]
      }
    }
  ],
  "summary": {
    "totalFixCost": number,
    "totalReplaceCost": number,
    "totalRecommendedCost": number,
    "overallRecommendation": "string",
    "total_labor_cost": number,
    "total_material_cost": number,
    "total_project_cost": number,
    "items_to_repair": number,
    "items_to_replace": number
  },
  "metadata": {
    "estimateDate": "ISO date string",
    "currency": "string",
    "location": "city, region"
  }
}

Return ONLY the JSON object, no additional text or formatting.`,
    tools: [
      createLaborCostTool(userLocation),
      createMaterialCostTool(userLocation),
      createRepairInstructionsTool(userLocation),
      webSearchTool({ userLocation })
    ]
  });
}
