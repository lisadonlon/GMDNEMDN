#!/usr/bin/env node
/**
 * GMDN to ICD-10 Mapper
 * 
 * Maps GMDN device codes to ICD-10 diagnosis codes based on clinical indications
 * 
 * Prerequisites:
 * 1. WHO ICD API credentials configured (see icd-api.js)
 * 2. GMDN data available (gmdn-from-gudid.json)
 * 
 * Usage:
 *   node map-gmdn-to-icd10.js
 *   node map-gmdn-to-icd10.js --sample=50   # Test with sample first
 */

const fs = require('fs');
const path = require('path');
const icdApi = require('./icd-api.cjs');

// Configuration
const config = {
  gmdnDataPath: './data/gmdnFromGUDID.ts',
  outputDir: './icd10-mappings',
  sampleSize: null,
  delayBetweenRequests: 200,
  minConfidence: 0.5,
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--sample=')) {
    config.sampleSize = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--confidence=')) {
    config.minConfidence = parseFloat(arg.split('=')[1]);
  }
  if (arg.startsWith('--gmdn-data=')) {
    config.gmdnDataPath = arg.split('=')[1];
  }
});

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

function section(title) {
  console.log('');
  log('═'.repeat(70), 'cyan');
  log(title, 'bright');
  log('═'.repeat(70), 'cyan');
  console.log('');
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Manual mappings for common GMDN codes
const MANUAL_MAPPINGS = {
  // Cardiac devices
  '35177': [ // Pacemaker, cardiac
    { code: 'I49.5', indication: 'Sick sinus syndrome', confidence: 100 },
    { code: 'I44.2', indication: 'Atrioventricular block, complete', confidence: 100 },
  ],
  '32811': [ // Defibrillator, external, automated
    { code: 'I46.9', indication: 'Cardiac arrest', confidence: 100 },
    { code: 'I49.0', indication: 'Ventricular fibrillation', confidence: 100 },
  ],
  '47582': [ // Stent, coronary artery
    { code: 'I25.1', indication: 'Atherosclerotic heart disease', confidence: 100 },
    { code: 'I21.9', indication: 'Acute myocardial infarction', confidence: 95 },
  ],
  
  // Orthopaedic implants
  '35350': [ // Prosthesis, hip, femoral
    { code: 'M16', indication: 'Coxarthrosis', confidence: 100 },
    { code: 'S72.0', indication: 'Fracture of neck of femur', confidence: 95 },
  ],
  '35357': [ // Prosthesis, knee, femoral
    { code: 'M17', indication: 'Gonarthrosis', confidence: 100 },
  ],
  
  // Diabetes
  '40120': [ // Pump, insulin, portable
    { code: 'E10', indication: 'Type 1 diabetes mellitus', confidence: 100 },
    { code: 'E11', indication: 'Type 2 diabetes mellitus', confidence: 85 },
  ],
  
  // Respiratory
  '38528': [ // Ventilator, intensive-care
    { code: 'J96.0', indication: 'Acute respiratory failure', confidence: 100 },
    { code: 'J96.1', indication: 'Chronic respiratory failure', confidence: 100 },
  ],
  
  // Ophthalmic
  '35878': [ // Lens, intraocular, posterior-chamber
    { code: 'H25', indication: 'Senile cataract', confidence: 100 },
    { code: 'H26', indication: 'Other cataract', confidence: 95 },
  ],
  
  // Dialysis
  '41093': [ // System, haemodialysis
    { code: 'N18.5', indication: 'Chronic kidney disease, stage 5', confidence: 100 },
    { code: 'N17', indication: 'Acute kidney failure', confidence: 95 },
  ],
};

// Enhanced keyword extraction for GMDN terms
function extractKeywords(term, definition) {
  const text = `${term} ${definition || ''}`.toLowerCase();
  
  // Medical condition keywords to search for
  const conditionKeywords = [];
  
  // Cardiac conditions
  if (text.match(/heart|cardiac|myocardial/)) {
    if (text.includes('block')) conditionKeywords.push('heart block');
    if (text.includes('arrhythmia')) conditionKeywords.push('cardiac arrhythmia');
    if (text.includes('infarction')) conditionKeywords.push('myocardial infarction');
    if (text.includes('failure')) conditionKeywords.push('heart failure');
    if (text.includes('coronary')) conditionKeywords.push('coronary artery disease');
  }
  
  // Diabetes
  if (text.match(/insulin|diabetes|glucose/)) {
    conditionKeywords.push('diabetes mellitus');
  }
  
  // Respiratory
  if (text.match(/respiratory|ventilat|breath/)) {
    if (text.includes('failure')) conditionKeywords.push('respiratory failure');
    if (text.includes('apnoea') || text.includes('apnea')) conditionKeywords.push('sleep apnoea');
  }
  
  // Renal
  if (text.match(/kidney|renal|dialysis/)) {
    conditionKeywords.push('kidney disease', 'renal failure');
  }
  
  // Orthopaedic
  if (text.match(/hip|knee|joint|arthroplasty/)) {
    if (text.includes('hip')) conditionKeywords.push('hip osteoarthritis');
    if (text.includes('knee')) conditionKeywords.push('knee osteoarthritis');
    conditionKeywords.push('osteoarthritis', 'joint disease');
  }
  
  // Ophthalmic
  if (text.match(/eye|ocular|lens|vision/)) {
    if (text.includes('cataract')) conditionKeywords.push('cataract');
    if (text.includes('glaucoma')) conditionKeywords.push('glaucoma');
  }
  
  // Neurological
  if (text.match(/neuro|brain|spinal/)) {
    if (text.includes('parkinson')) conditionKeywords.push("parkinson's disease");
    if (text.includes('epilep')) conditionKeywords.push('epilepsy');
  }
  
  return [...new Set(conditionKeywords)];
}

// Load GMDN data
function loadGmdnData() {
  log('Loading GMDN data...', 'blue');
  
  if (!fs.existsSync(config.gmdnDataPath)) {
    throw new Error(`GMDN data file not found: ${config.gmdnDataPath}`);
  }
  
  // Read TypeScript file and extract data
  const tsContent = fs.readFileSync(config.gmdnDataPath, 'utf-8');
  const dataStart = tsContent.indexOf('export const gmdnFromGUDID: SecondaryCode[] = [');
  const dataEnd = tsContent.lastIndexOf('];');
  
  if (dataStart === -1 || dataEnd === -1) {
    throw new Error('Could not parse GMDN data from TypeScript file');
  }
  
  // Extract JSON array content
  const arrayContent = tsContent.substring(dataStart + 47, dataEnd + 1);
  const codes = eval(arrayContent); // Using eval for array literal - be careful in production!
  
  // Sample if specified
  if (config.sampleSize) {
    const sampled = codes
      .sort(() => 0.5 - Math.random())
      .slice(0, config.sampleSize);
    log(`Sampled ${sampled.length} codes for testing`, 'yellow');
    return sampled;
  }
  
  log(`✓ Loaded ${codes.length} GMDN codes`, 'green');
  return codes;
}

// Search ICD-10 for device indications
async function searchIndications(gmdnCode) {
  const keywords = extractKeywords(gmdnCode.description, gmdnCode.definition || '');
  const results = [];
  
  if (keywords.length === 0) {
    return results;
  }
  
  for (const keyword of keywords) {
    try {
      await delay(config.delayBetweenRequests);
      
      const searchResults = await icdApi.search(keyword, { maxResults: 3 });
      
      searchResults.forEach(result => {
        results.push({
          code: result.code,
          indication: result.title,
          confidence: Math.round(result.score * 100),
          source: 'auto',
        });
      });
      
    } catch (err) {
      log(`  Warning: Search failed for "${keyword}": ${err.message}`, 'yellow');
    }
  }
  
  return results;
}

// Create mappings
async function createMappings(gmdnData) {
  section('Creating GMDN → ICD-10 Mappings');
  
  log(`Processing ${gmdnData.length} GMDN codes...`, 'blue');
  log('This will take a while due to API rate limiting...', 'yellow');
  console.log('');
  
  const mappings = [];
  let mapped = 0;
  let unmapped = 0;
  let errorCount = 0;
  
  for (let i = 0; i < gmdnData.length; i++) {
    const gmdn = gmdnData[i];
    
    // Progress indicator
    process.stdout.write(`\r[${i + 1}/${gmdnData.length}] ${gmdn.code} - ${gmdn.description.substring(0, 40)}...`);
    
    try {
      // Check manual mappings first
      let icdMatches = [];
      
      if (MANUAL_MAPPINGS[gmdn.code]) {
        icdMatches = MANUAL_MAPPINGS[gmdn.code].map(m => ({
          ...m,
          source: 'manual',
        }));
      }
      
      // If no manual mapping, try automatic
      if (icdMatches.length === 0) {
        icdMatches = await searchIndications(gmdn);
      }
      
      // Filter by confidence
      icdMatches = icdMatches.filter(m => m.confidence >= config.minConfidence * 100);
      
      // Remove duplicates
      const seen = new Set();
      icdMatches = icdMatches.filter(m => {
        if (seen.has(m.code)) return false;
        seen.add(m.code);
        return true;
      });
      
      if (icdMatches.length > 0) {
        mapped++;
        mappings.push({
          gmdnCode: gmdn.code,
          gmdnTerm: gmdn.description,
          gmdnDefinition: gmdn.definition || '',
          icdMatches: icdMatches.slice(0, 5),
        });
      } else {
        unmapped++;
      }
      
    } catch (err) {
      errorCount++;
      log(`\nError processing ${gmdn.code}: ${err.message}`, 'red');
    }
  }
  
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
  
  console.log('');
  log(`✓ Mapping complete`, 'green');
  log(`  Mapped: ${mapped} GMDN codes`, 'cyan');
  log(`  Unmapped: ${unmapped} GMDN codes`, 'yellow');
  log(`  Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'dim');
  log(`  Success rate: ${((mapped / gmdnData.length) * 100).toFixed(1)}%`, 'cyan');
  
  return mappings;
}

// Save mappings
function saveMappings(mappings) {
  section('Saving Mappings');
  
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Save complete mappings
  const completeFile = path.join(config.outputDir, 'gmdn-icd10-mappings.json');
  fs.writeFileSync(completeFile, JSON.stringify({
    metadata: {
      totalMappings: mappings.length,
      generatedAt: new Date().toISOString(),
      minConfidence: config.minConfidence,
      icdVersion: '10/2019',
    },
    mappings,
  }, null, 2));
  log(`✓ Saved complete mappings: ${completeFile}`, 'green');
  
  // Save high-confidence mappings only
  const highConfidence = mappings.filter(m => 
    m.icdMatches.some(icd => icd.confidence >= 80)
  );
  const highConfFile = path.join(config.outputDir, 'gmdn-high-confidence.json');
  fs.writeFileSync(highConfFile, JSON.stringify({
    metadata: {
      totalMappings: highConfidence.length,
      minConfidence: 80,
      generatedAt: new Date().toISOString(),
    },
    mappings: highConfidence,
  }, null, 2));
  log(`✓ Saved high-confidence mappings (≥80%): ${highConfidence.length}`, 'green');
  
  // Create lookup index
  const lookupIndex = {};
  mappings.forEach(m => {
    lookupIndex[m.gmdnCode] = m.icdMatches.map(icd => icd.code);
  });
  const indexFile = path.join(config.outputDir, 'gmdn-lookup-index.json');
  fs.writeFileSync(indexFile, JSON.stringify(lookupIndex, null, 2));
  log(`✓ Saved lookup index`, 'green');
}

// Display sample mappings
function displaySamples(mappings) {
  section('Sample Mappings');
  
  const samples = mappings
    .filter(m => m.icdMatches.length > 0)
    .sort((a, b) => b.icdMatches[0].confidence - a.icdMatches[0].confidence)
    .slice(0, 10);
  
  samples.forEach((mapping, index) => {
    log(`[${index + 1}] GMDN ${mapping.gmdnCode}`, 'bright');
    log(`    ${mapping.gmdnTerm}`, 'cyan');
    log(`    ICD-10 Indications:`, 'yellow');
    
    mapping.icdMatches.slice(0, 3).forEach(icd => {
      const source = icd.source === 'manual' ? '📌' : '🤖';
      log(`      ${source} ${icd.code} - ${icd.indication} (${icd.confidence}%)`, 'dim');
    });
    
    console.log('');
  });
}

// Main execution
async function main() {
  console.log('');
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          GMDN → ICD-10 Mapping Generator                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  log('Configuration:', 'blue');
  log(`  Min confidence: ${(config.minConfidence * 100).toFixed(0)}%`, 'blue');
  log(`  Sample size: ${config.sampleSize || 'Full dataset'}`, 'blue');
  console.log('');
  
  try {
    // Test API connection
    log('Testing WHO ICD API connection...', 'blue');
    await icdApi.getToken();
    log('✓ API connection successful', 'green');
    console.log('');
    
    // Load data
    const gmdnData = loadGmdnData();
    
    // Create mappings
    const mappings = await createMappings(gmdnData);
    
    // Save results
    saveMappings(mappings);
    
    // Display samples
    displaySamples(mappings);
    
    section('Complete');
    
    log('✓ GMDN → ICD-10 mappings created successfully!', 'green');
    console.log('');
    log('Next steps:', 'bright');
    log('1. Review mappings in: ' + config.outputDir, 'blue');
    log('2. Add manual mappings for your key devices', 'blue');
    log('3. Integrate into your web application', 'blue');
    console.log('');
    
  } catch (err) {
    console.log('');
    log('Error:', 'red');
    log(err.message, 'red');
    
    if (err.message.includes('credentials')) {
      console.log('');
      log('Setup required:', 'yellow');
      log('1. Register at: https://icd.who.int/icdapi', 'yellow');
      log('2. Configure credentials (see icd-api.js)', 'yellow');
      log('3. Run: node icd-api.js test', 'yellow');
    }
    
    if (err.stack) {
      console.log(err.stack);
    }
    process.exit(1);
  }
}

main();
