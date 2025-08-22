// tools/depreciationTool.ts
import { Agent, Tool, tool, webSearchTool, run } from '@openai/agents';
import { UserLocation } from '../types';

export function createDepreciationTool(userLocation: UserLocation): Tool {
  return tool({
    name: 'search_depreciation_rates',
    description: 'Find average per-year depreciation rates for specific trades and item categories.',
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

      const query = `${trade} ${item_type} ${category} annual depreciation rate industry standard 2024 2025`;

      const agent = new Agent({
        name: 'Depreciation Rate Researcher',
        instructions: `Search for annual depreciation rates for ${item_type} in ${trade} category (${category}). 
        Look for industry-standard depreciation schedules, IRS depreciation tables, and trade-specific guidelines.
        Return the annual depreciation percentage as a decimal (e.g., 0.10 for 10% per year).
        Focus on reliable sources like IRS publications, industry associations, and professional trade organizations.`,
        tools: [webSearchTool({ userLocation })],
        model: 'gpt-4o-mini'
      });

      return run(agent, query);
    }
  });
}