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
// Category descriptions per official EMDN nomenclature:
// A: DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION
// B: HAEMATOLOGY AND HAEMOTRANSFUSION DEVICES
// C: CARDIOCIRCULATORY SYSTEM DEVICES
// D: DISINFECTANTS, ANTISEPTICS, STERILISING AGENTS AND DETERGENTS FOR MEDICAL DEVICES
// F: DIALYSIS DEVICES
// G: GASTROINTESTINAL DEVICES
// H: SUTURE DEVICES
// J: ACTIVE-IMPLANTABLE DEVICES
// K: ENDOTHERAPY AND ELECTROSURGICAL DEVICES
// L: REUSABLE SURGICAL INSTRUMENTS
// M: DEVICES FOR GENERAL AND SPECIALIST DRESSINGS
// N: NERVOUS AND MEDULLARY SYSTEMS DEVICES
// P: IMPLANTABLE PROSTHETIC AND OSTEOSYNTHESIS DEVICES
// Q: DENTAL, OPHTHALMOLOGIC AND ENT DEVICES
// R: RESPIRATORY AND ANAESTHESIA DEVICES
// S: STERILISATION DEVICES (EXCLUDING CAT. D - Z)
// T: PATIENT PROTECTIVE EQUIPMENT AND INCONTINENCE AIDS (EXCLUDING PERSONAL PROTECTIVE EQUIPMENT - PPE)
// U: DEVICES FOR UROGENITAL SYSTEM
// V: VARIOUS MEDICAL DEVICES
// W: IN VITRO DIAGNOSTIC MEDICAL DEVICES
// X: PRODUCTS WITHOUT AN INTENDED MEDICAL PURPOSE (Annex XVI)
// Y: DEVICES FOR PERSONS WITH DISABILITIES NOT INCLUDED IN OTHER CATEGORIES
// Z: MEDICAL EQUIPMENT AND RELATED ACCESSORIES, SOFTWARE AND CONSUMABLES
const DEVICE_CATEGORIES = {
  administration: {
    keywords: ['needle', 'syringe', 'injection', 'catheter', 'tube', 'cannula', 'administration', 'withdrawal', 'collection'],
    emdnPrefix: 'A',
    description: 'DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION'
  },
  haematology: {
    keywords: ['blood', 'haematology', 'haemotransfusion', 'transfusion', 'plasma', 'platelet'],
    emdnPrefix: 'B',
    description: 'HAEMATOLOGY AND HAEMOTRANSFUSION DEVICES'
  },
  cardiocirculatory: {
    keywords: ['cardiac', 'heart', 'cardiovascular', 'coronary', 'vascular', 'arterial', 'venous', 'cardiocirculatory'],
    emdnPrefix: 'C',
    description: 'CARDIOCIRCULATORY SYSTEM DEVICES'
  },
  disinfectants: {
    keywords: ['disinfect', 'antiseptic', 'steriliz', 'detergent', 'cleaning'],
    emdnPrefix: 'D',
    description: 'DISINFECTANTS, ANTISEPTICS, STERILISING AGENTS AND DETERGENTS FOR MEDICAL DEVICES'
  },
  dialysis: {
    keywords: ['dialysis', 'haemodialysis', 'peritoneal', 'kidney', 'renal'],
    emdnPrefix: 'F',
    description: 'DIALYSIS DEVICES'
  },
  gastrointestinal: {
    keywords: ['gastro', 'intestinal', 'endoscope', 'colonoscope', 'stomach', 'bowel', 'ostomy'],
    emdnPrefix: 'G',
    description: 'GASTROINTESTINAL DEVICES'
  },
  suture: {
    keywords: ['suture', 'stitch', 'closure', 'wound closure', 'surgical thread'],
    emdnPrefix: 'H',
    description: 'SUTURE DEVICES'
  },
  activeImplantable: {
    keywords: ['pacemaker', 'defibrillator', 'implant', 'active', 'stimulator', 'neurostimulator', 'active-implantable'],
    emdnPrefix: 'J',
    description: 'ACTIVE-IMPLANTABLE DEVICES'
  },
  endotherapy: {
    keywords: ['endotherapy', 'electrosurgical', 'laser', 'radiofrequency', 'cautery'],
    emdnPrefix: 'K',
    description: 'ENDOTHERAPY AND ELECTROSURGICAL DEVICES'
  },
  surgical: {
    keywords: ['surgical', 'forceps', 'scissors', 'clamp', 'retractor', 'scalpel', 'instrument', 'reusable'],
    emdnPrefix: 'L',
    description: 'REUSABLE SURGICAL INSTRUMENTS'
  },
  dressings: {
    keywords: ['dressing', 'bandage', 'gauze', 'pad', 'compress', 'wound care', 'specialist dressing'],
    emdnPrefix: 'M',
    description: 'DEVICES FOR GENERAL AND SPECIALIST DRESSINGS'
  },
  nervous: {
    keywords: ['neural', 'nervous', 'brain', 'spinal', 'neurolog', 'cranial', 'medullary'],
    emdnPrefix: 'N',
    description: 'NERVOUS AND MEDULLARY SYSTEMS DEVICES'
  },
  prosthetic: {
    keywords: ['prosthetic', 'prosthesis', 'implant', 'joint', 'hip', 'knee', 'osteosynthesis', 'bone'],
    emdnPrefix: 'P',
    description: 'IMPLANTABLE PROSTHETIC AND OSTEOSYNTHESIS DEVICES'
  },
  dental_ophthalmic_ent: {
    keywords: ['dental', 'tooth', 'ophthalmic', 'ophthalmologic', 'eye', 'contact lens', 'ent', 'ear', 'nose', 'throat'],
    emdnPrefix: 'Q',
    description: 'DENTAL, OPHTHALMOLOGIC AND ENT DEVICES'
  },
  respiratory: {
    keywords: ['respiratory', 'ventilator', 'breathing', 'anaesthesia', 'oxygen', 'airway', 'lung'],
    emdnPrefix: 'R',
    description: 'RESPIRATORY AND ANAESTHESIA DEVICES'
  },
  sterilisation: {
    keywords: ['sterilisation', 'sterilization', 'autoclave', 'sterilizer'],
    emdnPrefix: 'S',
    description: 'STERILISATION DEVICES (EXCLUDING CAT. D - Z)'
  },
  protective: {
    keywords: ['protective', 'protection', 'incontinence', 'patient protection', 'patient protective'],
    emdnPrefix: 'T',
    description: 'PATIENT PROTECTIVE EQUIPMENT AND INCONTINENCE AIDS (EXCLUDING PERSONAL PROTECTIVE EQUIPMENT - PPE)'
  },
  urogenital: {
    keywords: ['urogenital', 'urinary', 'bladder', 'urology', 'gynecolog', 'reproductive'],
    emdnPrefix: 'U',
    description: 'DEVICES FOR UROGENITAL SYSTEM'
  },
  various: {
    keywords: ['wheelchair', 'mobility', 'hearing aid', 'various'],
    emdnPrefix: 'V',
    description: 'VARIOUS MEDICAL DEVICES'
  },
  diagnostic: {
    keywords: ['diagnostic', 'in vitro', 'test', 'assay', 'reagent', 'analyzer'],
    emdnPrefix: 'W',
    description: 'IN VITRO DIAGNOSTIC MEDICAL DEVICES'
  },
  annexXVI: {
    keywords: ['cosmetic', 'aesthetic', 'beauty', 'non-medical', 'without an intended medical purpose'],
    emdnPrefix: 'X',
    description: 'PRODUCTS WITHOUT AN INTENDED MEDICAL PURPOSE (Annex XVI)'
  },
  disability: {
    keywords: ['disability', 'handicap', 'disabilities', 'persons with disabilities'],
    emdnPrefix: 'Y',
    description: 'DEVICES FOR PERSONS WITH DISABILITIES NOT INCLUDED IN OTHER CATEGORIES'
  },
  equipment: {
    keywords: ['equipment', 'monitor', 'software', 'accessory', 'consumable', 'table', 'bed', 'medical equipment'],
    emdnPrefix: 'Z',
    description: 'MEDICAL EQUIPMENT AND RELATED ACCESSORIES, SOFTWARE AND CONSUMABLES'
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
  
  // Extract the array from the TypeScript file - use a more robust regex
  const arrayMatch = content.match(/export const gmdnFromGUDID[^=]*=\s*\[([\s\S]*)\];/);
  if (!arrayMatch) {
    throw new Error('Could not parse GMDN data from TypeScript file');
  }
  
  const arrayContent = arrayMatch[1];
  const entries = [];
  
  // Use a better regex to match objects with code and description
  const objectRegex = /\{\s*code:\s*['"](\d+)['"]\s*,\s*description:\s*"([^"]+)"/g;
  let match;
  
  while ((match = objectRegex.exec(arrayContent)) !== null) {
    entries.push({
      code: match[1],
      description: match[2],
      relatedEmdnCodes: []
    });
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
  const emdnDesc = (emdnCode.term || emdnCode.description || '').toLowerCase();
  
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
            emdnDescription: emdnCode.term || emdnCode.description,
            score: manual.confidence,
            source: manual.source
          });
          stats.manualMappings++;
        }
      }
    }
    
    // 2. AUTOMATIC MATCHING DISABLED
    // Automatic matching has been disabled due to data quality issues:
    // - Field name mismatches causing fabricated EMDN descriptions
    // - Low-quality semantic matches creating incorrect device mappings
    // - All mappings should come from manual expert curation in corrected-gmdn-emdn-mappings.psv
    //
    // If automatic matching is needed in future:
    // 1. Fix EMDN field name handling (use 'term' consistently, never 'description')
    // 2. Implement strict validation against actual EMDN database
    // 3. Require minimum semantic similarity threshold (e.g., 70%+)
    // 4. Add device category validation (don't map catheters to stents!)
    
    // Keep this commented out:
    /*
    if (matches.length < 3) {
      const automaticMatches = [];
      
      for (const emdnCode of emdnCodes) {
        const score = calculateMatchingScore(gmdnCode, emdnCode);
        if (score >= config.minMatchingScore) {
          automaticMatches.push({
            emdnCode: emdnCode.code,
            emdnDescription: emdnCode.term,  // ALWAYS use 'term', never 'description'
            score: score,
            source: 'automatic'
          });
        }
      }
      
      automaticMatches.sort((a, b) => b.score - a.score);
      const topAutomatic = automaticMatches.slice(0, config.maxResultsPerGmdn - matches.length);
      
      matches.push(...topAutomatic);
      stats.automaticMappings += topAutomatic.length;
    }
    */
    
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