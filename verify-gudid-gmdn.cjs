#!/usr/bin/env node

/**
 * GUDID Verification Script
 * 
 * This script checks a sample of GMDN codes against the live FDA GUDID database
 * to verify accuracy and potentially find additional codes.
 */

const https = require('https');
const fs = require('fs');

// Sample GMDN codes to verify
const sampleCodes = [
  '42811', // Compression/pressure sock/stocking, reusable
  '46207', // Peristomal/periwound dressing
  '62525', // Intestinal ostomy bag/support kit
  '35352', // Vaginal speculum, reusable
  '37459', // Nose clip, reusable
  '46346', // Paediatric blood donor set
  '41981', // Hepatitis B virus core immunoglobulin M (IgM) antibody IVD, calibrator
  '46832', // Laryngoscope blade cover
  '37447', // Aspiration tray, reusable
];

/**
 * Query GUDID API for a specific GMDN code
 */
function queryGudidForGmdn(gmdnCode) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'accessgudid.nlm.nih.gov',
      port: 443,
      path: `/api/v3/devices.json?gmdn_pt_code=${gmdnCode}&limit=10`,
      method: 'GET',
      headers: {
        'User-Agent': 'EMDN-Navigator/1.0',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            gmdnCode,
            success: true,
            data: response
          });
        } catch (error) {
          resolve({
            gmdnCode,
            success: false,
            error: `JSON parse error: ${error.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        gmdnCode,
        success: false,
        error: `Request error: ${error.message}`
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        gmdnCode,
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

/**
 * Add delay between requests to be respectful to the API
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load our current GMDN data for comparison
 */
function loadCurrentGmdnData() {
  try {
    const gmdnFilePath = './data/gmdnFromGUDID.ts';
    const gmdnContent = fs.readFileSync(gmdnFilePath, 'utf8');
    
    const gmdnMatches = gmdnContent.match(/{\s*code:\s*'(\d+)',\s*description:\s*"([^"]+)"/g);
    const gmdnData = new Map();
    
    if (gmdnMatches) {
      for (const match of gmdnMatches) {
        const codeMatch = match.match(/code:\s*'(\d+)'/);
        const descMatch = match.match(/description:\s*"([^"]+)"/);
        
        if (codeMatch && descMatch) {
          gmdnData.set(codeMatch[1], descMatch[1]);
        }
      }
    }
    
    return gmdnData;
  } catch (error) {
    console.error('❌ Error loading current GMDN data:', error.message);
    return new Map();
  }
}

/**
 * Compare our data with GUDID response
 */
function compareWithCurrent(gmdnCode, gudidData, currentData) {
  const ourDescription = currentData.get(gmdnCode);
  
  if (!gudidData.results || gudidData.results.length === 0) {
    return {
      status: 'no_results',
      message: 'No devices found in GUDID for this GMDN code',
      ourDescription
    };
  }

  // Get unique GMDN terms from GUDID results
  const gudidTerms = [...new Set(
    gudidData.results
      .filter(device => device.gmdn_pt_name)
      .map(device => device.gmdn_pt_name.trim())
  )];

  if (gudidTerms.length === 0) {
    return {
      status: 'no_gmdn_terms',
      message: 'Devices found but no GMDN terms available',
      ourDescription,
      deviceCount: gudidData.results.length
    };
  }

  // Check if our description matches any GUDID terms
  const exactMatches = gudidTerms.filter(term => 
    term.toLowerCase() === ourDescription?.toLowerCase()
  );

  const partialMatches = gudidTerms.filter(term => 
    term.toLowerCase().includes(ourDescription?.toLowerCase()) ||
    ourDescription?.toLowerCase().includes(term.toLowerCase())
  );

  return {
    status: exactMatches.length > 0 ? 'exact_match' : 
            partialMatches.length > 0 ? 'partial_match' : 'mismatch',
    ourDescription,
    gudidTerms,
    exactMatches,
    partialMatches,
    deviceCount: gudidData.results.length,
    sampleDevices: gudidData.results.slice(0, 3).map(device => ({
      di: device.di,
      brand_name: device.brand_name,
      version_model_number: device.version_model_number,
      gmdn_pt_name: device.gmdn_pt_name
    }))
  };
}

/**
 * Main verification function
 */
async function verifyGmdnCodes() {
  console.log('🔍 GUDID Verification Script');
  console.log('=' .repeat(50));
  console.log(`📋 Checking ${sampleCodes.length} GMDN codes against live GUDID database...\n`);
  
  const currentData = loadCurrentGmdnData();
  console.log(`📂 Loaded ${currentData.size} codes from our current dataset\n`);
  
  const results = [];
  
  for (let i = 0; i < sampleCodes.length; i++) {
    const gmdnCode = sampleCodes[i];
    console.log(`🔄 [${i + 1}/${sampleCodes.length}] Checking GMDN ${gmdnCode}...`);
    
    try {
      const gudidResult = await queryGudidForGmdn(gmdnCode);
      
      if (!gudidResult.success) {
        console.log(`❌ Error: ${gudidResult.error}`);
        results.push({
          gmdnCode,
          status: 'error',
          error: gudidResult.error
        });
      } else {
        const comparison = compareWithCurrent(gmdnCode, gudidResult.data, currentData);
        results.push({
          gmdnCode,
          ...comparison
        });
        
        // Log immediate results
        const statusEmoji = {
          'exact_match': '✅',
          'partial_match': '⚠️',
          'mismatch': '❌',
          'no_results': '🔍',
          'no_gmdn_terms': '📝'
        };
        
        console.log(`${statusEmoji[comparison.status]} ${comparison.status.toUpperCase()}`);
        console.log(`   Our data: "${comparison.ourDescription}"`);
        
        if (comparison.gudidTerms && comparison.gudidTerms.length > 0) {
          console.log(`   GUDID terms: ${comparison.gudidTerms.slice(0, 2).map(t => `"${t}"`).join(', ')}${comparison.gudidTerms.length > 2 ? '...' : ''}`);
        }
        
        if (comparison.deviceCount) {
          console.log(`   Found ${comparison.deviceCount} devices in GUDID`);
        }
      }
      
      console.log('');
      
      // Be respectful to the API
      if (i < sampleCodes.length - 1) {
        await delay(2000); // 2 second delay between requests
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      results.push({
        gmdnCode,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(50));
  
  const statusCounts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    const emoji = {
      'exact_match': '✅',
      'partial_match': '⚠️',
      'mismatch': '❌',
      'no_results': '🔍',
      'no_gmdn_terms': '📝',
      'error': '💥'
    };
    console.log(`${emoji[status]} ${status.replace('_', ' ').toUpperCase()}: ${count}`);
  });
  
  // Detailed mismatches
  const mismatches = results.filter(r => r.status === 'mismatch');
  if (mismatches.length > 0) {
    console.log('\n🔍 DETAILED MISMATCHES:');
    mismatches.forEach(result => {
      console.log(`\n📋 GMDN ${result.gmdnCode}:`);
      console.log(`   Our description: "${result.ourDescription}"`);
      console.log(`   GUDID terms: ${result.gudidTerms.map(t => `"${t}"`).join(', ')}`);
    });
  }
  
  // Save detailed report
  const reportPath = './gudid-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      totalChecked: sampleCodes.length,
      summary: statusCounts
    },
    results
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (statusCounts.exact_match > 0) {
    console.log('✅ Exact matches confirm our data accuracy');
  }
  if (statusCounts.partial_match > 0) {
    console.log('⚠️  Partial matches may need description refinement');
  }
  if (statusCounts.mismatch > 0) {
    console.log('❌ Mismatches should be investigated and potentially corrected');
  }
  if (statusCounts.no_results > 0) {
    console.log('🔍 No results may indicate outdated or incorrect GMDN codes');
  }
}

// Run verification
if (require.main === module) {
  verifyGmdnCodes().catch(console.error);
}

module.exports = { verifyGmdnCodes };