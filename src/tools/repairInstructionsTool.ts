// tools/repairInstructionsTool.ts
import { Agent, Tool, tool, webSearchTool, run } from '@openai/agents';
import { UserLocation } from '../types';

export function createRepairInstructionsTool(userLocation: UserLocation): Tool {
  return tool({
    name: 'search_repair_instructions',
    description: 'Find step-by-step instructions for repairing/replacing items.',
    parameters: {
      type: 'object',
      properties: {
        item_description: { type: 'string', description: 'Description of the item to repair or replace' },
        action_type: { type: 'string', description: 'Action to perform (repair, replace, install)' },
        issue_type: { type: 'string', description: 'Specific issue or malfunction' }
      },
      required: ['item_description', 'action_type', 'issue_type'],
      additionalProperties: false
    },
    strict: true,
    async execute(input) {
      const { item_description, action_type, issue_type } = input as {
        item_description: string;
        action_type: string;
        issue_type: string;
      };

      const query = `how to ${action_type} ${item_description} ${issue_type} step by step guide`;

      const agent = new Agent({
        name: 'Repair Instruction Researcher',
        instructions: `Find detailed, professional instructions to ${action_type} a ${item_description} experiencing ${issue_type}. Include all necessary materials and tools. Ensure the steps are code-compliant and practical.`,
        tools: [webSearchTool({ userLocation })],
        model: 'gpt-4.1'
      });

      return run(agent, query);
    }
  });
}
