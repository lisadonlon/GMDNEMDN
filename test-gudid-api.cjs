#!/usr/bin/env node

/**
 * GUDID API Explorer
 * 
 * Test different approaches to query the GUDID database
 */

const https = require('https');

/**
 * Test basic GUDID API connectivity and common codes
 */
async function testGudidConnectivity() {
  console.log('🔍 Testing GUDID API Connectivity...\n');
  
  // Test 1: Try a general query without GMDN filter
  console.log('📡 Test 1: General device query...');
  try {
    const generalResult = await queryGudid('/api/v3/devices.json?limit=5');
    console.log('✅ General API access working');
    console.log(`📊 Found ${generalResult.total || 'unknown'} total devices`);
    
    if (generalResult.results && generalResult.results.length > 0) {
      const sampleDevice = generalResult.results[0];
      console.log('📋 Sample device:');
      console.log(`   DI: ${sampleDevice.di}`);
      console.log(`   Brand: ${sampleDevice.brand_name}`);
      console.log(`   GMDN Code: ${sampleDevice.gmdn_pt_code}`);
      console.log(`   GMDN Name: ${sampleDevice.gmdn_pt_name}`);
    }
  } catch (error) {
    console.log(`❌ General API test failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Test 2: Try common GMDN codes that should exist
  const commonCodes = [
    '35177', // Pacemaker (very common)
    '37462', // Surgical forceps
    '42191', // Surgical glove
    '35004'  // Thermometer
  ];
  
  console.log('\n📡 Test 2: Trying common GMDN codes...');
  
  for (const code of commonCodes) {
    try {
      console.log(`🔄 Testing GMDN ${code}...`);
      const result = await queryGudid(`/api/v3/devices.json?gmdn_pt_code=${code}&limit=3`);
      
      if (result.results && result.results.length > 0) {
        console.log(`✅ Found ${result.results.length} devices for GMDN ${code}`);
        const sample = result.results[0];
        console.log(`   Example: ${sample.gmdn_pt_name} (${sample.brand_name})`);
      } else {
        console.log(`🔍 No results for GMDN ${code}`);
      }
      
      // Small delay
      await delay(1000);
      
    } catch (error) {
      console.log(`❌ Error testing GMDN ${code}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Test 3: Try searching by brand name to see if API is working
  console.log('\n📡 Test 3: Testing brand name search...');
  try {
    const brandResult = await queryGudid('/api/v3/devices.json?brand_name=Medtronic&limit=3');
    
    if (brandResult.results && brandResult.results.length > 0) {
      console.log(`✅ Found ${brandResult.results.length} Medtronic devices`);
      brandResult.results.forEach((device, i) => {
        console.log(`   ${i + 1}. ${device.brand_name} - GMDN: ${device.gmdn_pt_code} (${device.gmdn_pt_name})`);
      });
    } else {
      console.log('🔍 No Medtronic devices found');
    }
  } catch (error) {
    console.log(`❌ Brand search failed: ${error.message}`);
  }
}

/**
 * Generic GUDID API query function
 */
function queryGudid(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'accessgudid.nlm.nih.gov',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
          }
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Add delay between requests
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
if (require.main === module) {
  testGudidConnectivity().catch(console.error);
}