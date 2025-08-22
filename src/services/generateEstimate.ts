// services/generateEstimate.ts
import { InventoryItem, DetailedEstimate, EstimateLineItem, EstimateResult, UserLocation } from '../types';

async function callBackendEstimateAPI(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD'
): Promise<DetailedEstimate | null> {
  try {
    console.log('🔄 Calling backend estimate API...', { 
      inventoryCount: inventoryItems.length, 
      userLocation,
      currency 
    });

    const resp = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': 'dev_api_key_example' // Use the dev API key from apiKeys.json
      },
      body: JSON.stringify({ inventoryItems, userLocation, currency }),
    });

    console.log('📡 Backend response status:', resp.status);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.warn('❌ Backend estimate API returned non-OK', resp.status, errorText);
      return null;
    }

    const json = await resp.json();
    console.log('✅ Backend estimate API success:', json);
    return json as DetailedEstimate;
  } catch (err) {
    console.warn('❌ Failed to call backend estimate API', err);
    return null;
  }
}

export async function generateDetailedRepairEstimate(
  inventoryItems: InventoryItem[],
  userLocation: UserLocation,
  currency = 'USD'
): Promise<DetailedEstimate> {
  console.log('🏁 Starting generateDetailedRepairEstimate', { 
    itemCount: inventoryItems.length, 
    location: userLocation,
    currency 
  });

  // Try backend first (preferred). Backend should own OpenAI key and agent usage.
  const backendResult = await callBackendEstimateAPI(inventoryItems, userLocation, currency);
  if (backendResult) {
    console.log('✅ Using backend result');
    return backendResult;
  }

  console.log('⚠️ Backend failed, using fallback mock data');

  // Fallback: return deterministic mock data (keeps frontend working without backend)
  const mockLineItems: EstimateLineItem[] = inventoryItems
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
        partsCost: item.originalCost * 0.8,
        totalCost: item.originalCost * 1.2
      },
      recommendedAction: item.currentCondition === 'Non-functional' ? 'Replace' 
        : item.currentCondition === 'Damaged' ? 'Replace'
        : 'Fix',
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
      recommended_action: item.recommendedAction,
      estimated_hours: item.recommendedAction.toLowerCase() === 'fix'
        ? (item.fix?.laborHours || 0)
        : (item.replace?.laborHours || 0),
        category: item.category,
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
