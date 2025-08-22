import { generateDetailedRepairEstimate } from '../services/generateEstimate';
import { InventoryItem, UserLocation, EstimateLineItem } from '../types';

// Example usage of the refactored repair estimator
export async function exampleRepairEstimate() {
  // Sample inventory items that need repair/replacement analysis
  const sampleInventory: InventoryItem[] = [
    {
      itemId: 'item-001',
      itemName: 'Kitchen Faucet',
      category: 'plumbing',
      currentCondition: 'Poor',
      purchaseDate: '2020-01-15',
      lastMaintenanceDate: '2022-06-01',
      originalCost: 250,
      currentMarketValue: 200,
      location: 'Kitchen',
      description: 'Single handle kitchen faucet with leak at base'
    },
    {
      itemId: 'item-002', 
      itemName: 'Ceiling Fan',
      category: 'electrical',
      currentCondition: 'Damaged',
      purchaseDate: '2019-03-10',
      originalCost: 180,
      currentMarketValue: 120,
      location: 'Living Room',
      description: 'Ceiling fan wobbles and makes noise'
    },
    {
      itemId: 'item-003',
      itemName: 'HVAC Filter',
      category: 'hvac',
      currentCondition: 'Fair',
      purchaseDate: '2024-01-01',
      lastMaintenanceDate: '2024-01-01',
      originalCost: 25,
      currentMarketValue: 25,
      location: 'Utility Room',
      description: 'Air filter needs replacement'
    }
  ];

  // Configurable user location
  const userLocation: UserLocation = {
    city: 'Wichita',
    region: 'Kansas', 
    country: 'US',
    type: 'approximate'
  };

  try {
    console.log('Generating detailed repair estimate...');
    const estimate = await generateDetailedRepairEstimate(
      sampleInventory, 
      userLocation, 
      'USD'
    );

    console.log('\n=== DETAILED REPAIR ESTIMATE ===');
    console.log(`Location: ${estimate.metadata.user_location.city}, ${estimate.metadata.user_location.region}`);
    console.log(`Generated: ${new Date(estimate.metadata.generated_date).toLocaleDateString()}`);
    console.log(`Currency: ${estimate.metadata.currency}\n`);

    // Display line items
    console.log('LINE ITEMS:');
    console.log('='.repeat(80));
    
    estimate.line_items.forEach((item: EstimateLineItem, index: number) => {
      console.log(`${index + 1}. ${item.itemName} (${item.location || 'General'})`);
      console.log(`   Category: ${item.category}`);
      console.log(`   Recommendation: ${item.recommendedAction.toUpperCase()}`);
      
      console.log('\n   REPAIR OPTION:');
      // TODO: Fix property names to match EstimateLineItem interface
      // console.log(`   - Labor: $${item.repair_costs.labor_cost.toFixed(2)}`);
      // console.log(`   - Materials: $${item.repair_costs.material_cost.toFixed(2)}`);
      // console.log(`   - Total: $${item.repair_costs.total_cost.toFixed(2)}`);
      
      console.log('\n   REPLACEMENT OPTION:');
      // TODO: Fix property names to match EstimateLineItem interface  
      // console.log(`   - Labor: $${item.replacement_costs.labor_cost.toFixed(2)}`);
      // console.log(`   - Materials: $${item.replacement_costs.material_cost.toFixed(2)}`);
      // console.log(`   - Total: $${item.replacement_costs.total_cost.toFixed(2)}`);
      
      console.log('\n   RECOMMENDED OPTION:');
      // TODO: Fix property names to match EstimateLineItem interface
      // console.log(`   - Action: ${item.recommended_option.action.toUpperCase()}`);
      // console.log(`   - Labor: $${item.recommended_option.labor_cost.toFixed(2)}`);
      // console.log(`   - Materials: $${item.recommended_option.material_cost.toFixed(2)}`);
      // console.log(`   - Total: $${item.recommended_option.total_cost.toFixed(2)}`);
      
      // if (item.recommended_option.cost_savings) {
      //   console.log(`   - Savings: $${item.recommended_option.cost_savings.toFixed(2)}`);
      // }
      
      console.log('\n   REPAIR STEPS:');
      // TODO: Fix property names to match EstimateLineItem interface
      // item.repair_steps.forEach((step, stepIndex) => {
      //   console.log(`   ${stepIndex + 1}. ${step}`);
      // });
      
      // if (item.notes) {
      //   console.log(`\n   Notes: ${item.notes}`);
      // }
      
      console.log('\n' + '-'.repeat(80));
    });

    // Display summary
    console.log('\nPROJECT SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Total Labor Cost: $${estimate.summary.total_labor_cost.toFixed(2)}`);
    console.log(`Total Material Cost: $${estimate.summary.total_material_cost.toFixed(2)}`);
    console.log(`TOTAL PROJECT COST: $${estimate.summary.total_project_cost.toFixed(2)}`);
    console.log(`\nItems to Repair: ${estimate.summary.items_to_repair}`);
    console.log(`Items to Replace: ${estimate.summary.items_to_replace}`);
    
    console.log(`\nDisclaimer: ${estimate.metadata.disclaimer}`);

    return estimate;
  } catch (error) {
    console.error('Error generating repair estimate:', error);
    throw error;
  }
}

// Function to demonstrate different user locations
export async function compareLocationEstimates() {
  const sampleItem: InventoryItem = {
    itemId: 'comparison-001',
    itemName: 'Electrical Outlet',
    category: 'electrical',
    currentCondition: 'Damaged',
    purchaseDate: '2022-01-01',
    originalCost: 15,
    currentMarketValue: 15,
    location: 'Bedroom',
    description: 'GFCI outlet not working'
  };

  const locations: UserLocation[] = [
    { city: 'Wichita', region: 'Kansas', country: 'US', type: 'approximate' },
    { city: 'New York', region: 'New York', country: 'US', type: 'approximate' },
    { city: 'Los Angeles', region: 'California', country: 'US', type: 'approximate' }
  ];

  console.log('\n=== LOCATION-BASED COST COMPARISON ===\n');

  for (const location of locations) {
    try {
      console.log(`Estimating costs for ${location.city}, ${location.region}...`);
      const estimate = await generateDetailedRepairEstimate([sampleItem], location);
      
      if (estimate.line_items.length > 0) {
        const item = estimate.line_items[0];
        const cost = item.recommendedAction === 'Fix' ? item.fix?.totalCost : item.replace?.totalCost;
        console.log(`${location.city}: $${(cost || 0).toFixed(2)} (${item.recommendedAction})`);
      }
    } catch (error) {
      console.error(`Error for ${location.city}:`, error);
    }
  }
}
