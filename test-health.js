// Simple health check test
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('✅ Health check completed');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
  process.exit(1);
});

req.end();
