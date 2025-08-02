// services/generateEstimate.ts
import OpenAI from 'openai';
import { setDefaultOpenAIClient, run } from '@openai/agents';
import { createRepairEstimatorAgent } from '../agent/repairEstimateAgent';
import { InventoryItem, DetailedEstimate, EstimateLineItem, EstimateResult, UserLocation } from '../types';

// Set OpenAI client
const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
  openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  setDefaultOpenAIClient(openai);
}

export async function generateDetailedRepairEstimate(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD'
): Promise<DetailedEstimate> {
  if (!openai) {
    // Return mock data that matches the expected structure
    const mockLineItems: EstimateLineItem[] = inventoryItems
      .filter(item => item.currentCondition === 'Poor' || item.currentCondition === 'Damaged' || item.currentCondition === 'Non-functional')
      .map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category,
        currentCondition: item.currentCondition,
        location: item.location || 'General',
        fix: {
          laborHours: item.currentCondition === 'Non-functional' ? 4 : 1.5,
          laborRate: item.category === 'plumbing' ? 100 : item.category === 'hvac' ? 90 : 75,
          partsCost: item.currentCondition === 'Non-functional' ? 1000 : 50,
          totalCost: item.currentCondition === 'Non-functional' ? 1360 : 162.5
        },
        replace: {
          laborHours: item.currentCondition === 'Non-functional' ? 4 : 2,
          laborRate: item.category === 'plumbing' ? 100 : item.category === 'hvac' ? 90 : 75,
          partsCost: item.originalCost * 0.8, // 80% of original cost for replacement
          totalCost: item.originalCost * 1.2 // 120% of original cost including labor
        },
        recommendedAction: item.currentCondition === 'Non-functional' ? 'Replace' : 'Fix',
        instructions: {
          fix: [
            `Assess ${item.itemName} condition`,
            `Repair ${item.itemName} components`,
            'Test functionality',
            'Clean up work area'
          ],
          replace: [
            `Remove old ${item.itemName}`,
            `Install new ${item.itemName}`,
            'Test installation',
            'Clean up work area'
          ]
        }
      }));

    const totalFixCost = mockLineItems.reduce((sum, item) => sum + (item.fix?.totalCost || 0), 0);
    const totalReplaceCost = mockLineItems.reduce((sum, item) => sum + (item.replace?.totalCost || 0), 0);
    const totalRecommendedCost = mockLineItems.reduce((sum, item) => 
      sum + (item.recommendedAction === 'Fix' ? (item.fix?.totalCost || 0) : (item.replace?.totalCost || 0)), 0);
    
    return {
      line_items: mockLineItems,
      summary: {
        totalFixCost,
        totalReplaceCost,
        totalRecommendedCost,
        overallRecommendation: 'Fix items where cost-effective to extend service life',
        total_labor_cost: mockLineItems.reduce((sum, item) => 
          sum + (item.recommendedAction === 'Fix' 
            ? (item.fix?.laborHours || 0) * (item.fix?.laborRate || 0)
            : (item.replace?.laborHours || 0) * (item.replace?.laborRate || 0)), 0),
        total_material_cost: mockLineItems.reduce((sum, item) => 
          sum + (item.recommendedAction === 'Fix' 
            ? (item.fix?.partsCost || 0)
            : (item.replace?.partsCost || 0)), 0),
        total_project_cost: totalRecommendedCost,
        items_to_repair: mockLineItems.filter(item => item.recommendedAction === 'Fix').length,
        items_to_replace: mockLineItems.filter(item => item.recommendedAction === 'Replace').length
      },
      metadata: {
        user_location: userLocation,
        currency,
        generated_date: new Date().toISOString(),
        creationDate: new Date().toISOString().split('T')[0],
        location: `${userLocation.city}, ${userLocation.region}`,
        disclaimer: 'OpenAI API key not configured; using mock estimate based on item conditions.'
      }
    };
  }

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
    console.log('Detailed Repair Estimator Response:', response.finalOutput);
    const parsed = typeof response === 'string' ? JSON.parse(response.finalOutput) : response.finalOutput;
    console.log('Parsed Estimate:', parsed);
    
    // Transform the response to match our DetailedEstimate interface
    const transformedResponse = {
      line_items: parsed.line_items || [],
      summary: {
        totalFixCost: parsed.summary?.totalFixCost || 0,
        totalReplaceCost: parsed.summary?.totalReplaceCost || 0,
        totalRecommendedCost: parsed.summary?.totalRecommendedCost || 0,
        overallRecommendation: parsed.summary?.overallRecommendation || 'Review recommendations',
        total_labor_cost: parsed.summary?.totalRecommendedCost || 0,
      },
      metadata: {
        user_location: userLocation,
        currency,
        generated_date: new Date().toISOString(),
        creationDate: parsed.metadata?.creationDate || new Date().toISOString().split('T')[0],
        location: parsed.metadata?.location || `${userLocation.city}, ${userLocation.region}`,
        disclaimer: 'Estimates are based on market data and may vary. Always confirm with local contractors.'
      }
    };
    
    return transformedResponse;
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
      item_description: item.itemName,
      location: item.location || 'General',
      issue_type: item.recommendedAction.toLowerCase() === 'fix' ? 'repair' : 'replace',
      estimated_labor_cost: item.recommendedAction.toLowerCase() === 'fix' 
        ? (item.fix?.laborHours || 0) * (item.fix?.laborRate || 0)
        : (item.replace?.laborHours || 0) * (item.replace?.laborRate || 0),
      estimated_material_cost: item.recommendedAction.toLowerCase() === 'fix' 
        ? item.fix?.partsCost || 0
        : item.replace?.partsCost || 0,
      item_total_cost: item.recommendedAction.toLowerCase() === 'fix' 
        ? item.fix?.totalCost || 0
        : item.replace?.totalCost || 0,
      repair_instructions: item.recommendedAction.toLowerCase() === 'fix' 
        ? item.instructions?.fix || []
        : item.instructions?.replace || [],
      notes: `${item.currentCondition} condition - ${item.recommendedAction} recommended`
    })),
    metadata: {
      creation_date: detailedEstimate.metadata.generated_date,
      currency: detailedEstimate.metadata.currency,
      disclaimer: detailedEstimate.metadata.disclaimer
    }
  };
}
