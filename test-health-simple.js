// Simple health check with timeout
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:3001/health', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Health status:', response.status);
    const result = await response.json();
    console.log('Health result:', result);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out after 5 seconds');
    } else {
      console.error('Health check failed:', error.message);
    }
  }
}

testHealth();
