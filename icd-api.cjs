#!/usr/bin/env node
/**
 * WHO ICD-10/11 API Wrapper
 * 
 * Provides easy access to the WHO ICD API for searching diagnoses and conditions
 * 
 * API Documentation: https://icd.who.int/icdapi
 * 
 * Setup:
 * 1. Register at: https://icd.who.int/icdapi
 * 2. Get your Client ID and Client Secret
 * 3. Set environment variables:
 *    export ICD_CLIENT_ID="your_client_id"
 *    export ICD_CLIENT_SECRET="your_client_secret"
 * 
 * Or create .env file:
 *    ICD_CLIENT_ID=your_client_id
 *    ICD_CLIENT_SECRET=your_client_secret
 * 
 * Usage:
 *   node icd-api.js search "diabetes"
 *   node icd-api.js get E11
 *   node icd-api.js test
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  clientId: process.env.ICD_CLIENT_ID || '',
  clientSecret: process.env.ICD_CLIENT_SECRET || '',
  tokenUrl: 'https://icdaccessmanagement.who.int/connect/token',
  apiBase: 'https://id.who.int/icd',
  release: '10/2019', // ICD-10 2019 release
  language: 'en',
  tokenFile: './.icd-token.json',
  cacheDir: './icd-cache',
};

// Load .env file if it exists
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const cleanKey = key.trim();
      const cleanValue = value.trim().replace(/^["']|["']$/g, '');
      if (cleanKey === 'ICD_CLIENT_ID') config.clientId = cleanValue;
      if (cleanKey === 'ICD_CLIENT_SECRET') config.clientSecret = cleanValue;
    }
  });
}

// Colours
const colours = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, colour = 'reset') {
  console.log(`${colours[colour]}${message}${colours.reset}`);
}

// Create cache directory
if (!fs.existsSync(config.cacheDir)) {
  fs.mkdirSync(config.cacheDir, { recursive: true });
}

// HTTPS request helper
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// POST request for token
function httpsPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = typeof data === 'string' ? data : JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        ...headers,
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Get OAuth token
async function getToken() {
  // Check if we have a valid cached token
  if (fs.existsSync(config.tokenFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(config.tokenFile, 'utf-8'));
      const expiresAt = new Date(cached.expiresAt);
      
      if (expiresAt > new Date()) {
        log('Using cached token', 'dim');
        return cached.accessToken;
      }
    } catch (e) {
      // Invalid cache, continue to get new token
    }
  }
  
  if (!config.clientId || !config.clientSecret) {
    throw new Error('ICD API credentials not configured. See setup instructions at top of file.');
  }
  
  log('Requesting new token from WHO ICD API...', 'blue');
  
  // Try with specific ICD scope
  const data = `client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}&scope=icdapi_access&grant_type=client_credentials`;
  
  console.log('Client ID:', config.clientId);
  console.log('Client Secret length:', config.clientSecret.length);
  console.log('Token URL:', config.tokenUrl);
  console.log('Full data being sent:', data.substring(0, 100) + '...');
  
  try {
    const response = await httpsPost(config.tokenUrl, data, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    });
    
    const token = {
      accessToken: response.access_token,
      expiresAt: new Date(Date.now() + (response.expires_in * 1000)).toISOString(),
    };
    
    // Cache token
    fs.writeFileSync(config.tokenFile, JSON.stringify(token, null, 2));
    
    log('✓ Token acquired', 'green');
    return token.accessToken;
  } catch (error) {
    throw new Error(`Failed to get ICD API token: ${error.message}`);
  }
}

// Search ICD-10
async function search(query, options = {}) {
  const token = await getToken();
  const maxResults = options.maxResults || 20;
  
  const url = `${config.apiBase}/release/${config.release}/${config.language}/search?q=${encodeURIComponent(query)}&flatResults=true&useFlexisearch=true`;
  
  const response = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'API-Version': 'v2',
      'Accept-Language': config.language,
    },
  });
  
  // Parse results
  const results = response.destinationEntities || [];
  
  return results.slice(0, maxResults).map(entity => ({
    id: entity.id,
    title: entity.title,
    code: extractCode(entity.theCode),
    chapter: entity.chapter,
    score: entity.score,
    url: entity.id,
  }));
}

// Get entity details
async function getEntity(entityId) {
  const token = await getToken();
  
  // Handle both full URLs and just codes
  let url;
  if (entityId.startsWith('http')) {
    url = entityId;
  } else {
    // Try to construct URL from code
    url = `${config.apiBase}/release/${config.release}/${config.language}/${entityId}`;
  }
  
  const response = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'API-Version': 'v2',
      'Accept-Language': config.language,
    },
  });
  
  return {
    id: response['@id'],
    code: extractCode(response.code),
    title: response.title?.['@value'] || response.title,
    definition: response.definition?.['@value'] || '',
    longDefinition: response.longDefinition?.['@value'] || '',
    fullySpecifiedName: response.fullySpecifiedName?.['@value'] || '',
    parent: response.parent?.[0] || null,
    child: response.child || [],
    inclusion: response.inclusion || [],
    exclusion: response.exclusion || [],
  };
}

// Extract ICD code from various formats
function extractCode(codeString) {
  if (!codeString) return '';
  
  // ICD codes are typically like "E11" or "E11.9"
  const match = codeString.match(/[A-Z]\d{2}(\.\d+)?/);
  return match ? match[0] : codeString;
}

// Lookup by code
async function lookupByCode(code) {
  log(`Looking up ICD-10 code: ${code}`, 'blue');
  
  // Search for the code
  const results = await search(code, { maxResults: 5 });
  
  // Find exact match
  const exactMatch = results.find(r => r.code === code || r.code.startsWith(code));
  
  if (exactMatch) {
    return await getEntity(exactMatch.id);
  }
  
  return null;
}

// Test API connection
async function test() {
  log('Testing WHO ICD API connection...', 'cyan');
  console.log('');
  
  try {
    // Get token
    const token = await getToken();
    log('✓ Authentication successful', 'green');
    console.log('');
    
    // Test search
    log('Testing search for "diabetes"...', 'blue');
    const results = await search('diabetes', { maxResults: 3 });
    
    log(`✓ Found ${results.length} results:`, 'green');
    results.forEach((r, i) => {
      log(`  ${i + 1}. ${r.code} - ${r.title}`, 'dim');
    });
    console.log('');
    
    // Test entity lookup
    if (results.length > 0) {
      log(`Testing entity lookup for ${results[0].code}...`, 'blue');
      const entity = await getEntity(results[0].id);
      log(`✓ Retrieved: ${entity.code} - ${entity.title}`, 'green');
      if (entity.definition) {
        log(`  Definition: ${entity.definition.substring(0, 100)}...`, 'dim');
      }
    }
    
    console.log('');
    log('✓ All tests passed! API is working correctly.', 'green');
    
  } catch (err) {
    log('✗ Test failed:', 'red');
    log(err.message, 'red');
    
    if (err.message.includes('credentials')) {
      console.log('');
      log('Setup required:', 'yellow');
      log('1. Register at: https://icd.who.int/icdapi', 'yellow');
      log('2. Get your credentials', 'yellow');
      log('3. Set environment variables or create .env file:', 'yellow');
      log('   ICD_CLIENT_ID=your_client_id', 'dim');
      log('   ICD_CLIENT_SECRET=your_client_secret', 'dim');
    }
    
    process.exit(1);
  }
}

// CLI interface
async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const query = args.slice(1).join(' ');
  
  if (!command || command === 'help' || command === '--help') {
    console.log('');
    log('WHO ICD-10 API Wrapper', 'bright');
    console.log('');
    log('Commands:', 'cyan');
    log('  test                    Test API connection', 'dim');
    log('  search <query>          Search for conditions', 'dim');
    log('  get <code>              Get details for ICD code', 'dim');
    log('  lookup <code>           Alias for get', 'dim');
    console.log('');
    log('Examples:', 'cyan');
    log('  node icd-api.js test', 'dim');
    log('  node icd-api.js search "diabetes"', 'dim');
    log('  node icd-api.js get E11', 'dim');
    console.log('');
    return;
  }
  
  try {
    switch (command) {
      case 'test':
        await test();
        break;
        
      case 'search':
        if (!query) {
          log('Error: Missing search query', 'red');
          process.exit(1);
        }
        
        log(`Searching ICD-10 for: "${query}"`, 'blue');
        const results = await search(query);
        
        console.log('');
        log(`Found ${results.length} results:`, 'green');
        console.log('');
        
        results.forEach((r, i) => {
          log(`[${i + 1}] ${r.code}`, 'bright');
          log(`    ${r.title}`, 'cyan');
          log(`    Score: ${r.score.toFixed(2)}`, 'dim');
          console.log('');
        });
        break;
        
      case 'get':
      case 'lookup':
        if (!query) {
          log('Error: Missing ICD code', 'red');
          process.exit(1);
        }
        
        const entity = await lookupByCode(query);
        
        if (!entity) {
          log(`Code not found: ${query}`, 'red');
          process.exit(1);
        }
        
        console.log('');
        log(entity.code, 'bright');
        log(entity.title, 'cyan');
        console.log('');
        
        if (entity.definition) {
          log('Definition:', 'yellow');
          log(entity.definition, 'dim');
          console.log('');
        }
        
        if (entity.inclusion && entity.inclusion.length > 0) {
          log('Includes:', 'yellow');
          entity.inclusion.forEach(inc => {
            log(`  • ${inc.label?.['@value'] || inc}`, 'dim');
          });
          console.log('');
        }
        
        if (entity.exclusion && entity.exclusion.length > 0) {
          log('Excludes:', 'yellow');
          entity.exclusion.forEach(exc => {
            log(`  • ${exc.label?.['@value'] || exc}`, 'dim');
          });
          console.log('');
        }
        break;
        
      default:
        log(`Unknown command: ${command}`, 'red');
        log('Run with --help for usage information', 'yellow');
        process.exit(1);
    }
    
  } catch (err) {
    console.log('');
    log('Error:', 'red');
    log(err.message, 'red');
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  search,
  getEntity,
  lookupByCode,
  getToken,
};

// Run CLI if called directly
if (require.main === module) {
  cli();
}
