#!/usr/bin/env node

/**
 * GMDN Agency Verification Script
 * 
 * This script checks GMDN codes against the official GMDN Agency database
 * to verify accuracy of our codes and descriptions.
 */

const https = require('https');
const fs = require('fs');

// Sample GMDN codes to verify against GMDN Agency
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
 * Query GMDN Agency search with proper structure
 */
function queryGmdnAgencySearch(gmdnCode) {
  return new Promise((resolve, reject) => {
    // Use the specific search structure: gmdnTerms.gmdn.gmdnCode:("code")
    const searchQuery = `gmdnTerms.gmdn.gmdnCode:("${gmdnCode}")`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const options = {
      hostname: 'www.gmdnagency.org',
      port: 443,
      path: `/terms/search?query=${encodedQuery}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          gmdnCode,
          searchQuery,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          success: res.statusCode === 200,
          data: data,
          dataLength: data.length
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        gmdnCode,
        searchQuery,
        success: false,
        error: `Request error: ${error.message}`
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({
        gmdnCode,
        searchQuery,
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

/**
 * Try alternative GMDN Agency search approach
 */
function searchGmdnAgencyAlternative(gmdnCode) {
  return new Promise((resolve, reject) => {
    // Try alternative search paths
    const options = {
      hostname: 'www.gmdnagency.org',
      port: 443,
      path: `/search?q=${gmdnCode}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          gmdnCode,
          method: 'alternative_search',
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          data: data.substring(0, 2000), // First 2000 chars
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        gmdnCode,
        method: 'alternative_search',
        success: false,
        error: `Request error: ${error.message}`
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({
        gmdnCode,
        method: 'alternative_search',
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

/**
 * Test GMDN Agency website connectivity
 */
function testGmdnAgencyConnectivity() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.gmdnagency.org',
      port: 443,
      path: '/',
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
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
 * Parse GMDN Agency HTML response to extract GMDN information
 */
function parseGmdnAgencyResponse(html, gmdnCode) {
  const results = [];
  
  // Look for GMDN code in the response
  const codeRegex = new RegExp(`${gmdnCode}`, 'gi');
  const codeMatches = html.match(codeRegex);
  
  // Look for term definitions (common patterns in GMDN Agency pages)
  const termPatterns = [
    /<title[^>]*>([^<]*GMDN[^<]*)<\/title>/gi,
    /<h1[^>]*>([^<]*)<\/h1>/gi,
    /<h2[^>]*>([^<]*)<\/h2>/gi,
    /<td[^>]*>([^<]*GMDN[^<]*)<\/td>/gi,
    /<div[^>]*class="[^"]*term[^"]*"[^>]*>([^<]*)<\/div>/gi,
    /<span[^>]*class="[^"]*definition[^"]*"[^>]*>([^<]*)<\/span>/gi
  ];
  
  for (const pattern of termPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 10 && text.length < 200) {
        results.push({
          type: pattern.source.includes('title') ? 'title' : 
                pattern.source.includes('h1') ? 'heading1' :
                pattern.source.includes('h2') ? 'heading2' :
                pattern.source.includes('td') ? 'table_cell' :
                pattern.source.includes('term') ? 'term_div' : 'definition_span',
          content: text
        });
      }
    }
  }
  
  return {
    foundCode: codeMatches ? codeMatches.length > 0 : false,
    codeOccurrences: codeMatches ? codeMatches.length : 0,
    extractedContent: results,
    hasRelevantContent: results.length > 0
  };
}

/**
 * Add delay between requests
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main verification function
 */
async function verifyWithGmdnAgency() {
  console.log('🏥 GMDN Agency Verification Script');
  console.log('=' .repeat(60));
  console.log(`📋 Checking ${sampleCodes.length} GMDN codes against GMDN Agency...\n`);
  console.log('🔍 Using search structure: gmdnTerms.gmdn.gmdnCode:("code")\n');
  
  // Test connectivity first
  console.log('📡 Testing GMDN Agency connectivity...');
  const connectivityTest = await testGmdnAgencyConnectivity();
  
  if (connectivityTest.success) {
    console.log(`✅ GMDN Agency reachable (HTTP ${connectivityTest.statusCode})`);
  } else {
    console.log(`❌ GMDN Agency connectivity failed: ${connectivityTest.error}`);
    return;
  }
  
  const currentData = loadCurrentGmdnData();
  console.log(`📂 Loaded ${currentData.size} codes from our current dataset\n`);
  
  const results = [];
  
  for (let i = 0; i < sampleCodes.length; i++) {
    const gmdnCode = sampleCodes[i];
    const ourDescription = currentData.get(gmdnCode);
    
    console.log(`🔄 [${i + 1}/${sampleCodes.length}] Checking GMDN ${gmdnCode}...`);
    console.log(`   Our description: "${ourDescription}"`);
    
    // Try structured search with gmdnTerms.gmdn.gmdnCode:("code")
    const structuredResult = await queryGmdnAgencySearch(gmdnCode);
    console.log(`   Structured search: ${structuredResult.success ? '✅ Success' : '❌ Failed'} (${structuredResult.statusCode || 'No status'})`);
    
    let parsedContent = null;
    if (structuredResult.success && structuredResult.data) {
      parsedContent = parseGmdnAgencyResponse(structuredResult.data, gmdnCode);
      console.log(`   Found code in response: ${parsedContent.foundCode ? '✅ Yes' : '❌ No'}`);
      console.log(`   Code occurrences: ${parsedContent.codeOccurrences}`);
      console.log(`   Extracted content items: ${parsedContent.extractedContent.length}`);
      
      if (parsedContent.extractedContent.length > 0) {
        console.log(`   Sample content: "${parsedContent.extractedContent[0].content}"`);
      }
    }
    
    // Try alternative search as backup
    await delay(2000);
    const altResult = await searchGmdnAgencyAlternative(gmdnCode);
    console.log(`   Alternative search: ${altResult.success ? '✅ Success' : '❌ Failed'} (${altResult.statusCode})`);
    
    let altParsedContent = null;
    if (altResult.success && altResult.data) {
      altParsedContent = parseGmdnAgencyResponse(altResult.data, gmdnCode);
      if (altParsedContent.foundCode) {
        console.log(`   Alternative found code: ✅ Yes (${altParsedContent.codeOccurrences} occurrences)`);
      }
    }
    
    results.push({
      gmdnCode,
      ourDescription,
      structuredResult,
      parsedContent,
      altResult,
      altParsedContent
    });
    
    console.log('');
    
    // Be respectful with request timing
    if (i < sampleCodes.length - 1) {
      await delay(3000); // 3 second delay between codes
    }
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(60));
  
  const structuredSuccesses = results.filter(r => r.structuredResult.success).length;
  const altSuccesses = results.filter(r => r.altResult.success).length;
  const foundInStructured = results.filter(r => r.parsedContent && r.parsedContent.foundCode).length;
  const foundInAlt = results.filter(r => r.altParsedContent && r.altParsedContent.foundCode).length;
  
  console.log(`📊 Structured search successes: ${structuredSuccesses}/${results.length}`);
  console.log(`📊 Alternative search successes: ${altSuccesses}/${results.length}`);
  console.log(`📊 Codes found in structured responses: ${foundInStructured}/${results.length}`);
  console.log(`📊 Codes found in alternative responses: ${foundInAlt}/${results.length}`);
  
  // Show successful matches
  const successfulMatches = results.filter(r => 
    (r.parsedContent && r.parsedContent.foundCode) || 
    (r.altParsedContent && r.altParsedContent.foundCode)
  );
  
  if (successfulMatches.length > 0) {
    console.log(`\n✅ SUCCESSFUL MATCHES:`);
    successfulMatches.forEach(result => {
      console.log(`   📋 GMDN ${result.gmdnCode}: "${result.ourDescription}"`);
      if (result.parsedContent && result.parsedContent.extractedContent.length > 0) {
        result.parsedContent.extractedContent.slice(0, 2).forEach(content => {
          console.log(`      - ${content.type}: "${content.content}"`);
        });
      }
    });
  }
  
  // Save detailed report
  const reportPath = './gmdn-agency-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      totalChecked: sampleCodes.length,
      structuredSuccesses,
      altSuccesses,
      foundInStructured,
      foundInAlt
    },
    results
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Review successful matches for accuracy verification');
  console.log('2. Use structured search format for future GMDN lookups');
  console.log('3. Consider implementing GMDN Agency web scraping for missing codes');
  console.log('4. Cross-reference findings with our current EMDN mappings');
}

// Run verification
if (require.main === module) {
  verifyWithGmdnAgency().catch(console.error);
}

module.exports = { verifyWithGmdnAgency };