#!/usr/bin/env node
/**
 * Find Partially Valid Mappings
 * Some mappings have mix of valid and invalid EMDN codes
 */

const fs = require('fs');

console.log('Finding mappings with at least one valid EMDN code...\n');

// Load EMDN data to check which codes exist
const emdnCodes = new Set();
const emdnChunksDir = './emdn-chunks';
const files = fs.readdirSync(emdnChunksDir)
  .filter(f => f.startsWith('emdn-') && f.endsWith('.json') && f !== 'emdn-complete.json');

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(`${emdnChunksDir}/${file}`, 'utf-8'));
  data.entries.forEach(entry => emdnCodes.add(entry.code));
}

console.log(`Loaded ${emdnCodes.size} valid EMDN codes\n`);

// Load old mappings with errors
const oldData = JSON.parse(fs.readFileSync(
  './archive/old-mappings/gmdn-emdn-mappings-402-with-errors-20251016-204440.json',
  'utf-8'
));

// Load current valid mappings
const currentData = JSON.parse(fs.readFileSync(
  './public/gmdn-emdn-mappings/gmdn-emdn-mappings.json',
  'utf-8'
));
const currentGmdnCodes = new Set(Object.keys(currentData.mappings));

// Find mappings that were removed but have at least one valid EMDN code
const partiallyValid = [];

for (const [gmdnCode, mapping] of Object.entries(oldData.mappings)) {
  // Skip if already in current valid set
  if (currentGmdnCodes.has(gmdnCode)) continue;
  
  const validMatches = [];
  const invalidMatches = [];
  
  for (const match of mapping.emdnMatches) {
    if (emdnCodes.has(match.emdnCode)) {
      validMatches.push(match);
    } else {
      invalidMatches.push(match);
    }
  }
  
  // If has at least one valid match
  if (validMatches.length > 0) {
    partiallyValid.push({
      gmdnCode,
      gmdnDescription: mapping.gmdnDescription,
      validMatches,
      invalidMatches,
      totalMatches: mapping.emdnMatches.length,
      validCount: validMatches.length,
      invalidCount: invalidMatches.length
    });
  }
}

console.log(`Found ${partiallyValid.length} mappings with at least one valid EMDN code\n`);
console.log('═'.repeat(100));
console.log('PARTIALLY VALID MAPPINGS (removed but salvageable)');
console.log('═'.repeat(100));

partiallyValid.forEach((item, i) => {
  console.log(`\n${i + 1}. GMDN ${item.gmdnCode}: ${item.gmdnDescription}`);
  console.log(`   Valid matches (${item.validCount}):`);
  item.validMatches.forEach(m => {
    console.log(`      ✓ ${m.emdnCode}: ${m.emdnDescription}`);
  });
  if (item.invalidMatches.length > 0) {
    console.log(`   Invalid matches (${item.invalidCount}):`);
    item.invalidMatches.forEach(m => {
      console.log(`      ✗ ${m.emdnCode}: ${m.emdnDescription || 'N/A'}`);
    });
  }
});

// Save for review
fs.writeFileSync(
  'partially-valid-mappings.json',
  JSON.stringify(partiallyValid, null, 2)
);

console.log('\n' + '═'.repeat(100));
console.log(`Summary: ${partiallyValid.length} mappings could be restored with valid EMDN codes only`);
console.log('✓ Saved to partially-valid-mappings.json');
