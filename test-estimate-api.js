// Test the estimate API directly
import 'dotenv/config';

const testInventoryItems = [
  {
    itemId: 'test-1',
    itemName: 'Test Water Heater',
    category: 'plumbing',
    currentCondition: 'Poor',
    location: 'Basement',
    originalCost: 800
  }
];

const testUserLocation = {
  city: 'Seattle',
  region: 'WA'
};

async function testEstimateAPI() {
  try {
    console.log('🔄 Testing estimate API...');
    
    const response = await fetch('http://localhost:3001/api/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'dev_api_key_example'
      },
      body: JSON.stringify({
        inventoryItems: testInventoryItems,
        userLocation: testUserLocation,
        currency: 'USD'
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API Success:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testEstimateAPI();
