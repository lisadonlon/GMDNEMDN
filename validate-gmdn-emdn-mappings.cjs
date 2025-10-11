#!/usr/bin/env node

/**
 * GMDN-EMDN Mapping Validation Script
 * 
 * This script validates all current GMDN-EMDN mappings to identify potential mismatches
 * by comparing device descriptions and categories to ensure medical accuracy.
 */

const fs = require('fs');
const path = require('path');

// Load EMDN data from chunks
function loadEmdnData() {
  console.log('📂 Loading EMDN data from chunks...');
  const emdnData = new Map();
  
  try {
    const chunksDir = path.join(__dirname, 'public', 'emdn-chunks');
    const files = fs.readdirSync(chunksDir).filter(f => f.startsWith('emdn-') && f.endsWith('.json') && f !== 'emdn-complete.json');
    
    for (const file of files) {
      const filePath = path.join(chunksDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const entry of data.entries) {
        emdnData.set(entry.code, {
          code: entry.code,
          term: entry.term,
          category: entry.category,
          categoryDescription: entry.categoryDescription,
          level: entry.level
        });
      }
    }
    
    console.log(`✅ Loaded ${emdnData.size} EMDN codes`);
    return emdnData;
  } catch (error) {
    console.error('❌ Error loading EMDN data:', error);
    process.exit(1);
  }
}

// Load GMDN data
function loadGmdnData() {
  console.log('📂 Loading GMDN data...');
  try {
    const gmdnFilePath = path.join(__dirname, 'data', 'gmdnFromGUDID.ts');
    const gmdnContent = fs.readFileSync(gmdnFilePath, 'utf8');
    
    // Extract GMDN codes using regex - match the SecondaryCode format
    const gmdnMatches = gmdnContent.match(/{\s*code:\s*'(\d+)',\s*description:\s*"([^"]+)"/g);
    
    const gmdnData = new Map();
    
    if (gmdnMatches) {
      for (const match of gmdnMatches) {
        const codeMatch = match.match(/code:\s*'(\d+)'/);
        const descMatch = match.match(/description:\s*"([^"]+)"/);
        
        if (codeMatch && descMatch) {
          gmdnData.set(codeMatch[1], {
            code: codeMatch[1],
            name: descMatch[1]
          });
        }
      }
    }
    
    console.log(`✅ Loaded ${gmdnData.size} GMDN codes`);
    return gmdnData;
  } catch (error) {
    console.error('❌ Error loading GMDN data:', error);
    process.exit(1);
  }
}

// Load current mappings
function loadCurrentMappings() {
  console.log('📂 Loading current mappings...');
  try {
    const mappingPath = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');
    const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    
    console.log(`✅ Loaded mappings for ${Object.keys(mappingData.mappings).length} GMDN codes`);
    return mappingData.mappings;
  } catch (error) {
    console.error('❌ Error loading current mappings:', error);
    process.exit(1);
  }
}

// Analyze semantic similarity between terms
function analyzeTermSimilarity(gmdnTerm, emdnTerm) {
  const gmdnWords = gmdnTerm.toLowerCase().split(/[\s,\/\-]+/).filter(w => w.length > 2);
  const emdnWords = emdnTerm.toLowerCase().split(/[\s,\/\-]+/).filter(w => w.length > 2);
  
  // Calculate word overlap
  const commonWords = gmdnWords.filter(word => 
    emdnWords.some(emdnWord => 
      emdnWord.includes(word) || word.includes(emdnWord) || 
      Math.abs(word.length - emdnWord.length) <= 2
    )
  );
  
  const similarity = commonWords.length / Math.max(gmdnWords.length, emdnWords.length);
  
  return {
    similarity,
    commonWords,
    gmdnWords,
    emdnWords
  };
}

// Check for category mismatches
function checkCategoryMismatch(gmdnTerm, emdnEntry) {
  const issues = [];
  
  // Define category expectations based on GMDN terms
  const categoryChecks = [
    {
      gmdnKeywords: ['surgical', 'glove', 'gloves'],
      expectedCategories: ['T'], // Protective equipment
      description: 'Surgical gloves should be in category T (Protective equipment)'
    },
    {
      gmdnKeywords: ['compression', 'stocking', 'sock'],
      excludeKeywords: ['blood pressure', 'cuff', 'monitor'],
      expectedCategories: ['M'], // Dressings/compression devices
      description: 'Compression garments should be in category M (Dressings)'
    },
    {
      gmdnKeywords: ['catheter', 'cannula'],
      excludeKeywords: ['endotracheal', 'tracheal', 'introduction set', 'introducer'],
      expectedCategories: ['A', 'C', 'F', 'G', 'U'], // Various catheter categories
      description: 'Catheters should be in appropriate medical categories'
    },
    {
      gmdnKeywords: ['prosthesis', 'prosthetic', 'implant'],
      excludeKeywords: ['nonimplantable', 'non-implantable'],
      expectedCategories: ['P'], // Prosthetic devices
      description: 'Prosthetic devices should be in category P'
    },
    {
      gmdnKeywords: ['ventilator', 'respirator'],
      expectedCategories: ['R', 'Z'], // Respiratory or monitoring
      description: 'Ventilators should be in respiratory categories'
    },
    {
      gmdnKeywords: ['endotracheal', 'tracheal tube'],
      expectedCategories: ['R'], // Respiratory devices
      description: 'Endotracheal tubes should be in category R (Respiratory)'
    },
    {
      gmdnKeywords: ['dialysis', 'hemodialysis'],
      expectedCategories: ['F'], // Dialysis
      description: 'Dialysis equipment should be in category F'
    },
    {
      gmdnKeywords: ['endoscope', 'laparoscope', 'arthroscope', 'colonoscope'],
      excludeKeywords: ['stethoscope', 'phonendoscope'],
      expectedCategories: ['G', 'Q', 'S'], // Various scopes
      description: 'Endoscopes should be in appropriate categories'
    }
  ];
  
  const gmdnLower = gmdnTerm.toLowerCase();
  
  for (const check of categoryChecks) {
    const hasKeyword = check.gmdnKeywords.some(keyword => gmdnLower.includes(keyword));
    const hasExcludeKeyword = check.excludeKeywords && check.excludeKeywords.some(keyword => gmdnLower.includes(keyword));
    
    if (hasKeyword && !hasExcludeKeyword && !check.expectedCategories.includes(emdnEntry.category)) {
      issues.push({
        type: 'category_mismatch',
        severity: 'high',
        message: `${check.description}. Found in category ${emdnEntry.category} (${emdnEntry.categoryDescription})`,
        expectedCategories: check.expectedCategories,
        actualCategory: emdnEntry.category
      });
    }
  }
  
  return issues;
}

// Validate a single mapping
function validateMapping(gmdnCode, gmdnData, mappingData, emdnData) {
  const gmdn = gmdnData.get(gmdnCode);
  const mapping = mappingData[gmdnCode];
  
  if (!gmdn || !mapping) {
    return {
      gmdnCode,
      gmdnName: gmdn ? gmdn.name : 'Unknown',
      status: 'missing_data',
      issues: [{ type: 'missing_data', severity: 'high', message: 'Missing GMDN or mapping data' }],
      warnings: [],
      mappingCount: 0
    };
  }
  
  const issues = [];
  const warnings = [];
  
  // Check each EMDN match
  for (const match of mapping.emdnMatches) {
    const emdnEntry = emdnData.get(match.emdnCode);
    
    if (!emdnEntry) {
      issues.push({
        type: 'missing_emdn',
        severity: 'high',
        message: `EMDN code ${match.emdnCode} not found in database`,
        emdnCode: match.emdnCode
      });
      continue;
    }
    
    // Analyze term similarity
    const similarity = analyzeTermSimilarity(gmdn.name, emdnEntry.term);
    
    if (similarity.similarity < 0.1 && match.source === 'manual') {
      warnings.push({
        type: 'low_similarity',
        severity: 'medium',
        message: `Very low term similarity (${(similarity.similarity * 100).toFixed(1)}%) between "${gmdn.name}" and "${emdnEntry.term}"`,
        similarity: similarity.similarity,
        emdnCode: match.emdnCode,
        emdnTerm: emdnEntry.term
      });
    }
    
    // Check for category mismatches
    const categoryIssues = checkCategoryMismatch(gmdn.name, emdnEntry);
    issues.push(...categoryIssues);
    
    // Check for obvious mismatches
    const gmdnLower = gmdn.name.toLowerCase();
    const emdnLower = emdnEntry.term.toLowerCase();
    
    // Specific mismatch patterns
    if (gmdnLower.includes('compression') && emdnLower.includes('surgical glove')) {
      issues.push({
        type: 'obvious_mismatch',
        severity: 'critical',
        message: `Compression device mapped to surgical gloves: "${gmdn.name}" → "${emdnEntry.term}"`,
        emdnCode: match.emdnCode
      });
    }
    
    if (gmdnLower.includes('glove') && !emdnLower.includes('glove') && !emdnLower.includes('protective')) {
      issues.push({
        type: 'obvious_mismatch',
        severity: 'high',
        message: `Glove mapped to non-protective device: "${gmdn.name}" → "${emdnEntry.term}"`,
        emdnCode: match.emdnCode
      });
    }
  }
  
  return {
    gmdnCode,
    gmdnName: gmdn.name,
    status: issues.length > 0 ? 'has_issues' : (warnings.length > 0 ? 'has_warnings' : 'ok'),
    issues,
    warnings,
    mappingCount: mapping.emdnMatches.length
  };
}

// Main validation function
function validateAllMappings() {
  console.log('🔍 Starting validation of all GMDN-EMDN mappings...\n');
  
  const emdnData = loadEmdnData();
  const gmdnData = loadGmdnData();
  const mappingData = loadCurrentMappings();
  
  console.log('\n🔄 Validating mappings...\n');
  
  const results = [];
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  
  for (const gmdnCode of Object.keys(mappingData)) {
    const result = validateMapping(gmdnCode, gmdnData, mappingData, emdnData);
    results.push(result);
    
    // Count issues by severity
    for (const issue of [...result.issues, ...result.warnings]) {
      if (issue.severity === 'critical') criticalCount++;
      else if (issue.severity === 'high') highCount++;
      else if (issue.severity === 'medium') mediumCount++;
    }
  }
  
  // Sort results by severity
  results.sort((a, b) => {
    const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'ok': 0 };
    const aMaxSeverity = Math.max(...[...a.issues, ...a.warnings].map(i => severityOrder[i.severity] || 0));
    const bMaxSeverity = Math.max(...[...b.issues, ...b.warnings].map(i => severityOrder[i.severity] || 0));
    return bMaxSeverity - aMaxSeverity;
  });
  
  // Display results
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Total mappings validated: ${results.length}`);
  console.log(`🔴 Critical issues: ${criticalCount}`);
  console.log(`🟠 High severity issues: ${highCount}`);
  console.log(`🟡 Medium severity warnings: ${mediumCount}\n`);
  
  for (const result of results) {
    if (result.status === 'ok') continue; // Skip OK results for brevity
    
    console.log(`📋 GMDN ${result.gmdnCode}: ${result.gmdnName}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    for (const issue of result.issues) {
      const emoji = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
      console.log(`   ${emoji} ${issue.type.toUpperCase()}: ${issue.message}`);
      if (issue.emdnCode) {
        console.log(`      → EMDN: ${issue.emdnCode}`);
      }
    }
    
    for (const warning of result.warnings) {
      console.log(`   🟡 ${warning.type.toUpperCase()}: ${warning.message}`);
      if (warning.emdnCode) {
        console.log(`      → EMDN: ${warning.emdnCode}`);
      }
    }
    
    console.log('');
  }
  
  // Summary of OK mappings
  const okCount = results.filter(r => r.status === 'ok').length;
  if (okCount > 0) {
    console.log(`✅ ${okCount} mappings passed validation without issues:\n`);
    for (const result of results.filter(r => r.status === 'ok')) {
      console.log(`   ✓ GMDN ${result.gmdnCode}: ${result.gmdnName} (${result.mappingCount} EMDN matches)`);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  if (criticalCount > 0) {
    console.log('🔴 CRITICAL: Fix obvious mismatches immediately');
  }
  if (highCount > 0) {
    console.log('🟠 HIGH: Review category mismatches for medical accuracy');
  }
  if (mediumCount > 0) {
    console.log('🟡 MEDIUM: Consider improving term similarity for manual mappings');
  }
  if (criticalCount === 0 && highCount === 0 && mediumCount === 0) {
    console.log('✅ All mappings look good! No critical issues found.');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'mapping-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      totalMappings: results.length,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumWarnings: mediumCount
    },
    results
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
}

// Run validation
if (require.main === module) {
  try {
    validateAllMappings();
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

module.exports = { validateAllMappings };