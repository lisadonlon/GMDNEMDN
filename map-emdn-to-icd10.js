#!/usr/bin/env node
/**
 * EMDN to ICD-10 Mapper
 * 
 * Maps EMDN device codes to ICD-10 diagnosis codes based on clinical indications
 * 
 * Prerequisites:
 * 1. WHO ICD API credentials configured (see icd-api.js)
 * 2. EMDN chunks available in ./emdn-chunks/
 * 
 * Usage:
 *   node map-emdn-to-icd10.js
 *   node map-emdn-to-icd10.js --category=J  # Active implantable only
 *   node map-emdn-to-icd10.js --sample=50   # Test with sample first
 */

const fs = require('fs');
const path = require('path');
const icdApi = require('./icd-api.js');

// Configuration
const config = {
  emdnChunksDir: './emdn-chunks',
  outputDir: './icd10-mappings',
  sampleSize: null, // Set to number for testing, null for full run
  filterCategory: null,
  delayBetweenRequests: 200, // ms - be respectful to WHO API
  minConfidence: 0.5,
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--category=')) {
    config.filterCategory = arg.split('=')[1].toUpperCase();
  }
  if (arg.startsWith('--sample=')) {
    config.sampleSize = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--confidence=')) {
    config.minConfidence = parseFloat(arg.split('=')[1]);
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

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Manual mappings for common devices (high confidence)
const MANUAL_MAPPINGS = {
  // Active implantable - Cardiac
  'J0201': [ // Cardiac pacemakers
    { code: 'I49.5', indication: 'Sick sinus syndrome', confidence: 100 },
    { code: 'I44.2', indication: 'Atrioventricular block, complete', confidence: 100 },
    { code: 'I44.1', indication: 'Atrioventricular block, second degree', confidence: 95 },
    { code: 'I45.9', indication: 'Conduction disorder, unspecified', confidence: 90 },
  ],
  'J0301': [ // Implantable defibrillators
    { code: 'I47.2', indication: 'Ventricular tachycardia', confidence: 100 },
    { code: 'I49.0', indication: 'Ventricular fibrillation', confidence: 100 },
    { code: 'I42.0', indication: 'Dilated cardiomyopathy', confidence: 95 },
  ],
  
  // Cardiovascular
  'C0103': [ // Coronary stents
    { code: 'I25.1', indication: 'Atherosclerotic heart disease', confidence: 100 },
    { code: 'I21.9', indication: 'Acute myocardial infarction', confidence: 95 },
    { code: 'I20.0', indication: 'Unstable angina', confidence: 90 },
  ],
  'E0201': [ // Heart valves
    { code: 'I35.0', indication: 'Aortic valve stenosis', confidence: 100 },
    { code: 'I34.0', indication: 'Mitral valve insufficiency', confidence: 100 },
    { code: 'I08.0', indication: 'Rheumatic disorders of both mitral and aortic valves', confidence: 90 },
  ],
  
  // Diabetes
  'B0309': [ // Insulin pumps
    { code: 'E10', indication: 'Type 1 diabetes mellitus', confidence: 100 },
    { code: 'E11', indication: 'Type 2 diabetes mellitus', confidence: 85 },
  ],
  
  // Orthopaedics
  'N0101': [ // Hip prostheses
    { code: 'M16', indication: 'Coxarthrosis (hip osteoarthritis)', confidence: 100 },
    { code: 'S72.0', indication: 'Fracture of neck of femur', confidence: 95 },
    { code: 'M87.0', indication: 'Idiopathic aseptic necrosis of bone', confidence: 90 },
  ],
  'N0201': [ // Knee prostheses
    { code: 'M17', indication: 'Gonarthrosis (knee osteoarthritis)', confidence: 100 },
    { code: 'M23.8', indication: 'Other internal derangements of knee', confidence: 85 },
  ],
  
  // Neurological
  'J0601': [ // Deep brain stimulators
    { code: 'G20', indication: "Parkinson's disease", confidence: 100 },
    { code: 'G25.5', indication: 'Other chorea', confidence: 90 },
    { code: 'G24', indication: 'Dystonia', confidence: 90 },
  ],
  
  // Respiratory
  'F0201': [ // Ventilators
    { code: 'J96.0', indication: 'Acute respiratory failure', confidence: 100 },
    { code: 'J96.1', indication: 'Chronic respiratory failure', confidence: 100 },
    { code: 'G47.3', indication: 'Sleep apnoea', confidence: 85 },
  ],
  
  // Ophthalmology
  'Q0301': [ // Intraocular lenses
    { code: 'H25', indication: 'Senile cataract', confidence: 100 },
    { code: 'H26', indication: 'Other cataract', confidence: 95 },
  ],
  
  // Hearing
  'Y2145': [ // Hearing aids
    { code: 'H90', indication: 'Conductive and sensorineural hearing loss', confidence: 100 },
    { code: 'H91.2', indication: 'Sudden idiopathic hearing loss', confidence: 90 },
  ],
  
  // Dialysis
  'D0601': [ // Haemodialysis devices
    { code: 'N18.5', indication: 'Chronic kidney disease, stage 5', confidence: 100 },
    { code: 'N17', indication: 'Acute kidney failure', confidence: 95 },
  ],
};

// Device indication keywords (for automatic matching)
const DEVICE_INDICATIONS = {
  'pacemaker': ['heart block', 'bradycardia', 'sick sinus', 'conduction disorder'],
  'defibrillator': ['ventricular tachycardia', 'ventricular fibrillation', 'cardiac arrest'],
  'stent': ['coronary artery', 'atherosclerosis', 'myocardial infarction', 'angina'],
  'valve': ['valve stenosis', 'valve insufficiency', 'valve regurgitation'],
  'prosthes': ['osteoarthritis', 'fracture', 'arthritis', 'joint disease'],
  'insulin': ['diabetes mellitus'],
  'ventilator': ['respiratory failure', 'sleep apnoea'],
  'dialysis': ['kidney disease', 'renal failure'],
  'catheter': ['vascular access', 'urinary retention'],
  'lens': ['cataract'],
  'hearing': ['hearing loss', 'deafness'],
  'wheelchair': ['paraplegia', 'mobility impairment', 'muscular dystrophy'],
};

// Load EMDN data
function loadEmdnData() {
  log('Loading EMDN data...', 'blue');
  
  if (!fs.existsSync(config.emdnChunksDir)) {
    throw new Error(`EMDN chunks directory not found: ${config.emdnChunksDir}`);
  }
  
  const files = fs.readdirSync(config.emdnChunksDir)
    .filter(f => f.startsWith('emdn-') && f.endsWith('.json') && f !== 'emdn-complete.json');
  
  let allEntries = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(`${config.emdnChunksDir}/${file}`, 'utf-8'));
    allEntries = allEntries.concat(data.entries);
  }
  
  // Filter by category if specified
  if (config.filterCategory) {
    allEntries = allEntries.filter(e => e.category === config.filterCategory);
    log(`Filtered to category ${config.filterCategory}: ${allEntries.length} codes`, 'cyan');
  }
  
  // Sample if specified
  if (config.sampleSize) {
    allEntries = allEntries
      .sort(() => 0.5 - Math.random())
      .slice(0, config.sampleSize);
    log(`Sampled ${allEntries.length} codes for testing`, 'yellow');
  }
  
  log(`✓ Loaded ${allEntries.length} EMDN codes`, 'green');
  return allEntries;
}

// Extract indication keywords from device term
function extractIndicationKeywords(term) {
  const termLower = term.toLowerCase();
  const foundKeywords = [];
  
  for (const [keyword, indications] of Object.entries(DEVICE_INDICATIONS)) {
    if (termLower.includes(keyword)) {
      foundKeywords.push(...indications);
    }
  }
  
  return [...new Set(foundKeywords)]; // Remove duplicates
}

// Search ICD-10 for device indications
async function searchIndications(emdnEntry) {
  const keywords = extractIndicationKeywords(emdnEntry.term);
  const results = [];
  
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
async function createMappings(emdnData) {
  section('Creating EMDN → ICD-10 Mappings');
  
  log(`Processing ${emdnData.length} EMDN codes...`, 'blue');
  log('This will take a while due to API rate limiting...', 'yellow');
  console.log('');
  
  const mappings = [];
  let mapped = 0;
  let unmapped = 0;
  let errorCount = 0;
  
  for (let i = 0; i < emdnData.length; i++) {
    const emdn = emdnData[i];
    
    // Progress indicator
    process.stdout.write(`\r[${i + 1}/${emdnData.length}] ${emdn.code} - ${emdn.term.substring(0, 40)}...`);
    
    try {
      // Check manual mappings first
      let icdMatches = [];
      
      if (MANUAL_MAPPINGS[emdn.code]) {
        icdMatches = MANUAL_MAPPINGS[emdn.code].map(m => ({
          ...m,
          source: 'manual',
        }));
      }
      
      // If no manual mapping, try automatic
      if (icdMatches.length === 0) {
        icdMatches = await searchIndications(emdn);
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
          emdnCode: emdn.code,
          emdnTerm: emdn.term,
          emdnCategory: emdn.category,
          emdnLevel: emdn.level,
          icdMatches: icdMatches.slice(0, 5), // Top 5 matches
        });
      } else {
        unmapped++;
      }
      
    } catch (err) {
      errorCount++;
      log(`\nError processing ${emdn.code}: ${err.message}`, 'red');
    }
  }
  
  process.stdout.write('\r' + ' '.repeat(100) + '\r'); // Clear progress line
  
  console.log('');
  log(`✓ Mapping complete`, 'green');
  log(`  Mapped: ${mapped} EMDN codes`, 'cyan');
  log(`  Unmapped: ${unmapped} EMDN codes`, 'yellow');
  log(`  Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'dim');
  log(`  Success rate: ${((mapped / emdnData.length) * 100).toFixed(1)}%`, 'cyan');
  
  return mappings;
}

// Save mappings
function saveMappings(mappings) {
  section('Saving Mappings');
  
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Save complete mappings
  const completeFile = path.join(config.outputDir, 'emdn-icd10-mappings.json');
  fs.writeFileSync(completeFile, JSON.stringify({
    metadata: {
      totalMappings: mappings.length,
      generatedAt: new Date().toISOString(),
      minConfidence: config.minConfidence,
      filterCategory: config.filterCategory,
      icdVersion: '10/2019',
    },
    mappings,
  }, null, 2));
  log(`✓ Saved complete mappings: ${completeFile}`, 'green');
  
  // Save by category
  const byCategory = {};
  mappings.forEach(m => {
    if (!byCategory[m.emdnCategory]) {
      byCategory[m.emdnCategory] = [];
    }
    byCategory[m.emdnCategory].push(m);
  });
  
  Object.entries(byCategory).forEach(([category, codes]) => {
    const categoryFile = path.join(config.outputDir, `emdn-category-${category}.json`);
    fs.writeFileSync(categoryFile, JSON.stringify({ category, count: codes.length, mappings: codes }, null, 2));
    log(`✓ Saved category ${category}: ${codes.length} mappings`, 'dim');
  });
  
  // Save high-confidence mappings only
  const highConfidence = mappings.filter(m => 
    m.icdMatches.some(icd => icd.confidence >= 80)
  );
  const highConfFile = path.join(config.outputDir, 'emdn-high-confidence.json');
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
    lookupIndex[m.emdnCode] = m.icdMatches.map(icd => icd.code);
  });
  const indexFile = path.join(config.outputDir, 'emdn-lookup-index.json');
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
    log(`[${index + 1}] EMDN ${mapping.emdnCode}`, 'bright');
    log(`    ${mapping.emdnTerm}`, 'cyan');
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
  log('║          EMDN → ICD-10 Mapping Generator                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  log('Configuration:', 'blue');
  log(`  Min confidence: ${(config.minConfidence * 100).toFixed(0)}%`, 'blue');
  log(`  Filter category: ${config.filterCategory || 'All'}`, 'blue');
  log(`  Sample size: ${config.sampleSize || 'Full dataset'}`, 'blue');
  console.log('');
  
  try {
    // Test API connection first
    log('Testing WHO ICD API connection...', 'blue');
    await icdApi.getToken();
    log('✓ API connection successful', 'green');
    console.log('');
    
    // Load data
    const emdnData = loadEmdnData();
    
    // Create mappings
    const mappings = await createMappings(emdnData);
    
    // Save results
    saveMappings(mappings);
    
    // Display samples
    displaySamples(mappings);
    
    section('Complete');
    
    log('✓ EMDN → ICD-10 mappings created successfully!', 'green');
    console.log('');
    log('Next steps:', 'bright');
    log('1. Review mappings in: ' + config.outputDir, 'blue');
    log('2. Run: node map-gmdn-to-icd10.js (to map GMDN codes)', 'blue');
    log('3. Add manual mappings for your key devices', 'blue');
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
