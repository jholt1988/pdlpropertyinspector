// demo/enhanced-estimate-demo.ts
import { generateEnhancedRepairEstimate } from '../src/services/enhancedEstimate';
import { InventoryItem, UserLocation } from '../src/types';

/**
 * Demonstration of the Enhanced Project Estimate System
 * 
 * This demo shows the 6-step analysis process with:
 * - Trade-specific depreciation rates
 * - Condition-based adjustments  
 * - Automatic reclassification logic
 * - Comprehensive cost breakdowns
 */

async function runEnhancedEstimateDemo() {
  console.log('🏗️  Enhanced Project Estimate Demo');
  console.log('=====================================\n');

  // Sample inventory data representing different trades and conditions
  const demoInventory: InventoryItem[] = [
    {
      itemId: 'HVAC-001',
      itemName: 'Central Air Conditioning Unit',
      category: 'hvac',
      currentCondition: 'Fair',
      purchaseDate: new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 8 years old
      originalCost: 5500,
      location: 'Roof',
      description: 'Main HVAC unit serving entire building'
    },
    {
      itemId: 'PLUMB-001', 
      itemName: 'Water Heater',
      category: 'plumbing',
      currentCondition: 'Poor',
      purchaseDate: new Date(Date.now() - 12 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 years old
      originalCost: 1200,
      location: 'Basement',
      description: '40-gallon gas water heater'
    },
    {
      itemId: 'ELEC-001',
      itemName: 'Main Electrical Panel', 
      category: 'electrical',
      currentCondition: 'Good',
      purchaseDate: new Date(Date.now() - 15 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 15 years old
      originalCost: 2500,
      location: 'Utility Room',
      description: '200-amp electrical service panel'
    },
    {
      itemId: 'FOUND-001',
      itemName: 'Foundation Waterproofing',
      category: 'foundation', 
      currentCondition: 'Excellent',
      purchaseDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 5 years old
      originalCost: 8000,
      location: 'Foundation',
      description: 'Exterior basement waterproofing system'
    },
    {
      itemId: 'LAND-001',
      itemName: 'Landscape Plants',
      category: 'landscaping',
      currentCondition: 'Poor',
      purchaseDate: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 4 years old  
      originalCost: 800,
      location: 'Front Yard',
      description: 'Ornamental shrubs and perennial plantings'
    }
  ];

  const userLocation: UserLocation = {
    city: 'Wichita',
    region: 'Kansas', 
    country: 'US',
    type: 'approximate'
  };

  console.log('📋 Demo Inventory:');
  demoInventory.forEach(item => {
    const ageYears = Math.floor((Date.now() - new Date(item.purchaseDate).getTime()) / (365 * 24 * 60 * 60 * 1000));
    console.log(`  • ${item.itemName} (${item.category}) - ${item.currentCondition} condition, ${ageYears} years old, $${item.originalCost.toLocaleString()}`);
  });
  console.log('');

  try {
    console.log('🔄 Starting Enhanced 6-Step Analysis...\n');
    
    const result = await generateEnhancedRepairEstimate(
      demoInventory,
      userLocation,
      'USD',
      (step: string) => {
        console.log(`   ${step}`);
      }
    );

    console.log('\n📊 Enhanced Analysis Results:');
    console.log('===============================\n');

    // Display summary information
    console.log('💰 Financial Summary:');
    console.log(`   Original Total Cost: $${result.summary.totalOriginalCost.toLocaleString()}`);
    console.log(`   Depreciated Value: $${result.summary.totalDepreciatedValue.toLocaleString()}`);
    console.log(`   Condition-Adjusted Value: $${result.summary.totalAdjustedValue.toLocaleString()}`);
    console.log(`   Recommended Project Cost: $${result.summary.totalRecommendedCost.toLocaleString()}`);
    console.log(`   Items Reclassified: ${result.summary.reclassifiedItems}\n`);

    console.log('📋 Item-by-Item Analysis:');
    console.log('==========================\n');

    result.line_items.forEach(item => {
      console.log(`🔧 ${item.itemName} (${item.category})`);
      console.log(`   Age: ${item.currentAge.toFixed(1)} years | Expected Lifetime: ${item.expectedLifetime} years`);
      console.log(`   Annual Depreciation Rate: ${(item.annualDepreciationRate * 100).toFixed(1)}%`);
      console.log(`   Condition Penalty: ${(item.conditionPenalty * 100).toFixed(0)}% (${item.currentCondition})`);
      console.log(`   Original Cost: $${item.originalCost.toLocaleString()}`);
      console.log(`   Depreciated Value: $${item.depreciatedValue.toLocaleString()}`);
      console.log(`   Condition-Adjusted Value: $${item.adjustedValue.toLocaleString()}`);
      console.log(`   📋 Recommendation: ${item.recommendedAction}`);
      
      if (item.reclassificationReason) {
        console.log(`   ⚠️  Reclassification: ${item.reclassificationReason}`);
      }

      const recommendedCost = item.recommendedAction === 'Fix' ? item.fix?.totalCost : item.replace?.totalCost;
      console.log(`   💵 Estimated Cost: $${recommendedCost?.toLocaleString() || 'TBD'}`);
      console.log('');
    });

    console.log('🎯 Key Insights:');
    console.log('================');
    console.log(`• ${result.summary.items_to_repair} items recommended for repair`);
    console.log(`• ${result.summary.items_to_replace} items recommended for replacement`);
    console.log(`• ${result.summary.reclassifiedItems} items auto-reclassified due to depreciation`);
    console.log(`• Analysis considered ${result.metadata.analysisSteps.length} comprehensive steps`);
    console.log('');
    
    console.log('🔍 Analysis Steps Performed:');
    result.metadata.analysisSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });

    console.log('\n✅ Enhanced estimate generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  runEnhancedEstimateDemo().catch(console.error);
}

export { runEnhancedEstimateDemo };