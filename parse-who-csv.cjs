#!/usr/bin/env node

/**
 * WHO Classification Data Parser
 * Converts ICF/ICHI CSV files to chunked TypeScript data
 * Supports: ICF (International Classification of Functioning, Disability and Health)
 *          ICHI (International Classification of Health Interventions)
 */

const fs = require('fs');
const path = require('path');

// Column mapping for WHO CSV files
const WHO_COLUMNS = {
    FOUNDATION_URI: 0,
    LINEARIZATION_URI: 1,
    CODE: 2,
    BLOCK_ID: 3,
    TITLE: 4,
    CLASS_KIND: 5,
    DEPTH_IN_KIND: 6,
    IS_RESIDUAL: 7,
    PRIMARY_LOCATION: 8,
    CHAPTER_NO: 9,
    BROWSER_LINK: 10,
    ICAT_LINK: 11,
    IS_LEAF: 12,
    NO_OF_NON_RESIDUAL_CHILDREN: 13
};

class WhoDataParser {
    constructor(csvFilePath, outputType = 'icf') {
        this.csvFilePath = csvFilePath;
        this.outputType = outputType.toLowerCase(); // 'icf' or 'ichi'
        this.entries = [];
        this.stats = {
            totalEntries: 0,
            totalCategories: 0,
            chapters: 0,
            blocks: 0,
            categories: 0
        };
    }

    /**
     * Parse CSV file and extract structured data
     */
    parseCSV() {
        console.log(`🔍 Parsing ${this.outputType.toUpperCase()} CSV file: ${this.csvFilePath}`);
        
        const csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
        const lines = csvContent.split('\n');
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = this.parseCSVLine(line);
            if (columns.length < 10) continue; // Skip malformed rows
            
            const entry = this.createEntry(columns);
            if (entry && entry.code) {
                this.entries.push(entry);
                this.updateStats(entry);
            }
        }
        
        console.log(`✅ Parsed ${this.entries.length} entries`);
        this.logStats();
    }

    /**
     * Parse a single CSV line, handling quoted fields properly
     */
    parseCSVLine(line) {
        // Simple CSV parsing - split by comma and handle basic quotes
        const columns = line.split(',').map(col => col.trim());
        
        // Pad with empty strings if we don't have enough columns
        while (columns.length < 15) {
            columns.push('');
        }
        
        return columns;
    }

    /**
     * Create structured entry from CSV columns
     */
    createEntry(columns) {
        const title = this.cleanTitle(columns[WHO_COLUMNS.TITLE]);
        const code = columns[WHO_COLUMNS.CODE];
        const classKind = columns[WHO_COLUMNS.CLASS_KIND];
        
        // Skip empty or invalid entries
        if (!title || title === 'Title') return null;
        
        return {
            id: columns[WHO_COLUMNS.FOUNDATION_URI] || `${this.outputType}-${this.entries.length}`,
            code: code || '',
            title: title,
            classKind: classKind || '',
            depth: parseInt(columns[WHO_COLUMNS.DEPTH_IN_KIND]) || 0,
            isLeaf: columns[WHO_COLUMNS.IS_LEAF] === 'True',
            blockId: columns[WHO_COLUMNS.BLOCK_ID] || '',
            browserLink: this.cleanUrl(columns[WHO_COLUMNS.BROWSER_LINK]),
            childrenCount: parseInt(columns[WHO_COLUMNS.NO_OF_NON_RESIDUAL_CHILDREN]) || 0
        };
    }

    /**
     * Clean and normalize title text
     */
    cleanTitle(title) {
        if (!title) return '';
        
        // Remove quotes and clean up
        return title
            .replace(/^"/, '')
            .replace(/"$/, '')
            .replace(/""/g, '"')
            .replace(/^- /, '') // Remove leading dash for hierarchy
            .trim();
    }

    /**
     * Extract clean URL from hyperlink formula or simple text
     */
    cleanUrl(linkText) {
        if (!linkText) return '';
        
        // Handle simple text links
        if (linkText === 'browser' || linkText === 'iCat') {
            return linkText;
        }
        
        const match = linkText.match(/https?:\/\/[^"]+/);
        return match ? match[0] : linkText;
    }

    /**
     * Update parsing statistics
     */
    updateStats(entry) {
        this.stats.totalEntries++;
        
        switch (entry.classKind) {
            case 'chapter':
                this.stats.chapters++;
                break;
            case 'block':
                this.stats.blocks++;
                break;
            case 'category':
                this.stats.categories++;
                break;
        }
        
        if (entry.code) {
            this.stats.totalCategories++;
        }
    }

    /**
     * Generate chunked data files
     */
    generateChunks() {
        console.log(`\n📦 Generating ${this.outputType.toUpperCase()} chunks...`);
        
        const chunkSize = 1000; // Entries per chunk
        const chunks = [];
        
        for (let i = 0; i < this.entries.length; i += chunkSize) {
            const chunk = this.entries.slice(i, i + chunkSize);
            chunks.push(chunk);
        }
        
        // Create output directory
        const outputDir = path.join(process.cwd(), 'public', `${this.outputType}-chunks`);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Generate chunk files
        chunks.forEach((chunk, index) => {
            const chunkFile = path.join(outputDir, `${this.outputType}-chunk-${index}.json`);
            fs.writeFileSync(chunkFile, JSON.stringify(chunk, null, 2));
            console.log(`  ✅ Created ${path.basename(chunkFile)} (${chunk.length} entries)`);
        });
        
        // Generate manifest
        const manifest = {
            type: this.outputType.toUpperCase(),
            version: '1.0.0',
            generated: new Date().toISOString(),
            totalEntries: this.stats.totalEntries,
            totalCategories: this.stats.totalCategories,
            totalChunks: chunks.length,
            chunkSize: chunkSize,
            stats: this.stats,
            chunks: chunks.map((chunk, index) => ({
                file: `${this.outputType}-chunk-${index}.json`,
                entries: chunk.length,
                firstEntry: chunk[0]?.title || '',
                lastEntry: chunk[chunk.length - 1]?.title || ''
            }))
        };
        
        const manifestFile = path.join(outputDir, `${this.outputType}-manifest.json`);
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
        console.log(`  ✅ Created ${path.basename(manifestFile)}`);
        
        console.log(`\n🎉 Generated ${chunks.length} chunks with ${this.stats.totalEntries} total entries`);
        return outputDir;
    }

    /**
     * Generate TypeScript data utilities
     */
    generateDataUtils() {
        console.log(`\n🔧 Generating ${this.outputType.toUpperCase()} data utilities...`);
        
        const utilsContent = `// ${this.outputType.toUpperCase()} Data Utilities
// Generated from WHO ${this.outputType.toUpperCase()} CSV data

export interface ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry {
  id: string;
  code: string;
  title: string;
  classKind: string;
  depth: number;
  isLeaf: boolean;
  blockId: string;
  browserLink: string;
  childrenCount: number;
}

export interface ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest {
  type: string;
  version: string;
  generated: string;
  totalEntries: number;
  totalCategories: number;
  totalChunks: number;
  chunkSize: number;
  stats: {
    totalEntries: number;
    totalCategories: number;
    chapters: number;
    blocks: number;
    categories: number;
  };
  chunks: Array<{
    file: string;
    entries: number;
    firstEntry: string;
    lastEntry: string;
  }>;
}

let ${this.outputType}Manifest: ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest | null = null;
const ${this.outputType}ChunkCache = new Map<string, ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[]>();

/**
 * Load ${this.outputType.toUpperCase()} manifest file
 */
export async function load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest(): Promise<${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest> {
  if (${this.outputType}Manifest) {
    return ${this.outputType}Manifest;
  }

  try {
    const response = await fetch('/${this.outputType}-chunks/${this.outputType}-manifest.json');
    if (!response.ok) {
      throw new Error(\`Failed to load ${this.outputType.toUpperCase()} manifest: \${response.statusText}\`);
    }
    ${this.outputType}Manifest = await response.json();
    return ${this.outputType}Manifest;
  } catch (error) {
    console.error('Error loading ${this.outputType.toUpperCase()} manifest:', error);
    throw error;
  }
}

/**
 * Load a specific ${this.outputType.toUpperCase()} chunk
 */
export async function load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Chunk(chunkFile: string): Promise<${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[]> {
  if (${this.outputType}ChunkCache.has(chunkFile)) {
    return ${this.outputType}ChunkCache.get(chunkFile)!;
  }

  try {
    const response = await fetch(\`/${this.outputType}-chunks/\${chunkFile}\`);
    if (!response.ok) {
      throw new Error(\`Failed to load ${this.outputType.toUpperCase()} chunk: \${response.statusText}\`);
    }
    const chunk = await response.json();
    ${this.outputType}ChunkCache.set(chunkFile, chunk);
    return chunk;
  } catch (error) {
    console.error(\`Error loading ${this.outputType.toUpperCase()} chunk \${chunkFile}:\`, error);
    throw error;
  }
}

/**
 * Load all ${this.outputType.toUpperCase()} entries
 */
export async function loadAll${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entries(): Promise<${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[]> {
  const manifest = await load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest();
  const allEntries: ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[] = [];

  for (const chunkInfo of manifest.chunks) {
    const chunk = await load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Chunk(chunkInfo.file);
    allEntries.push(...chunk);
  }

  return allEntries;
}

/**
 * Search ${this.outputType.toUpperCase()} entries by text
 */
export async function search${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entries(
  query: string,
  limit: number = 50
): Promise<${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[]> {
  const manifest = await load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Manifest();
  const results: ${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[] = [];
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

  for (const chunkInfo of manifest.chunks) {
    if (results.length >= limit) break;

    const chunk = await load${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Chunk(chunkInfo.file);
    
    for (const entry of chunk) {
      if (results.length >= limit) break;

      const searchText = \`\${entry.title} \${entry.code}\`.toLowerCase();
      const matches = searchTerms.every(term => searchText.includes(term));

      if (matches) {
        results.push(entry);
      }
    }
  }

  return results;
}

/**
 * Get ${this.outputType.toUpperCase()} entries by classification type
 */
export async function get${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}EntriesByKind(
  classKind: string
): Promise<${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entry[]> {
  const allEntries = await loadAll${this.outputType.charAt(0).toUpperCase() + this.outputType.slice(1)}Entries();
  return allEntries.filter(entry => entry.classKind === classKind);
}
`;

        const utilsFile = path.join(process.cwd(), 'data', `${this.outputType}Data.ts`);
        fs.writeFileSync(utilsFile, utilsContent);
        console.log(`  ✅ Created ${path.basename(utilsFile)}`);
    }

    /**
     * Log parsing statistics
     */
    logStats() {
        console.log(`\n📊 ${this.outputType.toUpperCase()} Statistics:`);
        console.log(`  Total Entries: ${this.stats.totalEntries}`);
        console.log(`  Chapters: ${this.stats.chapters}`);
        console.log(`  Blocks: ${this.stats.blocks}`);
        console.log(`  Categories: ${this.stats.categories}`);
        console.log(`  With Codes: ${this.stats.totalCategories}`);
    }

    /**
     * Process complete workflow
     */
    async process() {
        try {
            this.parseCSV();
            const outputDir = this.generateChunks();
            this.generateDataUtils();
            
            console.log(`\n🎉 ${this.outputType.toUpperCase()} processing complete!`);
            console.log(`📁 Output directory: ${outputDir}`);
            
            return {
                success: true,
                outputDir,
                stats: this.stats
            };
        } catch (error) {
            console.error(`❌ Error processing ${this.outputType.toUpperCase()}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI Interface
function showHelp() {
    console.log(`
WHO Classification Data Parser

Usage:
  node parse-who-csv.cjs <csv-file> <type>

Arguments:
  csv-file    Path to the CSV file (ICF or ICHI)
  type        Classification type: 'icf' or 'ichi'

Examples:
  node parse-who-csv.cjs data/icf-data.csv icf
  node parse-who-csv.cjs data/ichi-data.csv ichi

Output:
  - Chunked JSON files in public/<type>-chunks/
  - TypeScript utilities in data/<type>Data.ts
  - Manifest file with metadata
`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    
    const [csvFile, type] = args;
    
    if (!['icf', 'ichi'].includes(type.toLowerCase())) {
        console.error('❌ Type must be "icf" or "ichi"');
        process.exit(1);
    }
    
    if (!fs.existsSync(csvFile)) {
        console.error(`❌ File not found: ${csvFile}`);
        process.exit(1);
    }
    
    console.log(`🚀 Starting ${type.toUpperCase()} data processing...`);
    
    const parser = new WhoDataParser(csvFile, type);
    const result = await parser.process();
    
    if (result.success) {
        console.log('✅ Processing completed successfully!');
        process.exit(0);
    } else {
        console.error(`❌ Processing failed: ${result.error}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { WhoDataParser };