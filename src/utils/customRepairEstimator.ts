import OpenAI from 'openai';
import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
import {
  InventoryItem,
  EstimateResult,
  EstimateLine,
  UserLocation,
  EstimateLineItem,
  DetailedEstimate
} from '../types';
import { createRepairEstimatorAgent } from '../agent/repairEstimateAgents';


// @ts-ignore - Vite env variables can be undefined
const apiKey: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey || typeof apiKey !== 'string') {
  throw new Error('OPENAI_API_KEY is not defined in environment variables.');
}
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
setDefaultOpenAIClient(openai);

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
