#!/usr/bin/env node
/**
 * EMDN Chunking Script
 * 
 * This script reads the EMDN.txt file and splits it into:
 * 1. Individual JSON files per category (emdn-A.json, emdn-B.json, etc.)
 * 2. A manifest.json file listing all categories
 * 3. An emdn-complete.json file with all data
 * 
 * Usage: node chunk-emdn.js [path/to/EMDN.txt] [output-dir]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const args = process.argv.slice(2);
const inputFile = args[0] || './data/EMDN.txt';
const outputDir = args[1] || './emdn-chunks';

if (!inputFile || !fs.existsSync(inputFile)) {
  console.error('Usage: node chunk-emdn.js [EMDN.txt] [output-directory]');
  console.error('Example: node chunk-emdn.js "./data/EMDN.txt" ./emdn-output');
  console.error('');
  console.error('Default: Will look for ./data/EMDN.txt');
  
  if (inputFile) {
    console.error(`Error: File not found: ${inputFile}`);
  }
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

console.log('='.repeat(60));
console.log('EMDN Chunking Script');
console.log('='.repeat(60));
console.log(`Input file: ${inputFile}`);
console.log(`Output directory: ${outputDir}`);
console.log('');

// Read and parse the file
console.log('Reading file...');
const content = fs.readFileSync(inputFile, 'utf-8');
// Handle different line endings (Windows CRLF, Unix LF, old Mac CR)
const lines = content.split(/\r?\n|\r/);

console.log(`Total lines: ${lines.length.toLocaleString()}`);

// Skip header rows (first 2 lines: title and column headers)
const dataLines = lines.slice(2).filter(line => line.trim());

console.log(`Data lines: ${dataLines.length.toLocaleString()}`);
console.log('');

// Parse entries by category
console.log('Parsing entries...');
const entriesByCategory = new Map();
let processedCount = 0;
let skippedCount = 0;
const errors = [];

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const parts = line.split('\t');
  
  // Validate format
  if (parts.length < 6) {
    skippedCount++;
    errors.push(`Line ${i + 3}: Invalid format (${parts.length} columns)`);
    continue;
  }

  // Parse entry
  const category = parts[0].trim();
  const level = parseInt(parts[4].trim());
  const isTerminal = parts[5].trim().toUpperCase() === 'YES';

  if (!category || isNaN(level)) {
    skippedCount++;
    errors.push(`Line ${i + 3}: Missing category or invalid level`);
    continue;
  }

  const entry = {
    category,
    categoryDescription: parts[1].trim(),
    code: parts[2].trim(),
    term: parts[3].trim(),
    level,
    isTerminal
  };

  // Group by category
  if (!entriesByCategory.has(category)) {
    entriesByCategory.set(category, []);
  }
  
  entriesByCategory.get(category).push(entry);
  processedCount++;

  // Progress indicator
  if ((i + 1) % 1000 === 0) {
    process.stdout.write(`\rProcessed: ${(i + 1).toLocaleString()} / ${dataLines.length.toLocaleString()}`);
  }
}

console.log(`\rProcessed: ${processedCount.toLocaleString()} entries`);
console.log(`Skipped: ${skippedCount.toLocaleString()} lines`);
console.log(`Categories: ${entriesByCategory.size}`);
console.log('');

// Show first few errors if any
if (errors.length > 0) {
  console.log('First few errors:');
  errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
  if (errors.length > 5) {
    console.log(`  ... and ${errors.length - 5} more`);
  }
  console.log('');
}

// Write individual category files
console.log('Writing category files...');
const manifest = {
  generated: new Date().toISOString(),
  totalEntries: processedCount,
  totalCategories: entriesByCategory.size,
  categories: []
};

const sortedCategories = Array.from(entriesByCategory.keys()).sort();

for (const category of sortedCategories) {
  const entries = entriesByCategory.get(category);
  const filename = `emdn-${category}.json`;
  const filepath = path.join(outputDir, filename);
  
  const categoryData = {
    category,
    categoryDescription: entries[0].categoryDescription,
    entryCount: entries.length,
    terminalCount: entries.filter(e => e.isTerminal).length,
    entries
  };
  
  fs.writeFileSync(filepath, JSON.stringify(categoryData, null, 2));
  
  manifest.categories.push({
    category,
    filename,
    entryCount: entries.length,
    terminalCount: categoryData.terminalCount,
    categoryDescription: entries[0].categoryDescription
  });
  
  console.log(`  ✓ ${category}: ${entries.length.toLocaleString()} entries → ${filename}`);
}

console.log('');

// Write manifest
console.log('Writing manifest.json...');
const manifestPath = path.join(outputDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`  ✓ ${manifestPath}`);
console.log('');

// Write complete file
console.log('Writing emdn-complete.json...');
const allEntries = [];
for (const entries of entriesByCategory.values()) {
  allEntries.push(...entries);
}

const completePath = path.join(outputDir, 'emdn-complete.json');
fs.writeFileSync(
  completePath,
  JSON.stringify({
    metadata: manifest,
    entries: allEntries
  }, null, 2)
);
console.log(`  ✓ ${completePath}`);
console.log('');

// Create a TypeScript loader utility
console.log('Creating TypeScript loader utility...');
const loaderCode = `/**
 * EMDN Data Loader
 * Generated: ${new Date().toISOString()}
 */

export interface EMDNEntry {
  category: string;
  categoryDescription: string;
  code: string;
  term: string;
  level: number;
  isTerminal: boolean;
}

export interface EMDNCategoryData {
  category: string;
  categoryDescription: string;
  entryCount: number;
  terminalCount: number;
  entries: EMDNEntry[];
}

export interface EMDNManifest {
  generated: string;
  totalEntries: number;
  totalCategories: number;
  categories: Array<{
    category: string;
    filename: string;
    entryCount: number;
    terminalCount: number;
    categoryDescription: string;
  }>;
}

/**
 * Load manifest
 */
export async function loadEMDNManifest(basePath: string = './emdn-chunks'): Promise<EMDNManifest> {
  const response = await fetch(\`\${basePath}/manifest.json\`);
  return response.json();
}

/**
 * Load a specific EMDN category
 */
export async function loadEMDNCategory(category: string, basePath: string = './emdn-chunks'): Promise<EMDNCategoryData> {
  const response = await fetch(\`\${basePath}/emdn-\${category}.json\`);
  return response.json();
}

/**
 * Load all EMDN categories
 */
export async function loadAllEMDNCategories(basePath: string = './emdn-chunks'): Promise<Map<string, EMDNCategoryData>> {
  const manifest = await loadEMDNManifest(basePath);
  const categories = new Map<string, EMDNCategoryData>();
  
  await Promise.all(
    manifest.categories.map(async (cat) => {
      const data = await loadEMDNCategory(cat.category, basePath);
      categories.set(cat.category, data);
    })
  );
  
  return categories;
}

/**
 * Search across all EMDN entries
 */
export async function searchEMDNEntries(
  query: string, 
  basePath: string = './emdn-chunks'
): Promise<EMDNEntry[]> {
  const manifest = await loadEMDNManifest(basePath);
  const results: EMDNEntry[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const cat of manifest.categories) {
    const categoryData = await loadEMDNCategory(cat.category, basePath);
    
    const matches = categoryData.entries.filter(entry =>
      entry.code.toLowerCase().includes(lowerQuery) ||
      entry.term.toLowerCase().includes(lowerQuery) ||
      entry.categoryDescription.toLowerCase().includes(lowerQuery)
    );
    
    results.push(...matches);
  }
  
  return results;
}

/**
 * Get EMDN entry by code
 */
export async function getEMDNByCode(
  code: string, 
  basePath: string = './emdn-chunks'
): Promise<EMDNEntry | null> {
  // Extract category from code (first letter)
  const category = code.charAt(0).toUpperCase();
  
  try {
    const categoryData = await loadEMDNCategory(category, basePath);
    return categoryData.entries.find(e => e.code === code) || null;
  } catch {
    return null;
  }
}

/**
 * Get all entries at a specific level
 */
export async function getEMDNEntriesByLevel(
  level: number,
  basePath: string = './emdn-chunks'
): Promise<EMDNEntry[]> {
  const manifest = await loadEMDNManifest(basePath);
  const results: EMDNEntry[] = [];
  
  for (const cat of manifest.categories) {
    const categoryData = await loadEMDNCategory(cat.category, basePath);
    const levelEntries = categoryData.entries.filter(entry => entry.level === level);
    results.push(...levelEntries);
  }
  
  return results;
}

/**
 * Get all terminal entries (leaf nodes)
 */
export async function getTerminalEMDNEntries(
  basePath: string = './emdn-chunks'
): Promise<EMDNEntry[]> {
  const manifest = await loadEMDNManifest(basePath);
  const results: EMDNEntry[] = [];
  
  for (const cat of manifest.categories) {
    const categoryData = await loadEMDNCategory(cat.category, basePath);
    const terminalEntries = categoryData.entries.filter(entry => entry.isTerminal);
    results.push(...terminalEntries);
  }
  
  return results;
}
`;

fs.writeFileSync(path.join(outputDir, 'emdn-loader.ts'), loaderCode);
console.log(`  ✓ ${path.join(outputDir, 'emdn-loader.ts')}`);
console.log('');

// Summary
console.log('='.repeat(60));
console.log('COMPLETE!');
console.log('='.repeat(60));
console.log(`Total entries processed: ${processedCount.toLocaleString()}`);
console.log(`Total categories: ${entriesByCategory.size}`);
console.log(`Output directory: ${outputDir}`);
console.log('');
console.log('Files created:');
console.log(`  - ${entriesByCategory.size} category files (emdn-A.json, emdn-B.json, etc.)`);
console.log(`  - 1 manifest file (manifest.json)`);
console.log(`  - 1 complete file (emdn-complete.json)`);
console.log(`  - 1 TypeScript loader (emdn-loader.ts)`);
console.log('');
console.log('Category breakdown:');
manifest.categories.forEach(cat => {
  console.log(`  ${cat.category}: ${cat.entryCount.toLocaleString()} entries (${cat.terminalCount.toLocaleString()} terminal)`);
});
console.log('');
console.log('Next steps:');
console.log(`  1. Copy the ${outputDir} folder to your web project`);
console.log('  2. Use emdn-loader.ts to load data in your application');
console.log('  3. Each category file is optimized for on-demand loading');
console.log('  4. Use searchEMDNEntries() for full-text search across all categories');
console.log('  5. Use getEMDNByCode() for direct code lookups');
console.log('');
