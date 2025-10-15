#!/usr/bin/env node
/**
 * GMDN to EMDN Mapper
 * 
 * Creates comprehensive mappings between GMDN and EMDN device codes
 * using multiple mapping strategies:
 * 1. Manual high-confidence mappings (expert curated)
 * 2. Terminology overlap analysis
 * 3. Medical category classification
 * 4. Device functionality matching
 * 
 * Output: JSON mapping files for use in the application
 * 
 * Usage:
 *   node map-gmdn-to-emdn.cjs
 *   node map-gmdn-to-emdn.cjs --sample=100    # Test with sample first
 *   node map-gmdn-to-emdn.cjs --min-score=15  # Minimum matching score
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  emdnChunksDir: './emdn-chunks',
  gmdnDataFile: './data/gmdnFromGUDID.ts',
  outputDir: './public/gmdn-emdn-mappings',
  sampleSize: null, // Set to number for testing
  minMatchingScore: 20, // Minimum score for inclusion
  maxResultsPerGmdn: 5, // Maximum EMDN codes per GMDN
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--sample=')) {
    config.sampleSize = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--min-score=')) {
    config.minMatchingScore = parseInt(arg.split('=')[1]);
  }
});

// Colours for console output
const colours = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, colour = 'white') {
  console.log(`${colours[colour]}${message}${colours.reset}`);
}

// Manual high-confidence mappings (expert curated based on real EMDN codes)
const MANUAL_GMDN_EMDN_MAPPINGS = {
  // Cardiac pacemakers and leads
  '46522': { // Pacemaker lead, transvenous
    emdnCodes: ['J010301', 'J010302'],
    confidence: 100,
    source: 'manual'
  },
  '46347': { // Cardiovascular implantable electronic device
    emdnCodes: ['J0101', 'J0102'],
    confidence: 95,
    source: 'manual'
  },
  '37447': { // Implantable pacemaker
    emdnCodes: ['J01010101', 'J01010201', 'J01010301'],
    confidence: 100,
    source: 'manual'
  },
  
  // Coronary devices
  '36011': { // Coronary balloon angioplasty catheter
    emdnCodes: ['C0101', 'C010101'],
    confidence: 100,
    source: 'manual'
  },
  '46831': { // Drug-eluting coronary stent
    emdnCodes: ['C010201', 'C010202'],
    confidence: 100,
    source: 'manual'
  },
  '46832': { // Non-drug-eluting coronary stent
    emdnCodes: ['C010203', 'C010204'],
    confidence: 100,
    source: 'manual'
  },
  
  // Respiratory and anaesthesia
  '46921': { // Ventilator, intensive care
    emdnCodes: ['R06', 'R0601'],
    confidence: 95,
    source: 'manual'
  },
  '36450': { // Anaesthesia ventilator
    emdnCodes: ['R03', 'R0301'],
    confidence: 100,
    source: 'manual'
  },
  '41981': { // Manual resuscitator
    emdnCodes: ['R0501', 'R050101'],
    confidence: 100,
    source: 'manual'
  },
  
  // Defibrillators
  '37459': { // Implantable defibrillator
    emdnCodes: ['J0102', 'J010201', 'J010202'],
    confidence: 100,
    source: 'manual'
  },
  
  // Gastrointestinal
  '35352': { // Endoscope, flexible, video
    emdnCodes: ['G01', 'G0101'],
    confidence: 90,
    source: 'manual'
  },
  '62525': { // Intestinal ostomy bag/support kit
    emdnCodes: ['G03', 'G0301'],
    confidence: 95,
    source: 'manual'
  },
  
  // Dialysis
  '37371': { // Haemodialysis system
    emdnCodes: ['F01', 'F0101'],
    confidence: 100,
    source: 'manual'
  },
  
  // Blood collection and donor kits
  '46346': { // Paediatric blood donor set
    emdnCodes: ['B01', 'B010199'],
    confidence: 100,
    source: 'manual'
  },
  '31126': { // Total knee joint prosthesis
    emdnCodes: ['P0102', 'P010201'],
    confidence: 100,
    source: 'manual'
  },
  
  // Surgical instruments
  '35935': { // Surgical forceps
    emdnCodes: ['L01', 'L0101'],
    confidence: 95,
    source: 'manual'
  },
  '33018': { // Surgical scissors
    emdnCodes: ['L02', 'L0201'],
    confidence: 95,
    source: 'manual'
  },
  
  // Wound care
  '46207': { // Peristomal/periwound dressing
    emdnCodes: ['M01', 'M0101'],
    confidence: 90,
    source: 'manual'
  },
  
  // Contact lenses and ophthalmology
  '35765': { // Contact lens
    emdnCodes: ['Q03', 'Q0301'],
    confidence: 100,
    source: 'manual'
  },
  
  // Compression garments
  '42811': { // Compression/pressure sock/stocking, reusable
    emdnCodes: ['T01', 'T0101'],
    confidence: 95,
    source: 'manual'
  }
};

// Device category mappings for semantic analysis (based on actual EMDN structure)
const DEVICE_CATEGORIES = {
  administration: {
    keywords: ['needle', 'syringe', 'injection', 'catheter', 'tube', 'cannula', 'administration'],
    emdnPrefix: 'A'
  },
  haematology: {
    keywords: ['blood', 'haematology', 'transfusion', 'plasma', 'platelet'],
    emdnPrefix: 'B'
  },
  cardiocirculatory: {
    keywords: ['cardiac', 'heart', 'cardiovascular', 'coronary', 'vascular', 'arterial', 'venous'],
    emdnPrefix: 'C'
  },
  disinfectants: {
    keywords: ['disinfect', 'antiseptic', 'steriliz', 'detergent', 'cleaning'],
    emdnPrefix: 'D'
  },
  dialysis: {
    keywords: ['dialysis', 'haemodialysis', 'peritoneal', 'kidney', 'renal'],
    emdnPrefix: 'F'
  },
  gastrointestinal: {
    keywords: ['gastro', 'intestinal', 'endoscope', 'colonoscope', 'stomach', 'bowel', 'ostomy'],
    emdnPrefix: 'G'
  },
  suture: {
    keywords: ['suture', 'stitch', 'closure', 'wound closure', 'surgical thread'],
    emdnPrefix: 'H'
  },
  activeImplantable: {
    keywords: ['pacemaker', 'defibrillator', 'implant', 'active', 'stimulator', 'neurostimulator'],
    emdnPrefix: 'J'
  },
  endotherapy: {
    keywords: ['endotherapy', 'electrosurgical', 'laser', 'radiofrequency', 'cautery'],
    emdnPrefix: 'K'
  },
  surgical: {
    keywords: ['surgical', 'forceps', 'scissors', 'clamp', 'retractor', 'scalpel', 'instrument'],
    emdnPrefix: 'L'
  },
  dressings: {
    keywords: ['dressing', 'bandage', 'gauze', 'pad', 'compress', 'wound care'],
    emdnPrefix: 'M'
  },
  nervous: {
    keywords: ['neural', 'nervous', 'brain', 'spinal', 'neurolog', 'cranial', 'medullary'],
    emdnPrefix: 'N'
  },
  prosthetic: {
    keywords: ['prosthetic', 'prosthesis', 'implant', 'joint', 'hip', 'knee', 'osteosynthesis', 'bone'],
    emdnPrefix: 'P'
  },
  dental_ophthalmic_ent: {
    keywords: ['dental', 'tooth', 'ophthalmic', 'eye', 'contact lens', 'ent', 'ear', 'nose', 'throat'],
    emdnPrefix: 'Q'
  },
  respiratory: {
    keywords: ['respiratory', 'ventilator', 'breathing', 'anaesthesia', 'oxygen', 'airway', 'lung'],
    emdnPrefix: 'R'
  },
  sterilisation: {
    keywords: ['sterilisation', 'sterilization', 'autoclave', 'sterilizer'],
    emdnPrefix: 'S'
  },
  protective: {
    keywords: ['protective', 'protection', 'incontinence', 'patient protection'],
    emdnPrefix: 'T'
  },
  urogenital: {
    keywords: ['urogenital', 'urinary', 'bladder', 'urology', 'gynecolog', 'reproductive'],
    emdnPrefix: 'U'
  },
  various: {
    keywords: ['wheelchair', 'mobility', 'hearing aid', 'prosthetic', 'assistive'],
    emdnPrefix: 'V'
  },
  diagnostic: {
    keywords: ['diagnostic', 'in vitro', 'test', 'assay', 'reagent', 'analyzer'],
    emdnPrefix: 'W'
  },
  annexXVI: {
    keywords: ['cosmetic', 'aesthetic', 'beauty', 'non-medical'],
    emdnPrefix: 'X'
  },
  disability: {
    keywords: ['disability', 'handicap', 'assistive', 'mobility', 'independence'],
    emdnPrefix: 'Y'
  },
  equipment: {
    keywords: ['equipment', 'monitor', 'software', 'accessory', 'consumable', 'table', 'bed'],
    emdnPrefix: 'Z'
  }
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
  
  log(`✓ Loaded ${allEntries.length} EMDN codes`, 'green');
  return allEntries;
}

// Load GMDN data from TypeScript file
function loadGmdnData() {
  log('Loading GMDN data...', 'blue');
  
  if (!fs.existsSync(config.gmdnDataFile)) {
    throw new Error(`GMDN data file not found: ${config.gmdnDataFile}`);
  }
  
  const content = fs.readFileSync(config.gmdnDataFile, 'utf-8');
  
  // Extract the array from the TypeScript file
  const arrayMatch = content.match(/export const gmdnFromGUDID[^=]*=\s*\[(.*?)\];/s);
  if (!arrayMatch) {
    throw new Error('Could not parse GMDN data from TypeScript file');
  }
  
  // Simple parsing - convert to JSON-like format
  const arrayContent = arrayMatch[1];
  const entries = [];
  
  // Split by object boundaries and parse each
  const objectMatches = arrayContent.match(/\{[^}]*\}/g);
  if (objectMatches) {
    for (const objStr of objectMatches) {
      try {
        // Convert TypeScript object to JSON
        const jsonStr = objStr
          .replace(/code:\\s*'([^']*)',?/g, '"code":"$1",')
          .replace(/description:\\s*"([^"]*)",?/g, '"description":"$1",')
          .replace(/relatedEmdnCodes:\s*\[[^\]]*\],?/g, '"relatedEmdnCodes":[],')
          .replace(/,\s*}/g, '}');
        
        const obj = JSON.parse(jsonStr);
        if (obj.code && obj.description) {
          entries.push(obj);
        }
      } catch (e) {
        // Skip malformed objects
      }
    }
  }
  
  // Sample if specified
  if (config.sampleSize) {
    entries.sort(() => 0.5 - Math.random());
    entries.length = Math.min(config.sampleSize, entries.length);
    log(`Sampled ${entries.length} GMDN codes for testing`, 'yellow');
  }
  
  log(`✓ Loaded ${entries.length} GMDN codes`, 'green');
  return entries;
}

// Calculate matching score between GMDN and EMDN codes
function calculateMatchingScore(gmdnCode, emdnCode) {
  const gmdnDesc = gmdnCode.description.toLowerCase();
  const emdnDesc = emdnCode.description.toLowerCase();
  
  let score = 0;
  
  // 1. Exact phrase matching (highest score)
  if (gmdnDesc.includes(emdnDesc) || emdnDesc.includes(gmdnDesc)) {
    score += 100;
  }
  
  // 2. Word overlap analysis
  const gmdnWords = gmdnDesc.split(/\s+/).filter(w => w.length > 3);
  const emdnWords = emdnDesc.split(/\s+/).filter(w => w.length > 3);
  
  const commonWords = gmdnWords.filter(word => 
    emdnWords.some(emdnWord => 
      emdnWord.includes(word) || word.includes(emdnWord) ||
      (word.length > 4 && emdnWord.length > 4 && 
       (word.startsWith(emdnWord.slice(0, 4)) || emdnWord.startsWith(word.slice(0, 4))))
    )
  );
  
  score += commonWords.length * 15;
  
  // 3. Medical category matching
  for (const [category, info] of Object.entries(DEVICE_CATEGORIES)) {
    const gmdnInCategory = info.keywords.some(keyword => gmdnDesc.includes(keyword));
    const emdnInCategory = emdnCode.code.startsWith(info.emdnPrefix);
    
    if (gmdnInCategory && emdnInCategory) {
      score += 30;
    }
  }
  
  // 4. Specific medical device keywords
  const medicalKeywords = [
    'implant', 'catheter', 'stent', 'valve', 'prosthesis', 'monitor',
    'sensor', 'pump', 'filter', 'tube', 'needle', 'syringe', 'bandage',
    'dressing', 'suture', 'clip', 'clamp', 'forceps', 'scissors'
  ];
  
  for (const keyword of medicalKeywords) {
    if (gmdnDesc.includes(keyword) && emdnDesc.includes(keyword)) {
      score += 20;
    }
  }
  
  // 5. Size/type modifiers
  const modifiers = ['disposable', 'reusable', 'single-use', 'sterile', 'non-sterile'];
  for (const modifier of modifiers) {
    if (gmdnDesc.includes(modifier) && emdnDesc.includes(modifier)) {
      score += 10;
    }
  }
  
  return score;
}

// Generate mappings
function generateMappings(gmdnCodes, emdnCodes) {
  log('Generating GMDN to EMDN mappings...', 'magenta');
  
  const mappings = {};
  const stats = {
    totalGmdn: gmdnCodes.length,
    mappedGmdn: 0,
    totalMappings: 0,
    manualMappings: 0,
    automaticMappings: 0
  };
  
  for (let i = 0; i < gmdnCodes.length; i++) {
    const gmdnCode = gmdnCodes[i];
    const progressPercent = Math.round((i / gmdnCodes.length) * 100);
    
    if (i % 100 === 0) {
      log(`Progress: ${progressPercent}% (${i}/${gmdnCodes.length})`, 'cyan');
    }
    
    const matches = [];
    
    // 1. Check for manual mappings first
    if (MANUAL_GMDN_EMDN_MAPPINGS[gmdnCode.code]) {
      const manual = MANUAL_GMDN_EMDN_MAPPINGS[gmdnCode.code];
      for (const emdnCodeStr of manual.emdnCodes) {
        const emdnCode = emdnCodes.find(e => e.code === emdnCodeStr);
        if (emdnCode) {
          matches.push({
            emdnCode: emdnCode.code,
            emdnDescription: emdnCode.description,
            score: manual.confidence,
            source: manual.source
          });
          stats.manualMappings++;
        }
      }
    }
    
    // 2. Automatic matching if no manual mappings or low manual count
    if (matches.length < 3) {
      const automaticMatches = [];
      
      for (const emdnCode of emdnCodes) {
        const score = calculateMatchingScore(gmdnCode, emdnCode);
        if (score >= config.minMatchingScore) {
          automaticMatches.push({
            emdnCode: emdnCode.code,
            emdnDescription: emdnCode.description,
            score: score,
            source: 'automatic'
          });
        }
      }
      
      // Sort by score and take top matches
      automaticMatches.sort((a, b) => b.score - a.score);
      const topAutomatic = automaticMatches.slice(0, config.maxResultsPerGmdn - matches.length);
      
      matches.push(...topAutomatic);
      stats.automaticMappings += topAutomatic.length;
    }
    
    // Store mappings if any found
    if (matches.length > 0) {
      mappings[gmdnCode.code] = {
        gmdnCode: gmdnCode.code,
        gmdnDescription: gmdnCode.description,
        emdnMatches: matches,
        matchCount: matches.length,
        timestamp: new Date().toISOString()
      };
      stats.mappedGmdn++;
      stats.totalMappings += matches.length;
    }
  }
  
  log(`✓ Generated mappings for ${stats.mappedGmdn}/${stats.totalGmdn} GMDN codes`, 'green');
  log(`  Manual mappings: ${stats.manualMappings}`, 'cyan');
  log(`  Automatic mappings: ${stats.automaticMappings}`, 'cyan');
  log(`  Total relationships: ${stats.totalMappings}`, 'cyan');
  
  return { mappings, stats };
}

// Create lookup indices for faster searching
function createLookupIndices(mappings) {
  const gmdnToEmdn = {};
  const emdnToGmdn = {};
  
  for (const [gmdnCode, mapping] of Object.entries(mappings)) {
    gmdnToEmdn[gmdnCode] = mapping.emdnMatches.map(m => m.emdnCode);
    
    for (const match of mapping.emdnMatches) {
      if (!emdnToGmdn[match.emdnCode]) {
        emdnToGmdn[match.emdnCode] = [];
      }
      emdnToGmdn[match.emdnCode].push({
        gmdnCode: gmdnCode,
        score: match.score,
        source: match.source
      });
    }
  }
  
  return { gmdnToEmdn, emdnToGmdn };
}

// Save mappings to files
function saveMappings(mappings, stats, indices) {
  log('Saving mapping files...', 'blue');
  
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Main mappings file
  const mainFile = path.join(config.outputDir, 'gmdn-emdn-mappings.json');
  fs.writeFileSync(mainFile, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      version: '1.0.0',
      description: 'GMDN to EMDN device code mappings',
      stats: stats,
      config: config
    },
    mappings: mappings
  }, null, 2));
  
  // Lookup indices
  const gmdnLookupFile = path.join(config.outputDir, 'gmdn-lookup-index.json');
  fs.writeFileSync(gmdnLookupFile, JSON.stringify(indices.gmdnToEmdn, null, 2));
  
  const emdnLookupFile = path.join(config.outputDir, 'emdn-lookup-index.json');
  fs.writeFileSync(emdnLookupFile, JSON.stringify(indices.emdnToGmdn, null, 2));
  
  // High-confidence mappings only
  const highConfidenceMappings = {};
  for (const [gmdnCode, mapping] of Object.entries(mappings)) {
    const highConfMatches = mapping.emdnMatches.filter(m => m.score >= 70);
    if (highConfMatches.length > 0) {
      highConfidenceMappings[gmdnCode] = {
        ...mapping,
        emdnMatches: highConfMatches
      };
    }
  }
  
  const highConfFile = path.join(config.outputDir, 'gmdn-emdn-high-confidence.json');
  fs.writeFileSync(highConfFile, JSON.stringify(highConfidenceMappings, null, 2));
  
  log(`✓ Saved mapping files to ${config.outputDir}`, 'green');
  log(`  Main mappings: ${Object.keys(mappings).length} GMDN codes`, 'cyan');
  log(`  High confidence: ${Object.keys(highConfidenceMappings).length} GMDN codes`, 'cyan');
}

// Main execution
async function main() {
  try {
    log('='.repeat(60), 'bright');
    log('GMDN to EMDN Mapping Generator', 'bright');
    log('='.repeat(60), 'bright');
    
    // Load data
    const emdnCodes = loadEmdnData();
    const gmdnCodes = loadGmdnData();
    
    // Generate mappings
    const { mappings, stats } = generateMappings(gmdnCodes, emdnCodes);
    
    // Create lookup indices
    const indices = createLookupIndices(mappings);
    
    // Save results
    saveMappings(mappings, stats, indices);
    
    log('='.repeat(60), 'bright');
    log('Mapping generation completed successfully!', 'green');
    log(`Generated ${stats.totalMappings} total relationships`, 'cyan');
    log('='.repeat(60), 'bright');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { calculateMatchingScore, DEVICE_CATEGORIES, MANUAL_GMDN_EMDN_MAPPINGS };