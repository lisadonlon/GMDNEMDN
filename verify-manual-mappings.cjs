#!/usr/bin/env node
/**
 * Verify Manual GMDN→EMDN Mappings
 * 
 * Cross-references manual mappings with actual EMDN data to find mismatches
 */

const fs = require('fs');
const path = require('path');

// Load EMDN data
function loadEmdnData() {
  const emdnFiles = fs.readdirSync('./public/emdn-chunks')
    .filter(f => f.startsWith('emdn-') && f.endsWith('.json') && f !== 'emdn-complete.json');
  
  const emdnMap = new Map();
  
  for (const file of emdnFiles) {
    const data = JSON.parse(fs.readFileSync(`./public/emdn-chunks/${file}`, 'utf-8'));
    if (data.entries) {
      data.entries.forEach(entry => {
        emdnMap.set(entry.code, {
          code: entry.code,
          description: entry.term,
          category: entry.category,
          categoryDescription: entry.categoryDescription
        });
      });
    }
  }
  
  return emdnMap;
}

// Load manual mappings from generated file
function loadGeneratedMappings() {
  const mappingsFile = './public/gmdn-emdn-mappings/gmdn-emdn-mappings.json';
  const data = JSON.parse(fs.readFileSync(mappingsFile, 'utf-8'));
  
  const manualMappings = [];
  
  for (const [gmdnCode, mapping] of Object.entries(data.mappings)) {
    const manualMatches = mapping.emdnMatches.filter(m => m.source === 'manual');
    if (manualMatches.length > 0) {
      manualMappings.push({
        gmdnCode,
        gmdnDescription: mapping.gmdnDescription,
        matches: manualMatches
      });
    }
  }
  
  return manualMappings;
}

// Verify mappings
function verifyMappings() {
  console.log('Loading EMDN data...');
  const emdnMap = loadEmdnData();
  console.log(`Loaded ${emdnMap.size} EMDN codes\n`);
  
  console.log('Loading manual mappings...');
  const manualMappings = loadGeneratedMappings();
  console.log(`Found ${manualMappings.length} GMDN codes with manual mappings\n`);
  
  console.log('='.repeat(80));
  console.log('VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log();
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const mapping of manualMappings) {
    let hasError = false;
    const errors = [];
    const warnings = [];
    
    for (const match of mapping.matches) {
      const actualEmdn = emdnMap.get(match.emdnCode);
      
      if (!actualEmdn) {
        errors.push(`  ❌ EMDN code ${match.emdnCode} does not exist`);
        hasError = true;
      } else if (actualEmdn.description !== match.emdnDescription) {
        errors.push(`  ❌ DESCRIPTION MISMATCH for ${match.emdnCode}:`);
        errors.push(`     Mapping says: "${match.emdnDescription}"`);
        errors.push(`     Actual EMDN:  "${actualEmdn.description}"`);
        hasError = true;
      } else {
        // Check if GMDN and EMDN descriptions are semantically related
        const gmdnLower = mapping.gmdnDescription.toLowerCase();
        const emdnLower = actualEmdn.description.toLowerCase();
        
        // Extract key words from both
        const gmdnWords = gmdnLower.split(/\s+/).filter(w => w.length > 3);
        const emdnWords = emdnLower.split(/\s+/).filter(w => w.length > 3);
        
        const hasCommonWords = gmdnWords.some(gw => 
          emdnWords.some(ew => ew.includes(gw) || gw.includes(ew))
        );
        
        if (!hasCommonWords) {
          warnings.push(`  ⚠️  Semantic mismatch for ${match.emdnCode}:`);
          warnings.push(`     GMDN: "${mapping.gmdnDescription}"`);
          warnings.push(`     EMDN: "${actualEmdn.description}"`);
        }
      }
    }
    
    if (hasError || warnings.length > 0) {
      console.log(`\nGMDN ${mapping.gmdnCode}: ${mapping.gmdnDescription}`);
      
      if (errors.length > 0) {
        console.log(errors.join('\n'));
        totalErrors += errors.filter(e => e.includes('❌')).length;
      }
      
      if (warnings.length > 0) {
        console.log(warnings.join('\n'));
        totalWarnings += warnings.filter(w => w.includes('⚠️')).length;
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total manual mappings checked: ${manualMappings.length}`);
  console.log(`Total errors found: ${totalErrors}`);
  console.log(`Total warnings found: ${totalWarnings}`);
  console.log();
  
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ All manual mappings are correct!');
  } else if (totalErrors > 0) {
    console.log('❌ Critical errors found - manual mappings need correction');
    process.exit(1);
  } else {
    console.log('⚠️  Warnings found - review recommended but not critical');
  }
}

// Run verification
verifyMappings();
