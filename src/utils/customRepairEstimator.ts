import OpenAI from 'openai';
import { Agent, Tool, tool, webSearchTool, run, setDefaultOpenAIClient } from '@openai/agents';
import { InventoryItem, EstimateResult, EstimateLine } from '../types';

export interface UserLocation {
  city: string;
  region: string;
  country: string;
  type: 'approximate';
}

export interface EstimateLineItem {
  item_description: string;
  location: string;
  issue_type: string;
  recommendation: 'fix' | 'replace';
  repair_costs: {
    labor_cost: number;
    material_cost: number;
    total_cost: number;
  };
  replacement_costs: {
    labor_cost: number;
    material_cost: number;
    total_cost: number;
  };
  recommended_option: {
    action: 'fix' | 'replace';
    labor_cost: number;
    material_cost: number;
    total_cost: number;
    cost_savings?: number;
  };
  repair_steps: string[];
  notes?: string;
}

export interface DetailedEstimate {
  line_items: EstimateLineItem[];
  summary: {
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
  };
  metadata: {
    user_location: UserLocation;
    currency: string;
    generated_date: string;
    disclaimer: string;
  };
}

const createCostSearchTool = (userLocation: UserLocation): Tool => tool({
  name: 'search_labor_costs',
  description: 'Search for current labor rates for specific repair work in the user location.',
  parameters: {
    type: 'object',
    properties: {
      work_type: { type: 'string', description: 'Type of work (e.g., electrical repair, plumbing fix, HVAC maintenance)' },
      trade: { type: 'string', description: 'Trade category (electrician, plumber, HVAC tech, general contractor)' },
      complexity: { type: 'string', description: 'Complexity level (basic, intermediate, advanced)' }
    },
    required: ['work_type', 'trade', 'complexity'],
    additionalProperties: false
  },
  strict: true,
  async execute(input: unknown) {
    const { work_type, trade, complexity } = input as {
      work_type: string;
      trade: string;
      complexity: string;
    };

    const searchAgent = new Agent({
      name: 'Labor Cost Researcher',
      instructions: `Search for current labor rates for ${trade} performing ${work_type} in ${userLocation.city}, ${userLocation.region}. 
      Look for hourly rates, minimum charges, and typical costs for ${complexity} level work. 
      Return specific dollar amounts and cite sources when possible.`,
      tools: [webSearchTool({ userLocation })],
      model: 'gpt-4.1-mini'
    });

    const query = `${trade} hourly rates ${work_type} ${userLocation.city} ${userLocation.region} 2024 2025 labor costs`;
    return await run(searchAgent, query);
  }
});

const createMaterialCostTool = (userLocation: UserLocation): Tool => tool({
  name: 'search_material_costs',
  description: 'Search for current material and parts costs in the user location.',
  parameters: {
    type: 'object',
    properties: {
      item_type: { type: 'string', description: 'Type of material or part needed' },
      category: { type: 'string', description: 'Category (electrical, plumbing, HVAC, building materials)' },
      quality_level: { type: 'string', description: 'Quality level (basic, standard, premium)' }
    },
    required: ['item_type', 'category', 'quality_level'],
    additionalProperties: false
  },
  strict: true,
  async execute(input: unknown) {
    const { item_type, category, quality_level } = input as {
      item_type: string;
      category: string;
      quality_level: string;
    };

    const searchAgent = new Agent({
      name: 'Material Cost Researcher',
      instructions: `Search for current prices of ${item_type} in ${category} category, ${quality_level} quality level in ${userLocation.city}, ${userLocation.region}. 
      Look for prices from major retailers (Home Depot, Lowe's, local suppliers). 
      Return specific price ranges and typical costs.`,
      tools: [webSearchTool({ userLocation })],
      model: 'gpt-4.1-mini'
    });

    const query = `${item_type} ${category} price cost ${userLocation.city} ${userLocation.region} Home Depot Lowes supplier 2024 2025`;
    return await run(searchAgent, query);
  }
});

const createRepairInstructionsTool = (userLocation: UserLocation): Tool => tool({
  name: 'search_repair_instructions',
  description: 'Search for detailed repair and installation instructions.',
  parameters: {
    type: 'object',
    properties: {
      item_description: { type: 'string', description: 'Description of the item to repair/replace' },
      action_type: { type: 'string', description: 'Type of action (repair, replace, install)' },
      issue_type: { type: 'string', description: 'Specific issue or problem' }
    },
    required: ['item_description', 'action_type', 'issue_type'],
    additionalProperties: false
  },
  strict: true,
  async execute(input: unknown) {
    const { item_description, action_type, issue_type } = input as {
      item_description: string;
      action_type: string;
      issue_type: string;
    };

    const searchAgent = new Agent({
      name: 'Repair Instructions Researcher',
      instructions: `Search for step-by-step instructions to ${action_type} a ${item_description} with ${issue_type}. 
      Look for professional guides, manufacturer instructions, and industry best practices. 
      Return detailed, sequential steps that are safe and code-compliant.`,
      tools: [webSearchTool({ userLocation })],
      model: 'gpt-4.1'
    });

    const query = `how to ${action_type} ${item_description} ${issue_type} step by step instructions professional guide`;
    return await run(searchAgent, query);
  }
});

// @ts-ignore - Vite env variables can be undefined
const apiKey: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey || typeof apiKey !== 'string') {
  throw new Error('OPENAI_API_KEY is not defined in environment variables.');
}
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
setDefaultOpenAIClient(openai);

const createRepairEstimatorAgent = (userLocation: UserLocation) => {
  return new Agent({
    name: 'Advanced Property Repair Cost Estimator',
    instructions: `You are a comprehensive property repair cost estimation agent specializing in accurate market-based pricing for ${userLocation.city}, ${userLocation.region}.

Your responsibilities:
1. Analyze each inventory item to determine whether repair or replacement is more cost-effective
2. Search for current local labor rates and material costs using real market data
3. Provide detailed step-by-step repair/replacement instructions
4. Generate comprehensive cost breakdowns with labor, materials, and total costs
5. Recommend the most cost-effective approach for each item

For each item, you must:
- Search current labor rates for the specific trade (electrician, plumber, HVAC tech, general contractor)
- Search current material/parts costs from local suppliers
- Compare repair vs replacement costs
- Recommend the most economical option
- Provide detailed repair or installation steps

Format your response as a structured analysis with clear cost breakdowns and recommendations.`,
    tools: [
      createCostSearchTool(userLocation),
      createMaterialCostTool(userLocation),
      createRepairInstructionsTool(userLocation),
      webSearchTool({ userLocation: { ...userLocation, type: 'approximate' } })
    ],
    model: 'o4-mini'
  });
};

export async function generateDetailedRepairEstimate(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency: string = 'USD'
): Promise<DetailedEstimate> {
  const agent = createRepairEstimatorAgent(userLocation);
  
  const prompt = `Analyze the following inventory items and generate a detailed repair estimate for ${userLocation.city}, ${userLocation.region}:

${JSON.stringify(inventoryItems, null, 2)}

For each item, you must:
1. Search for current local labor rates for the appropriate trade
2. Search for current material/component costs
3. Determine if repair or replacement is more cost-effective
4. Provide detailed repair/replacement steps
5. Generate accurate cost breakdowns

Return the analysis in the following JSON structure:
{
  "line_items": [
    {
      "item_description": "string",
      "location": "string", 
      "issue_type": "string based on condition",
      "recommendation": "fix" or "replace",
      "repair_costs": {
        "labor_cost": number,
        "material_cost": number,
        "total_cost": number
      },
      "replacement_costs": {
        "labor_cost": number,
        "material_cost": number, 
        "total_cost": number
      },
      "recommended_option": {
        "action": "fix" or "replace",
        "labor_cost": number,
        "material_cost": number,
        "total_cost": number,
        "cost_savings": number (optional)
      },
      "repair_steps": ["step 1", "step 2", ...],
      "notes": "additional context"
    }
  ],
  "summary": {
    "total_labor_cost": number,
    "total_material_cost": number,
    "total_project_cost": number,
    "items_to_repair": number,
    "items_to_replace": number
  }
}

Use real market data from your searches to ensure accuracy. Currency: ${currency}`;

  try {
    const response = await run(agent, prompt);
    console.log('Detailed Repair Estimator Response:', response);
    
    // Parse the response and create the final estimate
    let parsedData;
    if (typeof response === 'string') {
      try {
        parsedData = JSON.parse(response);
      } catch {
        throw new Error('Failed to parse agent response as JSON');
      }
    } else if (response && typeof response === 'object') {
      parsedData = response;
    } else {
      throw new Error('Invalid response format from agent');
    }

    const detailedEstimate: DetailedEstimate = {
      line_items: parsedData.line_items || [],
      summary: parsedData.summary || {
        total_labor_cost: 0,
        total_material_cost: 0,
        total_project_cost: 0,
        items_to_repair: 0,
        items_to_replace: 0
      },
      metadata: {
        user_location: userLocation,
        currency,
        generated_date: new Date().toISOString(),
        disclaimer: 'Cost estimates are based on current market research and may vary. Actual costs may differ based on specific conditions, contractor availability, and material quality. Always obtain multiple quotes for large projects.'
      }
    };

    return detailedEstimate;
  } catch (error) {
    console.error('Error generating detailed repair estimate:', error);
    throw new Error(`Failed to generate repair estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Legacy compatibility function
export async function runRepairEstimatorAgent(
  inspectionData: InventoryItem[],
  projectArea: string,
  currency: string = 'USD'
): Promise<EstimateResult> {
  // Parse project area to create user location
  const locationParts = projectArea.split(',').map(part => part.trim());
  const userLocation: UserLocation = {
    city: locationParts[0] || 'Wichita',
    region: locationParts[1] || 'Kansas', 
    country: 'US',
    type: 'approximate'
  };

  try {
    const detailedEstimate = await generateDetailedRepairEstimate(inspectionData, userLocation, currency);
    
    // Convert to legacy format
    const itemizedBreakdown: EstimateLine[] = detailedEstimate.line_items.map(item => ({
      item_description: item.item_description,
      location: item.location,
      issue_type: item.issue_type,
      estimated_labor_cost: item.recommended_option.labor_cost,
      estimated_material_cost: item.recommended_option.material_cost,
      item_total_cost: item.recommended_option.total_cost,
      repair_instructions: item.repair_steps,
      notes: item.notes
    }));

    const legacyResult: EstimateResult = {
      overall_project_estimate: detailedEstimate.summary.total_project_cost,
      itemized_breakdown: itemizedBreakdown,
      metadata: {
        creation_date: detailedEstimate.metadata.generated_date,
        currency: detailedEstimate.metadata.currency,
        disclaimer: detailedEstimate.metadata.disclaimer
      }
    };

    return legacyResult;
  } catch (error) {
    console.error('Error in legacy repair estimator function:', error);
    throw error;
  }
}
