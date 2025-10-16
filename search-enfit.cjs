#!/usr/bin/env node
const fs = require('fs');

console.log('Searching for ENFit devices...\n');

// Load GMDN data
const gmdnContent = fs.readFileSync('data/gmdnFromGUDID.ts', 'utf-8');

// Find all ENFit devices
const enfitMatches = [];
const regex = /code:\s*'(\d+)',\s*description:\s*"([^"]*ENFit[^"]*)"/gi;
let match;

while ((match = regex.exec(gmdnContent)) !== null) {
  enfitMatches.push({
    code: match[1],
    description: match[2]
  });
}

console.log(`Found ${enfitMatches.length} ENFit devices in GMDN database:\n`);
console.log('═'.repeat(100));

enfitMatches.forEach((device, i) => {
  console.log(`${i + 1}. GMDN ${device.code}: ${device.description}`);
});

// Check current mappings
const mappings = JSON.parse(fs.readFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', 'utf-8'));

console.log('\n' + '═'.repeat(100));
console.log('STATUS IN CURRENT VALIDATED MAPPINGS (247 codes):');
console.log('═'.repeat(100) + '\n');

let mappedCount = 0;
let unmappedCount = 0;

enfitMatches.forEach(device => {
  if (mappings.mappings[device.code]) {
    console.log(`✓ GMDN ${device.code}: ${device.description}`);
    mappings.mappings[device.code].emdnMatches.forEach(e => {
      console.log(`  → ${e.emdnCode}: ${e.emdnDescription}`);
    });
    console.log();
    mappedCount++;
  } else {
    console.log(`✗ GMDN ${device.code}: ${device.description} (NOT MAPPED)`);
    unmappedCount++;
  }
});

console.log('═'.repeat(100));
console.log(`Summary: ${mappedCount} mapped, ${unmappedCount} not mapped`);
console.log('═'.repeat(100));
