#!/usr/bin/env node
/**
 * Rebuild Lookup Indices
 * Regenerates GMDN and EMDN lookup indices from the current mappings file
 */

const fs = require('fs');

console.log('Rebuilding lookup indices from current mappings...\n');

// Load current mappings
const mappingData = JSON.parse(fs.readFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', 'utf-8'));
const mappings = mappingData.mappings;

// Create lookup indices
const gmdnToEmdn = {};
const emdnToGmdn = {};

for (const [gmdnCode, mapping] of Object.entries(mappings)) {
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

console.log(`✓ Generated GMDN lookup index: ${Object.keys(gmdnToEmdn).length} entries`);
console.log(`✓ Generated EMDN lookup index: ${Object.keys(emdnToGmdn).length} entries`);
console.log('\n✓ Saved to public/gmdn-emdn-mappings/');
console.log('✓ Copied to dist/gmdn-emdn-mappings/');

console.log('\nSample GMDN lookups:');
Object.entries(gmdnToEmdn).slice(0, 5).forEach(([gmdn, emdns]) => {
  console.log(`  ${gmdn} → [${emdns.join(', ')}]`);
});

console.log('\nSample EMDN lookups:');
Object.entries(emdnToGmdn).slice(0, 5).forEach(([emdn, gmdns]) => {
  console.log(`  ${emdn} ← [${gmdns.map(g => g.gmdnCode).join(', ')}]`);
});
