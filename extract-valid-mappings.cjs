#!/usr/bin/env node
/**
 * Extract Valid Mappings
 * Filters out mappings with critical errors (description mismatches, missing EMDN codes)
 */

const fs = require('fs');

console.log('Extracting valid mappings from error analysis...\n');

// Load error analysis
const errors = JSON.parse(fs.readFileSync('mapping-errors-detailed.json', 'utf-8'));

// Load current mappings
const mappingData = JSON.parse(fs.readFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', 'utf-8'));
const mappings = mappingData.mappings;

// Create set of GMDN codes with critical errors
const criticalGmdnCodes = new Set([
  ...errors.errors.descriptionMismatch.map(e => e.gmdnCode),
  ...errors.errors.missingEmdnCode.map(e => e.gmdnCode)
]);

console.log(`Total mappings: ${Object.keys(mappings).length}`);
console.log(`GMDN codes with critical errors: ${criticalGmdnCodes.size}`);

// Extract valid mappings
const validMappings = {};
let totalValidRelationships = 0;

for (const [gmdnCode, mapping] of Object.entries(mappings)) {
  if (!criticalGmdnCodes.has(gmdnCode)) {
    validMappings[gmdnCode] = mapping;
    totalValidRelationships += mapping.emdnMatches.length;
  }
}

console.log(`\n✓ Valid GMDN codes: ${Object.keys(validMappings).length}`);
console.log(`✓ Total valid EMDN relationships: ${totalValidRelationships}`);

// Save valid mappings
const validMappingData = {
  metadata: {
    ...mappingData.metadata,
    generated: new Date().toISOString(),
    description: 'GMDN to EMDN mappings - validated subset (critical errors removed)',
    validationDate: new Date().toISOString(),
    originalMappingsCount: Object.keys(mappings).length,
    validMappingsCount: Object.keys(validMappings).length,
    removedMappingsCount: criticalGmdnCodes.size
  },
  mappings: validMappings
};

fs.writeFileSync(
  'public/gmdn-emdn-mappings/gmdn-emdn-mappings-valid.json',
  JSON.stringify(validMappingData, null, 2)
);

console.log('\n✓ Saved valid mappings to: public/gmdn-emdn-mappings/gmdn-emdn-mappings-valid.json');

// Show sample
console.log('\n' + '='.repeat(80));
console.log('SAMPLE OF VALID MAPPINGS (first 15)');
console.log('='.repeat(80));

let count = 0;
for (const [gmdnCode, mapping] of Object.entries(validMappings)) {
  if (count >= 15) break;
  
  console.log(`\n${count + 1}. GMDN ${gmdnCode}: ${mapping.gmdnDescription}`);
  mapping.emdnMatches.forEach(em => {
    console.log(`   → ${em.emdnCode}: ${em.emdnDescription}`);
    console.log(`      Score: ${em.score}, Source: ${em.source}`);
  });
  
  count++;
}

// Create summary report
const summaryReport = {
  validationDate: new Date().toISOString(),
  totalOriginalMappings: Object.keys(mappings).length,
  totalValidMappings: Object.keys(validMappings).length,
  totalRemovedMappings: criticalGmdnCodes.size,
  validMappingPercentage: ((Object.keys(validMappings).length / Object.keys(mappings).length) * 100).toFixed(1) + '%',
  validRelationships: totalValidRelationships,
  categoriesOfRemovedMappings: {
    descriptionMismatches: errors.errors.descriptionMismatch.length,
    missingEmdnCodes: errors.errors.missingEmdnCode.length
  },
  validGmdnCodes: Object.keys(validMappings).sort((a, b) => a - b)
};

fs.writeFileSync(
  'valid-mappings-summary.json',
  JSON.stringify(summaryReport, null, 2)
);

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Original mappings: ${summaryReport.totalOriginalMappings}`);
console.log(`Valid mappings: ${summaryReport.totalValidMappings} (${summaryReport.validMappingPercentage})`);
console.log(`Removed mappings: ${summaryReport.totalRemovedMappings}`);
console.log(`\n✓ Summary saved to: valid-mappings-summary.json`);
