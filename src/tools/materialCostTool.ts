// tools/materialCostTool.ts
import { Agent, Tool, tool, webSearchTool, run } from '@openai/agents';
import { UserLocation } from '../types';

export function createMaterialCostTool(userLocation: UserLocation): Tool {
  return tool({
    name: 'search_material_costs',
    description: 'Find current prices for parts/materials in a given category.',
    parameters: {
      type: 'object',
      properties: {
        item_type: { type: 'string', description: 'Material or part name' },
        category: { type: 'string', description: 'Material category (e.g., plumbing, electrical)' },
        quality_level: { type: 'string', description: 'Quality level (basic, standard, premium)' }
      },
      required: ['item_type', 'category', 'quality_level'],
      additionalProperties: false
    },
    strict: true,
    async execute(input) {
      const { item_type, category, quality_level } = input as {
        item_type: string;
        category: string;
        quality_level: string;
      };

      const query = `${item_type} ${category} ${quality_level} price ${userLocation.city} ${userLocation.region} 2024 2025`;

      const agent = new Agent({
        name: 'Material Cost Researcher',
        instructions: `Find prices for ${item_type} (${quality_level}) in ${category} within ${userLocation.city}, ${userLocation.region}. Focus on common suppliers like Home Depot and Lowe's.`,
        tools: [webSearchTool({ userLocation })],
        model: 'gpt-4o-mini'
      });

      return run(agent, query);
    }
  });
}
