"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepairInstructionsTool = createRepairInstructionsTool;
// tools/repairInstructionsTool.ts
const agents_1 = require("@openai/agents");
function createRepairInstructionsTool(userLocation) {
    return (0, agents_1.tool)({
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
            const { item_description, action_type, issue_type } = input;
            const query = `how to ${action_type} ${item_description} ${issue_type} step by step guide`;
            const agent = new agents_1.Agent({
                name: 'Repair Instruction Researcher',
                instructions: `Find detailed, professional instructions to ${action_type} a ${item_description} experiencing ${issue_type}. Include all necessary materials and tools. Ensure the steps are code-compliant and practical.`,
                tools: [(0, agents_1.webSearchTool)({ userLocation })],
                model: 'gpt-4.1'
            });
            return (0, agents_1.run)(agent, query);
        }
    });
}
