#!/usr/bin/env node

/**
 * Quick summary of mapping validation issues
 */

const fs = require('fs');
const path = require('path');

function summarizeValidation() {
  console.log('📊 GMDN-EMDN Mapping Validation Summary\n');
  
  try {
    const reportPath = path.join(__dirname, 'mapping-validation-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log(`📈 Statistics:`);
    console.log(`   Total mappings: ${report.metadata.totalMappings}`);
    console.log(`   🔴 Critical issues: ${report.metadata.criticalIssues}`);
    console.log(`   🟠 High issues: ${report.metadata.highIssues}`);
    console.log(`   🟡 Medium warnings: ${report.metadata.mediumWarnings}`);
    
    const hasIssues = report.results.filter(r => r.status === 'has_issues');
    const missingData = report.results.filter(r => r.status === 'missing_data');
    const okMappings = report.results.filter(r => r.status === 'ok');
    
    console.log(`\n🔍 Key Findings:`);
    console.log(`   ✅ OK mappings: ${okMappings.length}`);
    console.log(`   ⚠️  Mappings with issues: ${hasIssues.length}`);
    console.log(`   ❌ Missing data: ${missingData.length}`);
    
    if (hasIssues.length > 0) {
      console.log(`\n🚨 Mappings with validation issues:`);
      for (const result of hasIssues) {
        console.log(`   • GMDN ${result.gmdnCode}: ${result.gmdnName}`);
        for (const issue of result.issues) {
          console.log(`     - ${issue.type}: ${issue.message}`);
        }
      }
    }
    
    console.log(`\n💡 Summary:`);
    console.log(`   • The validation found ${hasIssues.length} mappings with potential medical accuracy issues`);
    console.log(`   • Most "missing data" issues are likely GMDN codes not in our extracted dataset`);
    console.log(`   • Category mismatches may indicate automatic mappings that need review`);
    console.log(`   • ${okMappings.length} mappings passed validation without issues`);
    
  } catch (error) {
    console.error('❌ Error reading validation report:', error.message);
    console.log('Run "node validate-gmdn-emdn-mappings.cjs" first to generate the report.');
  }
}

summarizeValidation();