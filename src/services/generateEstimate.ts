// services/generateEstimate.ts
import OpenAI from 'openai';
import { setDefaultOpenAIClient, run } from '@openai/agents';
import { createRepairEstimatorAgent } from '../agent/repairEstimateAgent';
import { InventoryItem, DetailedEstimate, EstimateLine, EstimateResult, UserLocation } from '../types';

// Set OpenAI client
const apiKey: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) throw new Error('Missing OpenAI API Key');
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
setDefaultOpenAIClient(openai);

export async function generateDetailedRepairEstimate(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD'
): Promise<DetailedEstimate> {
  const agent = createRepairEstimatorAgent(userLocation);

  const prompt = `Analyze the following items and generate a detailed estimate for ${userLocation.city}, ${userLocation.region}:

${JSON.stringify(
    inventoryItems,
    null,
    2
  )}

Currency: ${currency}`;

  try {
    const response = await run(agent, prompt);
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;

    return {
      line_items: parsed.line_items ?? [],
      summary: parsed.summary ?? {
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
        disclaimer:
          'Estimates are based on market data and may vary. Always confirm with local contractors.'
      }
    };
  } catch (err) {
    console.error('Estimation error:', err);
    throw new Error(`Estimation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function runRepairEstimatorAgent(
  inspectionData: InventoryItem[],
  projectArea: string,
  currency = 'USD'
): Promise<EstimateResult> {
  const [city = 'Wichita', region = 'Kansas'] = projectArea.split(',').map(s => s.trim());
  const location: UserLocation = { city, region, country: 'US', type: 'approximate' };

  const detailedEstimate = await generateDetailedRepairEstimate(inspectionData, location, currency);

  return {
    overall_project_estimate: detailedEstimate.summary.total_project_cost,
    estimate_summary: {
      total_labor_cost: detailedEstimate.summary.total_labor_cost,
      total_material_cost: detailedEstimate.summary.total_material_cost,
      total_project_cost: detailedEstimate.summary.total_project_cost,
      items_to_repair: detailedEstimate.summary.items_to_repair,
      items_to_replace: detailedEstimate.summary.items_to_replace
    },
    itemized_breakdown: detailedEstimate.line_items.map(item => ({
      item_description: item.item_description,
      location: item.location,
      issue_type: item.issue_type,
      estimated_labor_cost: item.recommended_option.labor_cost,
      estimated_material_cost: item.recommended_option.material_cost,
      item_total_cost: item.recommended_option.total_cost,
      repair_instructions: item.repair_steps,
      notes: item.notes
    })),
    metadata: {
      creation_date: detailedEstimate.metadata.generated_date,
      currency: detailedEstimate.metadata.currency,
      disclaimer: detailedEstimate.metadata.disclaimer
    }
  };
}
