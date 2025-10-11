#!/usr/bin/env node
/**
 * WHO ICD Data Fetcher and Chunker
 * 
 * Fetches ICD-10 and ICD-11 codes from the WHO ICD API v2 and creates chunked data
 * similar to the EMDN chunking system for efficient browsing and searching.
 * 
 * Requirements:
 * - WHO ICD API credentials in .env file
 * - API-Version: v2 header required
 * 
 * API Documentation: https://id.who.int/swagger/index.html
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalsIndex = trimmedLine.indexOf('=');
      if (equalsIndex > 0) {
        const key = trimmedLine.substring(0, equalsIndex).trim();
        const value = trimmedLine.substring(equalsIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

// Configuration
const config = {
  clientId: process.env.ICD_CLIENT_ID || '',
  clientSecret: process.env.ICD_CLIENT_SECRET || '',
  tokenUrl: 'https://icdaccessmanagement.who.int/connect/token',
  apiBase: 'https://id.who.int/icd',
  tokenFile: './.icd-token.json',
  outputDir: './public/icd-chunks',
  chunkSize: 1000, // codes per chunk
};

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    dim: '\x1b[2m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
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
    throw new Error('ICD API credentials not configured. Check .env file.');
  }
  
  log('Requesting new token from WHO ICD API...', 'blue');
  
  const data = `client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}&scope=icdapi_access&grant_type=client_credentials`;
  
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

// Fetch ICD-10 releases
async function getIcd10Releases() {
  const token = await getToken();
  
  const url = `${config.apiBase}/release/10`;
  
  const response = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'API-Version': 'v2',
      'Accept-Language': 'en',
    },
  });
  
  return response;
}

// Fetch ICD-11 releases  
async function getIcd11Releases(linearizationName = 'mms') {
  const token = await getToken();
  
  const url = `${config.apiBase}/release/11/${linearizationName}`;
  
  const response = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'API-Version': 'v2',
      'Accept-Language': 'en',
    },
  });
  
  return response;
}

// Fetch ICD-10 specific release
async function getIcd10Release(releaseId) {
  const token = await getToken();
  
  const url = `${config.apiBase}/release/10/${releaseId}`;
  
  const response = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'API-Version': 'v2',
      'Accept-Language': 'en',
    },
  });
  
  return response;
}

// Fetch ICD-10 entities recursively
async function fetchIcd10Entities(releaseId, code = null) {
  const token = await getToken();
  
  let url;
  if (code) {
    url = `${config.apiBase}/release/10/${releaseId}/${code}`;
  } else {
    url = `${config.apiBase}/release/10/${releaseId}`;
  }
  
  try {
    const response = await httpsRequest(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'API-Version': 'v2',
        'Accept-Language': 'en',
      },
    });
    
    const entities = [];
    
    // Extract current entity info
    if (response.code || response['@id']) {
      const entity = {
        id: response['@id'] || `icd10-${response.code}`,
        code: response.code || code,
        title: response.title ? response.title['@value'] : response.title || 'Unknown',
        definition: response.definition ? response.definition['@value'] : response.definition || '',
        chapter: response.chapter || '',
        chapterTitle: response.chapterTitle || '',
        blockId: response.blockId || '',
        version: 'ICD-10',
        releaseId: releaseId
      };
      
      entities.push(entity);
      log(`Fetched ICD-10: ${entity.code} - ${entity.title}`, 'cyan');
    }
    
    // Fetch children if they exist
    if (response.child && Array.isArray(response.child)) {
      for (const child of response.child) {
        if (child.code) {
          const childEntities = await fetchIcd10Entities(releaseId, child.code);
          entities.push(...childEntities);
        }
      }
    }
    
    return entities;
  } catch (error) {
    log(`Error fetching ICD-10 ${code || 'root'}: ${error.message}`, 'red');
    return [];
  }
}

// Recursively fetch ICD entities
async function fetchIcdEntities(entityUrl, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) {
    return [];
  }
  
  const token = await getToken();
  
  try {
    // Convert http to https
    const httpsUrl = entityUrl.replace('http://', 'https://');
    
    const response = await httpsRequest(httpsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'API-Version': 'v2',
        'Accept-Language': 'en',
      },
    });
    
    const entities = [];
    
    // Extract current entity info
    if (response['@id']) {
      const entity = {
        id: response['@id'],
        code: response.code || extractCodeFromId(response['@id']),
        title: response.title ? response.title['@value'] : 'Unknown',
        definition: response.definition ? response.definition['@value'] : '',
        chapter: response.chapter || '',
        chapterTitle: response.chapterTitle || '',
        blockId: response.blockId || '',
        classKind: response.classKind || '',
        depth: depth
      };
      
      entities.push(entity);
      log(`Fetched: ${entity.code} - ${entity.title}`, 'cyan');
    }
    
    // Recursively fetch children
    if (response.child && Array.isArray(response.child)) {
      for (const child of response.child) {
        if (child['@id']) {
          const childEntities = await fetchIcdEntities(child['@id'], depth + 1, maxDepth);
          entities.push(...childEntities);
        }
      }
    }
    
    return entities;
  } catch (error) {
    log(`Error fetching ${entityUrl}: ${error.message}`, 'red');
    return [];
  }
}

// Extract code from ICD ID
function extractCodeFromId(id) {
  const match = id.match(/\/([^\/]+)$/);
  return match ? match[1] : id;
}

// Create chunks from ICD entities
function createChunks(entities, chunkSize) {
  const chunks = [];
  
  for (let i = 0; i < entities.length; i += chunkSize) {
    const chunk = entities.slice(i, i + chunkSize);
    chunks.push({
      id: Math.floor(i / chunkSize),
      startIndex: i,
      endIndex: Math.min(i + chunkSize - 1, entities.length - 1),
      count: chunk.length,
      entities: chunk
    });
  }
  
  return chunks;
}

// Create manifest file
function createManifest(chunks, entities, releaseInfo) {
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    source: 'WHO ICD API v2',
    release: releaseInfo,
    totalEntries: entities.length,
    totalChunks: chunks.length,
    chunkSize: config.chunkSize,
    chunks: chunks.map(chunk => ({
      id: chunk.id,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      count: chunk.count,
      file: `chunk-${chunk.id}.json`
    }))
  };
}

// Main execution - fetch and chunk ICD-10 data
async function main() {
  try {
    log('🏥 WHO ICD Data Fetcher and Chunker', 'magenta');
    log('=====================================', 'dim');
    
    // Create output directory
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    // Get available ICD-10 releases
    log('Fetching ICD-10 releases...', 'blue');
    const icd10Info = await getIcd10Releases();
    
    // Extract release ID from the latest release URL
    const latestReleaseUrl = icd10Info.latestRelease;
    const releaseId = latestReleaseUrl.split('/').pop(); // e.g., "2019"
    
    log(`Using ICD-10 release: ${releaseId}`, 'yellow');
    
    // Fetch the release details to get chapters
    log('Fetching ICD-10 release details...', 'blue');
    const releaseDetails = await getIcd10Release(releaseId);
    
    log(`Release title: ${releaseDetails.title ? releaseDetails.title['@value'] : 'Unknown'}`, 'cyan');
    
    // Fetch ICD-10 entities starting from chapters
    log('Fetching ICD-10 entities...', 'blue');
    const allEntities = [];
    
    if (releaseDetails.child && Array.isArray(releaseDetails.child)) {
      log(`Found ${releaseDetails.child.length} chapters`, 'green');
      
      // Limit to first 3 chapters for initial testing
      const chaptersToFetch = releaseDetails.child.slice(0, 3);
      
      for (const chapterUrl of chaptersToFetch) {
        if (chapterUrl && typeof chapterUrl === 'string') {
          const chapterCode = chapterUrl.split('/').pop(); // Extract code from URL like "/I"
          log(`Fetching chapter: ${chapterCode}`, 'yellow');
          const entities = await fetchIcd10Entities(releaseId, chapterCode);
          allEntities.push(...entities);
          
          // Add a delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    log(`Fetched ${allEntities.length} total ICD-10 entities`, 'green');
    
    if (allEntities.length === 0) {
      throw new Error('No ICD-10 entities found');
    }
    
    // Create chunks
    log('Creating chunks...', 'blue');
    const chunks = createChunks(allEntities, config.chunkSize);
    
    // Save chunks
    for (const chunk of chunks) {
      const chunkFile = path.join(config.outputDir, `icd10-chunk-${chunk.id}.json`);
      fs.writeFileSync(chunkFile, JSON.stringify(chunk.entities, null, 2));
      log(`Saved ICD-10 chunk ${chunk.id} (${chunk.count} entities)`, 'dim');
    }
    
    // Create and save manifest
    const manifest = createManifest(chunks, allEntities, {
      releaseId: releaseId,
      title: releaseDetails.title ? releaseDetails.title['@value'] : 'ICD-10',
      description: 'International Classification of Diseases 10th Revision',
      version: 'ICD-10'
    });
    
    const manifestFile = path.join(config.outputDir, 'icd10-manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    log('✓ ICD-10 chunking completed successfully!', 'green');
    log(`Total entities: ${allEntities.length}`, 'white');
    log(`Total chunks: ${chunks.length}`, 'white');
    log(`Output directory: ${config.outputDir}`, 'white');
    log(`Manifest file: icd10-manifest.json`, 'white');
    
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Command line handling
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'releases') {
    getIcd10Releases().then(releases => {
      console.log('ICD-10 API Response:');
      console.log(JSON.stringify(releases, null, 2));
    }).catch(err => {
      console.error('Error:', err.message);
    });
  } else if (command === 'test') {
    getToken().then(token => {
      console.log('✓ Authentication successful');
      console.log('Token length:', token.length);
    }).catch(err => {
      console.error('✗ Authentication failed:', err.message);
    });
  } else {
    main();
  }
}