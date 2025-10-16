#!/usr/bin/env node
const fs = require('fs');

console.log('Searching EMDN database for ENFit-related codes...\n');

// Load EMDN data
const emdnData = JSON.parse(fs.readFileSync('emdn-chunks/emdn-A.json', 'utf-8'));
const emdnCodes = emdnData.entries;

console.log('═'.repeat(100));
console.log('ENFit Device Mappings Analysis');
console.log('═'.repeat(100) + '\n');

// Define the 8 ENFit GMDN devices we need to map
const enfitDevices = [
  { code: '59040', description: 'ENFit oral/enteral syringe, single-use' },
  { code: '62001', description: 'ENFit oral/enteral syringe, reusable' },
  { code: '65012', description: 'ENFit-formatted protective cap' },
  { code: '64469', description: 'ENFit/non-ISO80369-standardized linear connector' },
  { code: '64470', description: 'ENFit/Luer linear connector' },
  { code: '64471', description: 'ENFit/ENFit linear connector' },
  { code: '64699', description: 'ENFit small-bore multichannel connector' },
  { code: '64700', description: 'ENFit/non-ISO80369-standardized small-bore multichannel connector' }
];

// Search patterns for each device type
const searchPatterns = [
  { keywords: ['SYRINGE', 'ENTERAL', 'ORAL'], category: 'Syringes' },
  { keywords: ['CAP', 'OBTURATOR', 'CLOSING'], category: 'Caps' },
  { keywords: ['CONNECTOR', 'LINEAR', 'ADAPTER'], category: 'Connectors' },
  { keywords: ['CONNECTOR', 'MULTICHANNEL', 'BORE'], category: 'Multichannel Connectors' }
];

console.log('RELEVANT EMDN CODES:\n');

// Search for syringe codes
console.log('1. SYRINGES (for ENFit oral/enteral syringes):');
const syringeCodes = emdnCodes.filter(c => 
  c.term.includes('SYRINGE') && 
  (c.term.includes('ENTERAL') || c.term.includes('ORAL') || c.term.includes('FEEDING'))
);
syringeCodes.forEach(c => {
  console.log(`   ${c.code}: ${c.term}`);
});

console.log('\n2. CAPS/OBTURATORS (for ENFit protective cap):');
const capCodes = emdnCodes.filter(c => 
  (c.term.includes('CAP') || c.term.includes('OBTURATOR')) &&
  !c.term.includes('EXPANSION') &&
  !c.term.includes('PROTECTIVE CREAMS') &&
  !c.term.includes('PROTECTIVE POWDERS') &&
  !c.term.includes('PROTECTIVE FILMS')
);
capCodes.forEach(c => {
  console.log(`   ${c.code}: ${c.term}`);
});

console.log('\n3. CONNECTORS (for ENFit linear connectors):');
const connectorCodes = emdnCodes.filter(c => 
  c.term.includes('CONNECTOR') && 
  (c.term.includes('LINEAR') || c.term.includes('ADAPTER') || c.code.startsWith('A07'))
);
connectorCodes.forEach(c => {
  console.log(`   ${c.code}: ${c.term}`);
});

console.log('\n' + '═'.repeat(100));
console.log('RECOMMENDED MAPPINGS:');
console.log('═'.repeat(100) + '\n');

console.log('Based on device function and EMDN hierarchy:\n');

// Proposed mappings
const proposedMappings = [
  { gmdn: '59040', gmdnDesc: 'ENFit oral/enteral syringe, single-use', emdn: 'A0601', emdnDesc: 'SYRINGES FOR ENTERAL/ORAL NUTRITION' },
  { gmdn: '62001', gmdnDesc: 'ENFit oral/enteral syringe, reusable', emdn: 'A0601', emdnDesc: 'SYRINGES FOR ENTERAL/ORAL NUTRITION' },
  { gmdn: '65012', gmdnDesc: 'ENFit-formatted protective cap', emdn: 'A070501', emdnDesc: 'CAPS OR OBTURATORS, NON-PERFORABLE' },
  { gmdn: '64469', gmdnDesc: 'ENFit/non-ISO80369-standardized linear connector', emdn: 'A0707', emdnDesc: 'ADAPTERS, CONNECTORS, RAMPS, STOPCOCKS, CAPS' },
  { gmdn: '64470', gmdnDesc: 'ENFit/Luer linear connector', emdn: 'A0707', emdnDesc: 'ADAPTERS, CONNECTORS, RAMPS, STOPCOCKS, CAPS' },
  { gmdn: '64471', gmdnDesc: 'ENFit/ENFit linear connector', emdn: 'A0707', emdnDesc: 'ADAPTERS, CONNECTORS, RAMPS, STOPCOCKS, CAPS' },
  { gmdn: '64699', gmdnDesc: 'ENFit small-bore multichannel connector', emdn: 'A0707', emdnDesc: 'ADAPTERS, CONNECTORS, RAMPS, STOPCOCKS, CAPS' },
  { gmdn: '64700', gmdnDesc: 'ENFit/non-ISO80369-standardized small-bore multichannel connector', emdn: 'A0707', emdnDesc: 'ADAPTERS, CONNECTORS, RAMPS, STOPCOCKS, CAPS' }
];

proposedMappings.forEach((m, i) => {
  console.log(`${i + 1}. GMDN ${m.gmdn}: ${m.gmdnDesc}`);
  console.log(`   → EMDN ${m.emdn}: ${m.emdnDesc}\n`);
});

console.log('═'.repeat(100));
