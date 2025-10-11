#!/usr/bin/env node
/**
 * Memory-efficient GMDN extraction from gmdnTerms.txt
 * Processes in streaming mode to handle large files
 */

const fs = require('fs');
const readline = require('readline');

/**
 * Memory-efficient streaming parser
 */
async function parseGMDNTermsStream(filePath, outputDir) {
  console.log('Parsing GUDID gmdnTerms.txt file in streaming mode...');
  console.log('Processing large file efficiently...\n');

  // Use Map for deduplication but limit memory usage
  const gmdnCodes = new Set(); // Just track unique codes first
  const processedBatches = [];
  let currentBatch = new Map();
  const BATCH_SIZE = 10000; // Process in smaller batches
  
  let lineCount = 0;
  let validEntries = 0;
  let batchCount = 0;

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // Create output streams
  const tsStream = fs.createWriteStream(`${outputDir}/gmdnFromGUDID.ts`);
  const jsonStream = fs.createWriteStream(`${outputDir}/gmdn-codes.json`);

  // Write headers
  tsStream.write(`/**
 * GMDN Codes extracted from FDA GUDID Database
 * Generated: ${new Date().toISOString()}
 * Source: https://accessgudid.nlm.nih.gov/
 */

import { SecondaryCode } from '../types';

export const gmdnFromGUDID: SecondaryCode[] = [
`);

  jsonStream.write('{"metadata":{"source":"FDA GUDID","generated":"' + new Date().toISOString() + '"},"codes":[');
  let firstJson = true;

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount % 100000 === 0) {
      process.stdout.write(`\rProcessed ${lineCount.toLocaleString()} lines, ${gmdnCodes.size.toLocaleString()} unique codes...`);
    }

    const fields = line.split('|');
    
    if (fields.length < 6) continue;
    
    const gmdnName = fields[1]?.trim();
    const gmdnDefinition = fields[2]?.trim();
    const gmdnCode = fields[3]?.trim();
    const gmdnStatus = fields[4]?.trim();
    
    if (!gmdnCode || !gmdnName || !gmdnCode.match(/^\d{5}$/) || gmdnStatus !== 'Active') continue;
    
    // Skip if we've already seen this code
    if (gmdnCodes.has(gmdnCode)) continue;
    
    gmdnCodes.add(gmdnCode);
    validEntries++;

    // Write to TypeScript file
    tsStream.write(`  {
    code: '${gmdnCode}',
    description: ${JSON.stringify(gmdnName)},
    relatedEmdnCodes: [],
  },
`);

    // Write to JSON file
    if (!firstJson) jsonStream.write(',');
    jsonStream.write(JSON.stringify({
      code: gmdnCode,
      description: gmdnName,
      definition: gmdnDefinition?.substring(0, 200) + (gmdnDefinition?.length > 200 ? '...' : ''),
      relatedEmdnCodes: []
    }));
    firstJson = false;

    // Occasional garbage collection hint
    if (validEntries % 1000 === 0) {
      if (global.gc) global.gc();
    }
  }

  // Close files
  tsStream.write(`];

/**
 * Search GMDN by code or term
 */
export function searchGMDNFromGUDID(query: string): SecondaryCode[] {
  const lowerQuery = query.toLowerCase();
  return gmdnFromGUDID.filter(item =>
    item.code.includes(query) ||
    item.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get GMDN by exact code
 */
export function getGMDNFromGUDIDByCode(code: string): SecondaryCode | undefined {
  return gmdnFromGUDID.find(item => item.code === code);
}
`);

  jsonStream.write(']}');
  
  tsStream.end();
  jsonStream.end();

  console.log(`\n\nStreaming parse complete!`);
  console.log(`Total lines processed: ${lineCount.toLocaleString()}`);
  console.log(`Unique active GMDN codes: ${gmdnCodes.size.toLocaleString()}`);
  console.log(`Valid entries written: ${validEntries.toLocaleString()}\n`);

  return gmdnCodes.size;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node extract-gmdn-stream.cjs <gmdnTerms.txt> [output-dir]');
  process.exit(1);
}

const gmdnFile = args[0];
const outputDir = args[1] || './gmdn-output';

if (!fs.existsSync(gmdnFile)) {
  console.error(`Error: File not found: ${gmdnFile}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('='.repeat(60));
console.log('GMDN Streaming Extraction');
console.log('='.repeat(60));

parseGMDNTermsStream(gmdnFile, outputDir)
  .then(uniqueCount => {
    console.log('='.repeat(60));
    console.log('✓ Complete!');
    console.log('='.repeat(60));
    console.log(`Extracted ${uniqueCount.toLocaleString()} unique GMDN codes`);
    console.log('');
    console.log('Files created:');
    console.log('- gmdn-output/gmdnFromGUDID.ts (for app integration)');
    console.log('- gmdn-output/gmdn-codes.json (complete data)');
    console.log('');
    console.log('Next step: Copy gmdnFromGUDID.ts to data/ directory');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });