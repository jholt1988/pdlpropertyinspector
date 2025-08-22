"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLaborCostTool = createLaborCostTool;
// tools/laborCostTool.ts
const agents_1 = require("@openai/agents");
function createLaborCostTool(userLocation) {
    return (0, agents_1.tool)({
        name: 'search_labor_costs',
        description: 'Find current labor rates for specified trades and complexity.',
        parameters: {
            type: 'object',
            properties: {
                work_type: { type: 'string', description: 'Type of repair work' },
                trade: { type: 'string', description: 'Trade (e.g., plumber, electrician)' },
                complexity: { type: 'string', description: 'Complexity (basic, intermediate, advanced)' }
            },
            required: ['work_type', 'trade', 'complexity'],
            additionalProperties: false
        },
        strict: true,
        async execute(input) {
            const { work_type, trade, complexity } = input;
            const query = `${trade} hourly rates ${work_type} ${userLocation.city} ${userLocation.region} 2024 2025`;
            const agent = new agents_1.Agent({
                name: 'Labor Cost Researcher',
                instructions: `Search for labor rates of ${trade} for ${work_type} (${complexity}) in ${userLocation.city}, ${userLocation.region}. Return average or range with sources.`,
                tools: [(0, agents_1.webSearchTool)({ userLocation })],
                model: 'gpt-4o-mini'
            });
            return (0, agents_1.run)(agent, query);
        }
    });
}
