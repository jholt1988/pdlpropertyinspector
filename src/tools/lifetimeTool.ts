// tools/lifetimeTool.ts
import { Agent, Tool, tool, webSearchTool, run } from '@openai/agents';
import { UserLocation } from '../types';

export function createLifetimeTool(userLocation: UserLocation): Tool {
  return tool({
    name: 'search_item_lifetime',
    description: 'Find average expected lifetime for specific trades and item categories.',
    parameters: {
      type: 'object',
      properties: {
        trade: { type: 'string', description: 'Trade category (plumbing, electrical, hvac, flooring, locksmith, painter, carpentry, roofing, fencing, landscaping, pest control, foundation)' },
        item_type: { type: 'string', description: 'Specific item or equipment type' },
        category: { type: 'string', description: 'General category (equipment, fixture, structural, etc.)' }
      },
      required: ['trade', 'item_type', 'category'],
      additionalProperties: false
    },
    strict: true,
    async execute(input) {
      const { trade, item_type, category } = input as {
        trade: string;
        item_type: string;
        category: string;
      };

      const query = `${trade} ${item_type} ${category} average expected lifetime lifespan years industry standard`;

      const agent = new Agent({
        name: 'Lifetime Research Specialist',
        instructions: `Search for the average expected lifetime/lifespan for ${item_type} in ${trade} category (${category}).
        Look for industry standards, manufacturer specifications, building codes, and professional trade guidelines.
        Return the expected lifetime in years as a number.
        Focus on reliable sources like:
        - Industry associations and trade organizations
        - Manufacturer warranty and specification data
        - Building code references
        - Professional contractor guidelines
        - Insurance industry standards`,
        tools: [webSearchTool({ userLocation })],
        model: 'gpt-4o-mini'
      });

      return run(agent, query);
    }
  });
}