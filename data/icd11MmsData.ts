// ICD-11 MMS Linearization Data Utilities
// Generated on 2025-10-07T13:09:48.688Z

export interface ICD11MMSEntry {
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
  linearization: string;
  primaryTabulation?: boolean;
  groupings?: {
    grouping1: string;
    grouping2: string;
    grouping3: string;
    grouping4: string;
    grouping5: string;
  };
}

export interface ICD11MMSChunk {
  chunkIndex: number;
  startIndex: number;
  endIndex: number;
  entryCount: number;
  entries: ICD11MMSEntry[];
}

export interface ICD11MMSManifest {
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
export async function loadICD11MMSManifest(): Promise<ICD11MMSManifest> {
  const response = await fetch('/icd11-mms-chunks/icd11-mms-manifest.json');
  if (!response.ok) {
    throw new Error(`Failed to load ICD-11 MMS manifest: ${response.statusText}`);
  }
  return response.json();
}

// Load specific chunk
export async function loadICD11MMSChunk(chunkIndex: number): Promise<ICD11MMSChunk> {
  const response = await fetch(`/icd11-mms-chunks/icd11-mms-chunk-${chunkIndex}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load ICD-11 MMS chunk ${chunkIndex}: ${response.statusText}`);
  }
  return response.json();
}

// Load all entries (expensive - use sparingly)
export async function loadAllICD11MMSEntries(): Promise<ICD11MMSEntry[]> {
  const manifest = await loadICD11MMSManifest();
  const allEntries: ICD11MMSEntry[] = [];
  
  for (let i = 0; i < manifest.totalChunks; i++) {
    const chunk = await loadICD11MMSChunk(i);
    allEntries.push(...chunk.entries);
  }
  
  return allEntries;
}

// Search entries across all chunks
export async function searchICD11MMSEntries(query: string, maxResults: number = 50): Promise<ICD11MMSEntry[]> {
  const searchTerms = query.toLowerCase().split(' ');
  const results: ICD11MMSEntry[] = [];
  const manifest = await loadICD11MMSManifest();
  
  for (let i = 0; i < manifest.totalChunks && results.length < maxResults; i++) {
    const chunk = await loadICD11MMSChunk(i);
    
    for (const entry of chunk.entries) {
      if (results.length >= maxResults) break;
      
      const searchText = `${entry.code} ${entry.title}`.toLowerCase();
      const matches = searchTerms.every(term => searchText.includes(term));
      
      if (matches) {
        results.push(entry);
      }
    }
  }
  
  return results;
}

// Get entries by class kind (chapter, block, category)
export async function getICD11MMSEntriesByClassKind(classKind: string): Promise<ICD11MMSEntry[]> {
  const manifest = await loadICD11MMSManifest();
  const results: ICD11MMSEntry[] = [];
  
  for (let i = 0; i < manifest.totalChunks; i++) {
    const chunk = await loadICD11MMSChunk(i);
    const filtered = chunk.entries.filter(entry => entry.classKind === classKind);
    results.push(...filtered);
  }
  
  return results;
}
