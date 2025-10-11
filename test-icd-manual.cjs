#!/usr/bin/env node
/**
 * Manual WHO ICD API test
 */

const https = require('https');
const fs = require('fs');

// Load credentials
const envFile = '.env';
let clientId = '';
let clientSecret = '';

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const cleanKey = key.trim();
      const cleanValue = value.trim();
      if (cleanKey === 'ICD_CLIENT_ID') clientId = cleanValue;
      if (cleanKey === 'ICD_CLIENT_SECRET') clientSecret = cleanValue;
    }
  });
}

console.log('Testing WHO ICD API manually...');
console.log('Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
console.log('Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT SET');

// Test different token endpoints and approaches
const tests = [
  {
    name: 'Standard OAuth2 (original endpoint)',
    url: 'https://icdaccessmanagement.who.int/connect/token',
    data: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=icdapi_access&grant_type=client_credentials`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  },
  {
    name: 'Without scope parameter',
    url: 'https://icdaccessmanagement.who.int/connect/token',
    data: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    console.log(`\n--- Testing: ${test.name} ---`);
    
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        ...test.headers,
        'Content-Length': Buffer.byteLength(test.data),
      },
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${responseData}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`Error: ${err.message}`);
      resolve();
    });
    
    req.write(test.data);
    req.end();
  });
}

async function runTests() {
  for (const test of tests) {
    await testEndpoint(test);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
}

runTests();