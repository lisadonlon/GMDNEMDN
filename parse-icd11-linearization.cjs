#!/usr/bin/env node

/**
 * ICD-11 Linearization Data Parser
 * Converts ICD-11 linearization CSV files to chunked TypeScript data
 * Supports: MMS, PCL, OPH, NER linearizations
 */

const fs = require('fs');
const path = require('path');

// Column mapping for ICD-11 linearization CSV files
const ICD11_COLUMNS = {
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
    NO_OF_NON_RESIDUAL_CHILDREN: 13,
    // MMS-specific columns (from index 14 onwards)
    PRIMARY_TABULATION: 14,
    GROUPING1: 15,
    GROUPING2: 16,
    GROUPING3: 17,
    GROUPING4: 18,
    GROUPING5: 19
};

class ICD11LinearizationParser {
    constructor(csvFilePath, linearizationType = 'mms') {
        this.csvFilePath = csvFilePath;
        this.linearizationType = linearizationType.toLowerCase(); // 'mms', 'pcl', 'oph', 'ner'
        this.entries = [];
        this.stats = {
            totalEntries: 0,
            chapters: 0,
            blocks: 0,
            categories: 0,
            depthDistribution: {},
            chapterNumbers: new Set()
        };
        this.maxEntriesPerChunk = 1000; // Smaller chunks for large datasets
    }

    /**
     * Parse CSV file and extract structured data
     */
    parseCSV() {
        console.log(`🔍 Parsing ICD-11 ${this.linearizationType.toUpperCase()} linearization: ${this.csvFilePath}`);
        
        const csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
        const lines = csvContent.split('\n');
        
        console.log(`📄 Processing ${lines.length} lines...`);
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = this.parseCSVLine(line);
            if (columns.length < 10) continue; // Skip malformed rows
            
            const entry = this.createEntry(columns, i);
            if (entry) {
                this.entries.push(entry);
                this.updateStats(entry);
            }
            
            // Progress indicator for large files
            if (i % 5000 === 0) {
                console.log(`   ... processed ${i}/${lines.length} lines (${this.entries.length} valid entries)`);
            }
        }
        
        console.log(`✅ Parsed ${this.entries.length} entries from ${lines.length} lines`);
        this.logStats();
    }

    /**
     * Parse a single CSV line, handling quoted fields properly
     */
    parseCSVLine(line) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                columns.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add final column
        columns.push(current.trim());
        
        // Pad with empty strings if we don't have enough columns
        while (columns.length < 20) {
            columns.push('');
        }
        
        return columns;
    }

    /**
     * Create structured entry from CSV columns
     */
    createEntry(columns, lineNumber) {
        const title = this.cleanTitle(columns[ICD11_COLUMNS.TITLE]);
        const code = columns[ICD11_COLUMNS.CODE];
        const classKind = columns[ICD11_COLUMNS.CLASS_KIND];
        
        // Skip empty or invalid entries
        if (!title || title === 'Title' || title.includes('Version:')) return null;
        
        const entry = {
            id: columns[ICD11_COLUMNS.FOUNDATION_URI] || `icd11-${this.linearizationType}-${lineNumber}`,
            code: code || '',
            title: title,
            classKind: classKind || '',
            depth: parseInt(columns[ICD11_COLUMNS.DEPTH_IN_KIND]) || 0,
            isLeaf: columns[ICD11_COLUMNS.IS_LEAF] === 'True',
            isResidual: columns[ICD11_COLUMNS.IS_RESIDUAL] === 'True',
            blockId: columns[ICD11_COLUMNS.BLOCK_ID] || '',
            chapterNo: columns[ICD11_COLUMNS.CHAPTER_NO] || '',
            browserLink: this.cleanUrl(columns[ICD11_COLUMNS.BROWSER_LINK]),
            iCatLink: this.cleanUrl(columns[ICD11_COLUMNS.ICAT_LINK]),
            childrenCount: parseInt(columns[ICD11_COLUMNS.NO_OF_NON_RESIDUAL_CHILDREN]) || 0,
            linearization: this.linearizationType
        };

        // Add MMS-specific fields if this is MMS linearization
        if (this.linearizationType === 'mms' && columns.length > 14) {
            entry.primaryTabulation = columns[ICD11_COLUMNS.PRIMARY_TABULATION] === 'True';
            entry.groupings = {
                grouping1: columns[ICD11_COLUMNS.GROUPING1] || '',
                grouping2: columns[ICD11_COLUMNS.GROUPING2] || '',
                grouping3: columns[ICD11_COLUMNS.GROUPING3] || '',
                grouping4: columns[ICD11_COLUMNS.GROUPING4] || '',
                grouping5: columns[ICD11_COLUMNS.GROUPING5] || ''
            };
        }
        
        return entry;
    }

    /**
     * Clean and normalize title text
     */
    cleanTitle(title) {
        if (!title) return '';
        
        // Remove quotes and clean up
        let cleaned = title
            .replace(/^"/, '')
            .replace(/"$/, '')
            .replace(/""/g, '"')
            .trim();
        
        // Don't remove leading dashes as they indicate hierarchy level
        return cleaned;
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
        
        // Track depth distribution
        this.stats.depthDistribution[entry.depth] = (this.stats.depthDistribution[entry.depth] || 0) + 1;
        
        // Track chapter numbers
        if (entry.chapterNo) {
            this.stats.chapterNumbers.add(entry.chapterNo);
        }
    }

    /**
     * Log parsing statistics
     */
    logStats() {
        console.log('\n📊 Parsing Statistics:');
        console.log(`   Total entries: ${this.stats.totalEntries}`);
        console.log(`   Chapters: ${this.stats.chapters}`);
        console.log(`   Blocks: ${this.stats.blocks}`);
        console.log(`   Categories: ${this.stats.categories}`);
        console.log(`   Unique chapter numbers: ${this.stats.chapterNumbers.size}`);
        
        console.log('\n📏 Depth distribution:');
        Object.entries(this.stats.depthDistribution)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .forEach(([depth, count]) => {
                console.log(`   Depth ${depth}: ${count} entries`);
            });
    }

    /**
     * Create chunks for web loading
     */
    createChunks() {
        console.log(`\n📦 Creating chunks (max ${this.maxEntriesPerChunk} entries per chunk)...`);
        
        const chunks = [];
        for (let i = 0; i < this.entries.length; i += this.maxEntriesPerChunk) {
            const chunk = this.entries.slice(i, i + this.maxEntriesPerChunk);
            chunks.push({
                chunkIndex: chunks.length,
                startIndex: i,
                endIndex: i + chunk.length - 1,
                entryCount: chunk.length,
                entries: chunk
            });
        }
        
        console.log(`✅ Created ${chunks.length} chunks`);
        return chunks;
    }

    /**
     * Save chunks and manifest to output directory
     */
    saveToFiles(outputDir = null) {
        if (!outputDir) {
            outputDir = path.join('public', `icd11-${this.linearizationType}-chunks`);
        }
        
        console.log(`\n💾 Saving to ${outputDir}...`);
        
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const chunks = this.createChunks();
        
        // Save individual chunk files
        chunks.forEach((chunk, index) => {
            const chunkFile = path.join(outputDir, `icd11-${this.linearizationType}-chunk-${index}.json`);
            fs.writeFileSync(chunkFile, JSON.stringify(chunk, null, 2));
            console.log(`   Saved chunk ${index}: ${chunk.entryCount} entries`);
        });
        
        // Create manifest
        const manifest = {
            linearization: this.linearizationType,
            totalEntries: this.stats.totalEntries,
            totalChunks: chunks.length,
            maxEntriesPerChunk: this.maxEntriesPerChunk,
            stats: {
                ...this.stats,
                chapterNumbers: Array.from(this.stats.chapterNumbers).sort()
            },
            chunks: chunks.map(chunk => ({
                index: chunk.chunkIndex,
                file: `icd11-${this.linearizationType}-chunk-${chunk.chunkIndex}.json`,
                entryCount: chunk.entryCount,
                startIndex: chunk.startIndex,
                endIndex: chunk.endIndex
            })),
            generatedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const manifestFile = path.join(outputDir, `icd11-${this.linearizationType}-manifest.json`);
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
        
        console.log(`✅ Saved manifest: ${manifestFile}`);
        return { outputDir, manifest, chunks };
    }

    /**
     * Create TypeScript data utilities
     */
    createTypeScriptUtilities(outputDir) {
        console.log(`\n🔧 Creating TypeScript utilities...`);
        
        const tsContent = `// ICD-11 ${this.linearizationType.toUpperCase()} Linearization Data Utilities
// Generated on ${new Date().toISOString()}

export interface ICD11${this.linearizationType.toUpperCase()}Entry {
  id: string;
  code: string;
  title: string;
  classKind: string;
  depth: number;
  isLeaf: boolean;
  isResidual: boolean;
  blockId: string;
  chapterNo: string;
  browserLink: string;
  iCatLink: string;
  childrenCount: number;
  linearization: string;${this.linearizationType === 'mms' ? `
  primaryTabulation?: boolean;
  groupings?: {
    grouping1: string;
    grouping2: string;
    grouping3: string;
    grouping4: string;
    grouping5: string;
  };` : ''}
}

export interface ICD11${this.linearizationType.toUpperCase()}Chunk {
  chunkIndex: number;
  startIndex: number;
  endIndex: number;
  entryCount: number;
  entries: ICD11${this.linearizationType.toUpperCase()}Entry[];
}

export interface ICD11${this.linearizationType.toUpperCase()}Manifest {
  linearization: string;
  totalEntries: number;
  totalChunks: number;
  maxEntriesPerChunk: number;
  stats: any;
  chunks: any[];
  generatedAt: string;
  version: string;
}

// Load manifest
export async function loadICD11${this.linearizationType.toUpperCase()}Manifest(): Promise<ICD11${this.linearizationType.toUpperCase()}Manifest> {
  const response = await fetch('/icd11-${this.linearizationType}-chunks/icd11-${this.linearizationType}-manifest.json');
  if (!response.ok) {
    throw new Error(\`Failed to load ICD-11 ${this.linearizationType.toUpperCase()} manifest: \${response.statusText}\`);
  }
  return response.json();
}

// Load specific chunk
export async function loadICD11${this.linearizationType.toUpperCase()}Chunk(chunkIndex: number): Promise<ICD11${this.linearizationType.toUpperCase()}Chunk> {
  const response = await fetch(\`/icd11-${this.linearizationType}-chunks/icd11-${this.linearizationType}-chunk-\${chunkIndex}.json\`);
  if (!response.ok) {
    throw new Error(\`Failed to load ICD-11 ${this.linearizationType.toUpperCase()} chunk \${chunkIndex}: \${response.statusText}\`);
  }
  return response.json();
}

// Load all entries (expensive - use sparingly)
export async function loadAllICD11${this.linearizationType.toUpperCase()}Entries(): Promise<ICD11${this.linearizationType.toUpperCase()}Entry[]> {
  const manifest = await loadICD11${this.linearizationType.toUpperCase()}Manifest();
  const allEntries: ICD11${this.linearizationType.toUpperCase()}Entry[] = [];
  
  for (let i = 0; i < manifest.totalChunks; i++) {
    const chunk = await loadICD11${this.linearizationType.toUpperCase()}Chunk(i);
    allEntries.push(...chunk.entries);
  }
  
  return allEntries;
}

// Search entries across all chunks
export async function searchICD11${this.linearizationType.toUpperCase()}Entries(query: string, maxResults: number = 50): Promise<ICD11${this.linearizationType.toUpperCase()}Entry[]> {
  const searchTerms = query.toLowerCase().split(' ');
  const results: ICD11${this.linearizationType.toUpperCase()}Entry[] = [];
  const manifest = await loadICD11${this.linearizationType.toUpperCase()}Manifest();
  
  for (let i = 0; i < manifest.totalChunks && results.length < maxResults; i++) {
    const chunk = await loadICD11${this.linearizationType.toUpperCase()}Chunk(i);
    
    for (const entry of chunk.entries) {
      if (results.length >= maxResults) break;
      
      const searchText = \`\${entry.code} \${entry.title}\`.toLowerCase();
      const matches = searchTerms.every(term => searchText.includes(term));
      
      if (matches) {
        results.push(entry);
      }
    }
  }
  
  return results;
}

// Get entries by class kind (chapter, block, category)
export async function getICD11${this.linearizationType.toUpperCase()}EntriesByClassKind(classKind: string): Promise<ICD11${this.linearizationType.toUpperCase()}Entry[]> {
  const manifest = await loadICD11${this.linearizationType.toUpperCase()}Manifest();
  const results: ICD11${this.linearizationType.toUpperCase()}Entry[] = [];
  
  for (let i = 0; i < manifest.totalChunks; i++) {
    const chunk = await loadICD11${this.linearizationType.toUpperCase()}Chunk(i);
    const filtered = chunk.entries.filter(entry => entry.classKind === classKind);
    results.push(...filtered);
  }
  
  return results;
}
`;
        
        const tsFile = path.join('data', `icd11${this.linearizationType.charAt(0).toUpperCase() + this.linearizationType.slice(1)}Data.ts`);
        fs.writeFileSync(tsFile, tsContent);
        console.log(`✅ Created TypeScript utilities: ${tsFile}`);
        
        return tsFile;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node parse-icd11-linearization.cjs <csv-file> <linearization-type>');
        console.log('Examples:');
        console.log('  node parse-icd11-linearization.cjs data/Copy_of_LinearizationMiniOutput-MMS-en.csv mms');
        console.log('  node parse-icd11-linearization.cjs data/Copy_of_LinearizationMiniOutput-PCL-en.csv pcl');
        console.log('  node parse-icd11-linearization.cjs data/Copy_of_LinearizationMiniOutput-OPH-en.csv oph');
        console.log('  node parse-icd11-linearization.cjs data/Copy_of_LinearizationMiniOutput-NER-en.csv ner');
        process.exit(1);
    }
    
    const csvFile = args[0];
    const linearizationType = args[1];
    
    if (!fs.existsSync(csvFile)) {
        console.error(`❌ CSV file not found: ${csvFile}`);
        process.exit(1);
    }
    
    console.log('🚀 ICD-11 Linearization Parser');
    console.log('================================');
    
    try {
        const parser = new ICD11LinearizationParser(csvFile, linearizationType);
        
        // Parse the CSV
        parser.parseCSV();
        
        // Save chunks and create utilities
        const result = parser.saveToFiles();
        const tsFile = parser.createTypeScriptUtilities(result.outputDir);
        
        console.log('\n✅ Processing complete!');
        console.log(`📁 Output directory: ${result.outputDir}`);
        console.log(`📊 Total entries: ${result.manifest.totalEntries}`);
        console.log(`📦 Total chunks: ${result.manifest.totalChunks}`);
        console.log(`🔧 TypeScript utilities: ${tsFile}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { ICD11LinearizationParser };