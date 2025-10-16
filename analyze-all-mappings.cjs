#!/usr/bin/env node
/**
 * Comprehensive GMDN→EMDN Mapping Error Analysis
 * 
 * Checks all mappings in gmdn-emdn-mappings.json for:
 * 1. Description mismatches between mapping and actual EMDN
 * 2. Missing or incorrect EMDN codes
 * 3. Semantic relationship issues
 * 4. Missing GMDN descriptions
 */

const fs = require('fs');

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
          categoryDescription: entry.categoryDescription,
          level: entry.level,
          isTerminal: entry.isTerminal
        });
      });
    }
  }
  
  return emdnMap;
}

// Load all mappings
function loadAllMappings() {
  const mappingsFile = './public/gmdn-emdn-mappings/gmdn-emdn-mappings.json';
  const data = JSON.parse(fs.readFileSync(mappingsFile, 'utf-8'));
  return data.mappings;
}

// Load GMDN source data for reference
function loadGmdnData() {
  const gmdnFile = './data/gmdnFromGUDID.ts';
  const content = fs.readFileSync(gmdnFile, 'utf-8');
  
  const gmdnMap = new Map();
  const arrayMatch = content.match(/export const gmdnFromGUDID[^=]*=\s*\[(.*?)\];/s);
  
  if (arrayMatch) {
    const arrayContent = arrayMatch[1];
    const objectMatches = arrayContent.match(/\{[^}]*\}/g);
    
    if (objectMatches) {
      for (const objStr of objectMatches) {
        try {
          const codeMatch = objStr.match(/code:\s*'(\d+)'/);
          const descMatch = objStr.match(/description:\s*"([^"]+)"/);
          
          if (codeMatch && descMatch) {
            gmdnMap.set(codeMatch[1], {
              code: codeMatch[1],
              description: descMatch[1]
            });
          }
        } catch (e) {
          // Skip malformed entries
        }
      }
    }
  }
  
  return gmdnMap;
}

// Analyze mappings
function analyzeMappings() {
  console.log('Loading data...\n');
  const emdnMap = loadEmdnData();
  const mappings = loadAllMappings();
  const gmdnMap = loadGmdnData();
  
  console.log(`✓ Loaded ${emdnMap.size} EMDN codes`);
  console.log(`✓ Loaded ${Object.keys(mappings).length} GMDN mappings`);
  console.log(`✓ Loaded ${gmdnMap.size} GMDN source codes\n`);
  
  const errors = {
    descriptionMismatch: [],
    missingEmdnCode: [],
    missingGmdnDescription: [],
    semanticMismatch: [],
    categoryMismatch: []
  };
  
  let totalMappings = 0;
  let totalEmdnMatches = 0;
  
  for (const [gmdnCode, mapping] of Object.entries(mappings)) {
    totalMappings++;
    const actualGmdn = gmdnMap.get(gmdnCode);
    
    // Check for missing GMDN descriptions
    if (mapping.gmdnDescription.startsWith('GMDN ')) {
      errors.missingGmdnDescription.push({
        gmdnCode,
        mappingDescription: mapping.gmdnDescription,
        actualDescription: actualGmdn ? actualGmdn.description : 'NOT FOUND IN SOURCE',
        matches: mapping.emdnMatches.length
      });
    }
    
    // Check each EMDN match
    for (const match of mapping.emdnMatches) {
      totalEmdnMatches++;
      const actualEmdn = emdnMap.get(match.emdnCode);
      
      if (!actualEmdn) {
        errors.missingEmdnCode.push({
          gmdnCode,
          gmdnDescription: mapping.gmdnDescription,
          emdnCode: match.emdnCode,
          mappingDescription: match.emdnDescription,
          source: match.source,
          score: match.score
        });
      } else if (actualEmdn.description !== match.emdnDescription) {
        errors.descriptionMismatch.push({
          gmdnCode,
          gmdnDescription: mapping.gmdnDescription,
          emdnCode: match.emdnCode,
          mappingDescription: match.emdnDescription,
          actualDescription: actualEmdn.description,
          category: actualEmdn.category,
          source: match.source,
          score: match.score
        });
      } else {
        // Check semantic relationship
        const gmdnDesc = (actualGmdn ? actualGmdn.description : mapping.gmdnDescription).toLowerCase();
        const emdnDesc = actualEmdn.description.toLowerCase();
        
        // Extract meaningful words (longer than 3 chars, not common words)
        const commonWords = new Set(['the', 'and', 'for', 'with', 'single', 'use', 'other', 'devices', 'device']);
        const gmdnWords = gmdnDesc.split(/\s+/).filter(w => w.length > 3 && !commonWords.has(w));
        const emdnWords = emdnDesc.split(/\s+/).filter(w => w.length > 3 && !commonWords.has(w));
        
        // Check for word overlap or partial matches
        const hasOverlap = gmdnWords.some(gw => 
          emdnWords.some(ew => {
            if (gw.length < 4 || ew.length < 4) return false;
            return ew.includes(gw) || gw.includes(ew) || 
                   (gw.substring(0, 4) === ew.substring(0, 4));
          })
        );
        
        if (!hasOverlap && match.source === 'manual') {
          errors.semanticMismatch.push({
            gmdnCode,
            gmdnDescription: actualGmdn ? actualGmdn.description : mapping.gmdnDescription,
            emdnCode: match.emdnCode,
            emdnDescription: actualEmdn.description,
            category: actualEmdn.category,
            source: match.source,
            score: match.score
          });
        }
        
        // Check category match for manual mappings
        if (match.source === 'manual' && match.category && match.category !== actualEmdn.category) {
          errors.categoryMismatch.push({
            gmdnCode,
            gmdnDescription: actualGmdn ? actualGmdn.description : mapping.gmdnDescription,
            emdnCode: match.emdnCode,
            mappingCategory: match.category,
            actualCategory: actualEmdn.category
          });
        }
      }
    }
  }
  
  // Generate report
  console.log('='.repeat(100));
  console.log('ERROR ANALYSIS REPORT');
  console.log('='.repeat(100));
  console.log();
  
  // 1. Description Mismatches (CRITICAL)
  if (errors.descriptionMismatch.length > 0) {
    console.log(`\n❌ CRITICAL: EMDN DESCRIPTION MISMATCHES (${errors.descriptionMismatch.length})`);
    console.log('─'.repeat(100));
    errors.descriptionMismatch.forEach((err, idx) => {
      console.log(`\n${idx + 1}. GMDN ${err.gmdnCode}: ${err.gmdnDescription}`);
      console.log(`   EMDN Code: ${err.emdnCode} [Category ${err.category}] [${err.source}]`);
      console.log(`   ❌ Mapping says: "${err.mappingDescription}"`);
      console.log(`   ✓ Actual EMDN:  "${err.actualDescription}"`);
      console.log(`   Score: ${err.score}`);
    });
  }
  
  // 2. Missing EMDN Codes (CRITICAL)
  if (errors.missingEmdnCode.length > 0) {
    console.log(`\n\n❌ CRITICAL: EMDN CODES NOT FOUND (${errors.missingEmdnCode.length})`);
    console.log('─'.repeat(100));
    errors.missingEmdnCode.forEach((err, idx) => {
      console.log(`\n${idx + 1}. GMDN ${err.gmdnCode}: ${err.gmdnDescription}`);
      console.log(`   ❌ EMDN Code ${err.emdnCode} does not exist`);
      console.log(`   Mapping description: "${err.mappingDescription}"`);
      console.log(`   Source: ${err.source}, Score: ${err.score}`);
    });
  }
  
  // 3. Missing GMDN Descriptions (HIGH PRIORITY)
  if (errors.missingGmdnDescription.length > 0) {
    console.log(`\n\n⚠️  HIGH PRIORITY: MISSING GMDN DESCRIPTIONS (${errors.missingGmdnDescription.length})`);
    console.log('─'.repeat(100));
    errors.missingGmdnDescription.forEach((err, idx) => {
      console.log(`\n${idx + 1}. GMDN ${err.gmdnCode}`);
      console.log(`   ❌ Mapping shows: "${err.mappingDescription}"`);
      console.log(`   ✓ Should be: "${err.actualDescription}"`);
      console.log(`   EMDN matches: ${err.matches}`);
    });
  }
  
  // 4. Category Mismatches (MEDIUM)
  if (errors.categoryMismatch.length > 0) {
    console.log(`\n\n⚠️  MEDIUM: CATEGORY MISMATCHES (${errors.categoryMismatch.length})`);
    console.log('─'.repeat(100));
    errors.categoryMismatch.forEach((err, idx) => {
      console.log(`\n${idx + 1}. GMDN ${err.gmdnCode}: ${err.gmdnDescription}`);
      console.log(`   EMDN Code: ${err.emdnCode}`);
      console.log(`   ❌ Mapping category: ${err.mappingCategory}`);
      console.log(`   ✓ Actual category: ${err.actualCategory}`);
    });
  }
  
  // 5. Semantic Mismatches (LOW - REVIEW RECOMMENDED)
  if (errors.semanticMismatch.length > 0) {
    console.log(`\n\n⚠️  LOW: SEMANTIC MISMATCHES - MANUAL MAPPINGS (${errors.semanticMismatch.length})`);
    console.log('─'.repeat(100));
    console.log('(These may be intentional cross-category mappings - review recommended)');
    errors.semanticMismatch.forEach((err, idx) => {
      console.log(`\n${idx + 1}. GMDN ${err.gmdnCode}: ${err.gmdnDescription}`);
      console.log(`   EMDN ${err.emdnCode} [Cat ${err.category}]: ${err.emdnDescription}`);
      console.log(`   Source: ${err.source}, Score: ${err.score}`);
    });
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total GMDN codes mapped: ${totalMappings}`);
  console.log(`Total EMDN relationships: ${totalEmdnMatches}`);
  console.log();
  console.log(`❌ CRITICAL - Description Mismatches: ${errors.descriptionMismatch.length}`);
  console.log(`❌ CRITICAL - Missing EMDN Codes: ${errors.missingEmdnCode.length}`);
  console.log(`⚠️  HIGH - Missing GMDN Descriptions: ${errors.missingGmdnDescription.length}`);
  console.log(`⚠️  MEDIUM - Category Mismatches: ${errors.categoryMismatch.length}`);
  console.log(`⚠️  LOW - Semantic Mismatches: ${errors.semanticMismatch.length}`);
  console.log();
  
  const totalCritical = errors.descriptionMismatch.length + errors.missingEmdnCode.length;
  if (totalCritical > 0) {
    console.log(`🚨 ${totalCritical} CRITICAL ERRORS REQUIRE IMMEDIATE ATTENTION`);
  } else {
    console.log('✅ No critical errors found');
  }
  console.log();
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalMappings,
      totalEmdnMatches,
      criticalErrors: totalCritical,
      highPriorityIssues: errors.missingGmdnDescription.length,
      mediumPriorityIssues: errors.categoryMismatch.length,
      lowPriorityIssues: errors.semanticMismatch.length
    },
    errors
  };
  
  fs.writeFileSync('./mapping-errors-detailed.json', JSON.stringify(reportData, null, 2));
  console.log('📄 Detailed report saved to: mapping-errors-detailed.json\n');
}

// Run analysis
analyzeMappings();
