#!/usr/bin/env node
/**
 * Data Validation Script
 * 
 * Validates GMDN and EMDN data against source APIs/files
 * 
 * What it does:
 * 1. Samples 10 random GMDN codes from your database
 * 2. Validates each against GUDID API
 * 3. Samples 10 random EMDN codes from your chunks
 * 4. Validates each against source EMDN file
 * 5. Reports discrepancies
 * 
 * Usage:
 *   node validate-data.js
 *   node validate-data.js --gmdn-sample=20 --emdn-sample=15
 */

const fs = require('fs');
const https = require('https');
const readline = require('readline');

// Configuration
const config = {
  gmdnSampleSize: 10,
  emdnSampleSize: 10,
  gmdnDataPath: './data/gmdn-output/gmdn-codes.json',
  emdnChunksDir: './emdn-chunks',
  emdnSourceFile: './data/EMDN.txt',
  gudidApiBase: 'https://accessgudid.nlm.nih.gov/api/v3',
  delayBetweenRequests: 150, // ms (rate limiting)
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--gmdn-sample=')) {
    config.gmdnSampleSize = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--emdn-sample=')) {
    config.emdnSampleSize = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--gmdn-data=')) {
    config.gmdnDataPath = arg.split('=')[1];
  }
  if (arg.startsWith('--emdn-chunks=')) {
    config.emdnChunksDir = arg.split('=')[1];
  }
  if (arg.startsWith('--emdn-source=')) {
    config.emdnSourceFile = arg.split('=')[1];
  }
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('='.repeat(70), 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
  console.log('');
}

// Utility: Random sample from array
function randomSample(array, size) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

// Utility: Delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility: HTTPS GET request
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else if (res.statusCode === 404) {
          resolve(null); // Not found
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// GMDN Validation
async function validateGMDN() {
  section('GMDN Validation Against GUDID API');
  
  // Load GMDN data
  log('Loading GMDN data...', 'blue');
  if (!fs.existsSync(config.gmdnDataPath)) {
    log(`Error: GMDN data file not found: ${config.gmdnDataPath}`, 'red');
    return { passed: 0, failed: 0, errors: 0 };
  }
  
  const gmdnData = JSON.parse(fs.readFileSync(config.gmdnDataPath, 'utf-8'));
  const codes = gmdnData.codes || gmdnData;
  
  log(`Total GMDN codes: ${codes.length}`, 'green');
  log(`Sampling ${config.gmdnSampleSize} random codes...`, 'blue');
  
  const sample = randomSample(codes, config.gmdnSampleSize);
  
  let passed = 0;
  let failed = 0;
  let errors = 0;
  
  console.log('');
  log('Validating against GUDID API...', 'yellow');
  log('(This may take a minute due to rate limiting)', 'yellow');
  console.log('');
  
  for (let i = 0; i < sample.length; i++) {
    const code = sample[i];
    process.stdout.write(`[${i + 1}/${sample.length}] Checking GMDN ${code.code}... `);
    
    try {
      await delay(config.delayBetweenRequests);
      
      // Query GUDID API
      const url = `${config.gudidApiBase}/devices/search.json?gmdnPTCode=${code.code}`;
      const response = await httpsGet(url);
      
      if (!response || (Array.isArray(response) && response.length === 0)) {
        log('NOT FOUND', 'red');
        failed++;
        log(`  ⚠️  Code ${code.code} not found in GUDID`, 'red');
        continue;
      }
      
      // Get first device with this GMDN code
      const devices = Array.isArray(response) ? response : [response];
      const device = devices[0].gudid?.device || devices[0];
      const gudidGmdn = device.gmdnPT;
      
      if (!gudidGmdn) {
        log('NO GMDN DATA', 'yellow');
        errors++;
        continue;
      }
      
      // Compare data
      const codeMatch = gudidGmdn.gmdnPTCode === code.code;
      const nameMatch = gudidGmdn.gmdnPTName === code.termName;
      
      // Definition might be truncated in GUDID, so check if it starts the same
      const defMatch = code.definition.startsWith(gudidGmdn.gmdnPTDefinition.substring(0, 50)) ||
                       gudidGmdn.gmdnPTDefinition.startsWith(code.definition.substring(0, 50));
      
      if (codeMatch && nameMatch && defMatch) {
        log('✓ PASS', 'green');
        passed++;
      } else {
        log('✗ MISMATCH', 'red');
        failed++;
        
        if (!codeMatch) {
          log(`  Code: Expected ${code.code}, Got ${gudidGmdn.gmdnPTCode}`, 'red');
        }
        if (!nameMatch) {
          log(`  Name: Expected "${code.termName}"`, 'red');
          log(`        Got      "${gudidGmdn.gmdnPTName}"`, 'red');
        }
        if (!defMatch) {
          log(`  Definition mismatch (may be truncated)`, 'yellow');
        }
      }
      
    } catch (err) {
      log('ERROR', 'red');
      errors++;
      log(`  ⚠️  ${err.message}`, 'red');
    }
  }
  
  console.log('');
  log('GMDN Validation Results:', 'bright');
  log(`  ✓ Passed:  ${passed}`, 'green');
  log(`  ✗ Failed:  ${failed}`, 'red');
  log(`  ⚠ Errors:  ${errors}`, 'yellow');
  log(`  Accuracy:  ${((passed / sample.length) * 100).toFixed(1)}%`, 'cyan');
  
  return { passed, failed, errors };
}

// EMDN Validation
async function validateEMDN() {
  section('EMDN Validation Against Source File');
  
  log('Loading EMDN chunks...', 'blue');
  
  // Load all EMDN chunks
  if (!fs.existsSync(config.emdnChunksDir)) {
    log(`Error: EMDN chunks directory not found: ${config.emdnChunksDir}`, 'red');
    log('Run chunk-emdn.js first to create chunks', 'yellow');
    return { passed: 0, failed: 0, errors: 0 };
  }
  
  const files = fs.readdirSync(config.emdnChunksDir)
    .filter(f => f.startsWith('emdn-') && f.endsWith('.json') && f !== 'emdn-complete.json');
  
  if (files.length === 0) {
    log('Error: No EMDN chunk files found', 'red');
    return { passed: 0, failed: 0, errors: 0 };
  }
  
  // Collect all entries from chunks
  let allEntries = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(`${config.emdnChunksDir}/${file}`, 'utf-8'));
    allEntries = allEntries.concat(data.entries);
  }
  
  log(`Total EMDN codes: ${allEntries.length}`, 'green');
  log(`Sampling ${config.emdnSampleSize} random codes...`, 'blue');
  
  const sample = randomSample(allEntries, config.emdnSampleSize);
  
  // Build source file index for quick lookup
  log('Building source file index...', 'blue');
  
  if (!fs.existsSync(config.emdnSourceFile)) {
    log(`Warning: Source EMDN file not found: ${config.emdnSourceFile}`, 'yellow');
    log('Skipping source validation (can only validate internal consistency)', 'yellow');
    return { passed: 0, failed: 0, errors: 0 };
  }
  
  const sourceIndex = new Map();
  const fileStream = fs.createReadStream(config.emdnSourceFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum <= 2) continue; // Skip header
    if (!line.trim()) continue;
    
    const parts = line.split('\t');
    if (parts.length < 6) continue;
    
    const code = parts[2]?.trim();
    if (code) {
      sourceIndex.set(code, {
        category: parts[0]?.trim(),
        categoryDescription: parts[1]?.trim(),
        term: parts[3]?.trim(),
        level: parseInt(parts[4]?.trim()),
        isTerminal: parts[5]?.trim().toUpperCase() === 'YES'
      });
    }
  }
  
  log(`Source file indexed: ${sourceIndex.size} codes`, 'green');
  console.log('');
  
  let passed = 0;
  let failed = 0;
  let errors = 0;
  
  log('Validating against source file...', 'yellow');
  console.log('');
  
  for (let i = 0; i < sample.length; i++) {
    const entry = sample[i];
    process.stdout.write(`[${i + 1}/${sample.length}] Checking EMDN ${entry.code}... `);
    
    const source = sourceIndex.get(entry.code);
    
    if (!source) {
      log('NOT FOUND', 'red');
      failed++;
      log(`  ⚠️  Code ${entry.code} not found in source file`, 'red');
      continue;
    }
    
    // Compare all fields
    const categoryMatch = source.category === entry.category;
    const termMatch = source.term === entry.term;
    const levelMatch = source.level === entry.level;
    const terminalMatch = source.isTerminal === entry.isTerminal;
    
    if (categoryMatch && termMatch && levelMatch && terminalMatch) {
      log('✓ PASS', 'green');
      passed++;
    } else {
      log('✗ MISMATCH', 'red');
      failed++;
      
      if (!categoryMatch) {
        log(`  Category: Expected ${entry.category}, Got ${source.category}`, 'red');
      }
      if (!termMatch) {
        log(`  Term: Expected "${entry.term}"`, 'red');
        log(`        Got      "${source.term}"`, 'red');
      }
      if (!levelMatch) {
        log(`  Level: Expected ${entry.level}, Got ${source.level}`, 'red');
      }
      if (!terminalMatch) {
        log(`  Terminal: Expected ${entry.isTerminal}, Got ${source.isTerminal}`, 'red');
      }
    }
  }
  
  console.log('');
  log('EMDN Validation Results:', 'bright');
  log(`  ✓ Passed:  ${passed}`, 'green');
  log(`  ✗ Failed:  ${failed}`, 'red');
  log(`  ⚠ Errors:  ${errors}`, 'yellow');
  log(`  Accuracy:  ${((passed / sample.length) * 100).toFixed(1)}%`, 'cyan');
  
  return { passed, failed, errors };
}

// Main execution
async function main() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              Data Validation Script - GMDN & EMDN                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  log('Configuration:', 'blue');
  log(`  GMDN sample size: ${config.gmdnSampleSize}`, 'blue');
  log(`  EMDN sample size: ${config.emdnSampleSize}`, 'blue');
  log(`  GMDN data: ${config.gmdnDataPath}`, 'blue');
  log(`  EMDN chunks: ${config.emdnChunksDir}`, 'blue');
  log(`  EMDN source: ${config.emdnSourceFile}`, 'blue');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Validate GMDN
    const gmdnResults = await validateGMDN();
    
    // Validate EMDN
    const emdnResults = await validateEMDN();
    
    // Overall summary
    section('Overall Validation Summary');
    
    const totalTests = config.gmdnSampleSize + config.emdnSampleSize;
    const totalPassed = gmdnResults.passed + emdnResults.passed;
    const totalFailed = gmdnResults.failed + emdnResults.failed;
    const totalErrors = gmdnResults.errors + emdnResults.errors;
    
    log('Combined Results:', 'bright');
    log(`  Total tests:   ${totalTests}`, 'blue');
    log(`  ✓ Passed:      ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`, 'green');
    log(`  ✗ Failed:      ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`, 'red');
    log(`  ⚠ Errors:      ${totalErrors} (${((totalErrors / totalTests) * 100).toFixed(1)}%)`, 'yellow');
    console.log('');
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Completed in ${elapsed} seconds`, 'cyan');
    console.log('');
    
    // Recommendations
    if (totalFailed > 0 || totalErrors > 0) {
      log('⚠️  Recommendations:', 'yellow');
      
      if (gmdnResults.failed > 2) {
        log('  - GMDN: Consider re-running extract-gmdn-from-gudid.js', 'yellow');
        log('    Some codes may be outdated or incorrect', 'yellow');
      }
      
      if (emdnResults.failed > 2) {
        log('  - EMDN: Consider re-running chunk-emdn.js', 'yellow');
        log('    Chunks may not match source file', 'yellow');
      }
      
      if (totalErrors > 5) {
        log('  - Check your internet connection for API requests', 'yellow');
        log('  - Verify file paths are correct', 'yellow');
      }
      
      console.log('');
    } else {
      log('✓ All validation tests passed!', 'green');
      log('  Your data appears to be accurate and up-to-date.', 'green');
      console.log('');
    }
    
    // Exit code
    process.exit(totalFailed > 0 || totalErrors > 0 ? 1 : 0);
    
  } catch (err) {
    console.log('');
    log('Fatal Error:', 'red');
    log(err.message, 'red');
    log(err.stack, 'red');
    process.exit(1);
  }
}

// Run
main();
