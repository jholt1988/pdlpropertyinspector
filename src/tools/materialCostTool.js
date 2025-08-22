"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialCostTool = createMaterialCostTool;
// tools/materialCostTool.ts
const agents_1 = require("@openai/agents");
function createMaterialCostTool(userLocation) {
    return (0, agents_1.tool)({
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
            const { item_type, category, quality_level } = input;
            const query = `${item_type} ${category} ${quality_level} price ${userLocation.city} ${userLocation.region} 2024 2025`;
            const agent = new agents_1.Agent({
                name: 'Material Cost Researcher',
                instructions: `Find prices for ${item_type} (${quality_level}) in ${category} within ${userLocation.city}, ${userLocation.region}. Focus on common suppliers like Home Depot and Lowe's.`,
                tools: [(0, agents_1.webSearchTool)({ userLocation })],
                model: 'gpt-4o-mini'
            });
            return (0, agents_1.run)(agent, query);
        }
    });
}
