// Simple test file to check basic imports
console.log('Starting test...');

async function testImports() {
  try {
    console.log('Testing express import...');
    const express = await import('express');
    console.log('Express imported successfully');

    console.log('Testing body-parser import...');
    const bodyParser = await import('body-parser');
    console.log('Body-parser imported successfully');

    console.log('Testing rateLimiterStore import...');
    const { isRedisReady } = await import('./rateLimiterStore');
    console.log('Rate limiter store imported successfully');

    console.log('Testing handler import...');
    const { handleEstimateRequest } = await import('./handler');
    console.log('Handler imported successfully');

    console.log('All imports successful!');
  } catch (error) {
    console.error('Import error:', error);
  }
}

testImports();

export {};
