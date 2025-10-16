#!/usr/bin/env node
/**
 * Restore Partially Valid Mappings
 * Adds back 150 mappings that have valid EMDN codes, removing invalid ones
 */

const fs = require('fs');

console.log('Restoring 150 partially valid mappings...\n');

// Load partially valid mappings
const partiallyValid = JSON.parse(fs.readFileSync('partially-valid-mappings.json', 'utf-8'));

// Load current valid mappings
const currentData = JSON.parse(fs.readFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', 'utf-8'));
const currentMappings = currentData.mappings;

console.log(`Current valid mappings: ${Object.keys(currentMappings).length}`);
console.log(`Mappings to restore: ${partiallyValid.length}`);

// Add the partially valid mappings with only valid EMDN codes
let restoredCount = 0;

for (const item of partiallyValid) {
  currentMappings[item.gmdnCode] = {
    gmdnCode: item.gmdnCode,
    gmdnDescription: item.gmdnDescription,
    emdnMatches: item.validMatches,
    matchCount: item.validMatches.length,
    timestamp: new Date().toISOString(),
    restoredFrom: 'partially-valid-cleanup'
  };
  restoredCount++;
}

console.log(`\n✓ Restored ${restoredCount} mappings`);
console.log(`New total: ${Object.keys(currentMappings).length} GMDN codes`);

// Update metadata
currentData.metadata = {
  ...currentData.metadata,
  generated: new Date().toISOString(),
  description: 'GMDN to EMDN mappings - validated and restored',
  validationDate: new Date().toISOString(),
  originalMappingsCount: 402,
  validMappingsCount: Object.keys(currentMappings).length,
  restoredMappingsCount: restoredCount,
  notes: 'Restored 150 mappings by removing invalid EMDN codes and keeping only valid ones'
};

// Calculate total EMDN relationships
let totalRelationships = 0;
for (const mapping of Object.values(currentMappings)) {
  totalRelationships += mapping.emdnMatches.length;
}

currentData.metadata.totalEmdnRelationships = totalRelationships;

// Save updated mappings
fs.writeFileSync(
  'public/gmdn-emdn-mappings/gmdn-emdn-mappings.json',
  JSON.stringify(currentData, null, 2)
);

// Copy to dist
fs.copyFileSync(
  'public/gmdn-emdn-mappings/gmdn-emdn-mappings.json',
  'dist/gmdn-emdn-mappings/gmdn-emdn-mappings.json'
);

console.log('\n✓ Saved to public/gmdn-emdn-mappings/gmdn-emdn-mappings.json');
console.log('✓ Copied to dist/gmdn-emdn-mappings/gmdn-emdn-mappings.json');
console.log(`\n📊 Total EMDN relationships: ${totalRelationships}`);

// Regenerate lookup indices
console.log('\nRegenerating lookup indices...');

const gmdnToEmdn = {};
const emdnToGmdn = {};

for (const [gmdnCode, mapping] of Object.entries(currentMappings)) {
  // GMDN to EMDN lookup
  gmdnToEmdn[gmdnCode] = mapping.emdnMatches.map(m => m.emdnCode);
  
  // EMDN to GMDN lookup (reverse)
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

// Save lookup indices
fs.writeFileSync(
  'public/gmdn-emdn-mappings/gmdn-lookup-index.json',
  JSON.stringify(gmdnToEmdn, null, 2)
);

fs.writeFileSync(
  'public/gmdn-emdn-mappings/emdn-lookup-index.json',
  JSON.stringify(emdnToGmdn, null, 2)
);

// Copy to dist
fs.copyFileSync(
  'public/gmdn-emdn-mappings/gmdn-lookup-index.json',
  'dist/gmdn-emdn-mappings/gmdn-lookup-index.json'
);

fs.copyFileSync(
  'public/gmdn-emdn-mappings/emdn-lookup-index.json',
  'dist/gmdn-emdn-mappings/emdn-lookup-index.json'
);

console.log(`✓ GMDN lookup index: ${Object.keys(gmdnToEmdn).length} entries`);
console.log(`✓ EMDN lookup index: ${Object.keys(emdnToGmdn).length} entries`);

// Show some examples
console.log('\n' + '═'.repeat(100));
console.log('SAMPLE OF RESTORED MAPPINGS (first 15)');
console.log('═'.repeat(100));

partiallyValid.slice(0, 15).forEach((item, i) => {
  console.log(`\n${i + 1}. GMDN ${item.gmdnCode}: ${item.gmdnDescription}`);
  item.validMatches.forEach(m => {
    console.log(`   ✓ ${m.emdnCode}: ${m.emdnDescription}`);
  });
  if (item.invalidMatches.length > 0) {
    console.log(`   (Removed ${item.invalidMatches.length} invalid code(s))`);
  }
});

console.log('\n' + '═'.repeat(100));
console.log('RESTORATION COMPLETE');
console.log('═'.repeat(100));
console.log(`Total mappings: ${Object.keys(currentMappings).length} GMDN codes`);
console.log(`Total relationships: ${totalRelationships} EMDN matches`);
console.log(`\nProduction files updated and ready! 🎉`);
