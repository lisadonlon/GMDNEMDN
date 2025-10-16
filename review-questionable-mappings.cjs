#!/usr/bin/env node
/**
 * Review Questionable Mappings
 * Shows description mismatches for manual review
 */

const fs = require('fs');

const errors = JSON.parse(fs.readFileSync('mapping-errors-detailed.json', 'utf-8'));

console.log('═'.repeat(100));
console.log('DESCRIPTION MISMATCHES - Top 30 for Review');
console.log('═'.repeat(100));
console.log(`\nTotal description mismatches: ${errors.errors.descriptionMismatch.length}\n`);

errors.errors.descriptionMismatch.slice(0, 30).forEach((e, i) => {
  console.log(`\n${i + 1}. GMDN ${e.gmdnCode}: ${e.gmdnDescription}`);
  console.log(`   ├─ Mapped to EMDN: ${e.emdnCode} [Category ${e.category}]`);
  console.log(`   ├─ Mapping claimed: "${e.mappingDescription}"`);
  console.log(`   └─ EMDN actually is: "${e.actualDescription}"`);
  console.log(`      Score: ${e.score} | Match quality: ${e.score >= 90 ? '🔴 HIGH CONFIDENCE BUT WRONG' : e.score >= 70 ? '🟡 MEDIUM' : '🟢 LOW'}`);
});

console.log('\n' + '═'.repeat(100));
console.log('MISSING EMDN CODES - Sample (codes that don\'t exist)');
console.log('═'.repeat(100));
console.log(`\nTotal missing codes: ${errors.errors.missingEmdnCode.length}\n`);

errors.errors.missingEmdnCode.slice(0, 20).forEach((e, i) => {
  console.log(`${i + 1}. GMDN ${e.gmdnCode}: ${e.gmdnDescription}`);
  console.log(`   └─ Tried to map to: ${e.emdnCode} (DOES NOT EXIST)`);
  console.log(`      Claimed description: "${e.mappingDescription}"`);
});

console.log('\n' + '═'.repeat(100));
console.log('SEMANTIC MISMATCHES (from manual mappings - may be intentional)');
console.log('═'.repeat(100));
console.log(`\nTotal semantic mismatches: ${errors.errors.semanticMismatch.length}\n`);

errors.errors.semanticMismatch.forEach((e, i) => {
  console.log(`${i + 1}. GMDN ${e.gmdnCode}: ${e.gmdnDescription}`);
  console.log(`   └─ Mapped to: ${e.emdnCode} [Cat ${e.emdnCategory}]: ${e.emdnDescription}`);
  console.log(`      Source: ${e.source}, Score: ${e.score}`);
  console.log(`      Note: Cross-category mapping - review if this makes clinical sense\n`);
});

// Generate interactive review file
const reviewData = {
  generated: new Date().toISOString(),
  descriptionMismatches: errors.errors.descriptionMismatch.map(e => ({
    ...e,
    reviewed: false,
    action: '', // 'keep', 'remove', 'fix'
    notes: ''
  })),
  missingEmdnCodes: errors.errors.missingEmdnCode.map(e => ({
    ...e,
    reviewed: false,
    action: '', // 'remove', 'find-alternative'
    notes: ''
  }))
};

fs.writeFileSync('review-worksheet.json', JSON.stringify(reviewData, null, 2));
console.log('\n✓ Generated review-worksheet.json for tracking review decisions');
