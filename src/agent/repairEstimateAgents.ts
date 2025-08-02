// agent/repairEstimatorAgent.ts
import { Agent, webSearchTool } from '@openai/agents';
import { UserLocation } from '../types';
import { createLaborCostTool } from '../tools/laborCostTool';
import { createMaterialCostTool } from '../tools/materialCostTool';
import { createRepairInstructionsTool } from '../tools/repairInstructionTool';

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
5. Provide step-by-step instructions
Respond with structured JSON including line_items, summary, and metadata.
`,
    tools: [
      createLaborCostTool(userLocation),
      createMaterialCostTool(userLocation),
      createRepairInstructionsTool(userLocation),
      webSearchTool({ userLocation })
    ]
  });
}
