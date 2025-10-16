const data = require('./public/gmdn-emdn-mappings/gmdn-emdn-mappings.json');

console.log('═'.repeat(80));
console.log('VERIFICATION OF RESTORED MAPPINGS');
console.log('═'.repeat(80));
console.log('\nTotal GMDN codes:', Object.keys(data.mappings).length);
console.log('Total EMDN relationships:', Object.values(data.mappings).reduce((sum, m) => sum + m.emdnMatches.length, 0));

console.log('\n' + '═'.repeat(80));
console.log('SAMPLE OF KEY RESTORED DEVICES:');
console.log('═'.repeat(80));

const samples = {
  '13755': 'Stethoscope',
  '17882': 'Defibrillator',
  '34978': 'Blood pressure cuff',
  '33181': 'Hip prosthesis',
  '41512': 'Wheelchair',
  '34864': 'Bandage'
};

for (const [code, name] of Object.entries(samples)) {
  const m = data.mappings[code];
  if (m) {
    console.log(`\n✓ GMDN ${code}: ${m.gmdnDescription}`);
    m.emdnMatches.forEach(e => console.log(`  → ${e.emdnCode}: ${e.emdnDescription}`));
  } else {
    console.log(`\n✗ GMDN ${code}: ${name} - NOT FOUND`);
  }
}

console.log('\n' + '═'.repeat(80));
console.log('✅ Verification Complete');
console.log('═'.repeat(80));
