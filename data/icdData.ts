// ICD-10 Data Loading Utilities
// Similar to emdnData.ts but for ICD-10 chunks

export interface IcdCode {
  id: string;
  code: string;
  title: string;
  definition: string;
  chapter: string;
  chapterTitle: string;
  blockId: string;
  version: string;
  releaseId: string;
}

export interface IcdChunk {
  id: number;
  startIndex: number;
  endIndex: number;
  count: number;
  entities: IcdCode[];
}

export interface IcdManifest {
  version: string;
  generated: string;
  source: string;
  release: {
    releaseId: string;
    title: string;
    description: string;
    version: string;
  };
  totalEntries: number;
  totalChunks: number;
  chunkSize: number;
  chunks: Array<{
    id: number;
    startIndex: number;
    endIndex: number;
    count: number;
    file: string;
  }>;
}

// Cache for loaded chunks
const chunkCache = new Map<number, IcdCode[]>();
let manifestCache: IcdManifest | null = null;

// Load manifest
export async function loadIcdManifest(): Promise<IcdManifest> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const response = await fetch('/icd-chunks/icd10-manifest.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    manifestCache = await response.json();
    return manifestCache!;
  } catch (error) {
    console.error('Failed to load ICD manifest:', error);
    throw new Error('ICD data is not available. Please ensure the ICD chunks have been generated.');
  }
}

// Load a specific chunk
export async function loadIcdChunk(chunkId: number): Promise<IcdCode[]> {
  if (chunkCache.has(chunkId)) {
    return chunkCache.get(chunkId)!;
  }

  try {
    const response = await fetch(`/icd-chunks/icd10-chunk-${chunkId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const chunkData: IcdCode[] = await response.json();
    chunkCache.set(chunkId, chunkData);
    return chunkData;
  } catch (error) {
    console.error(`Failed to load ICD chunk ${chunkId}:`, error);
    throw new Error(`Failed to load ICD chunk ${chunkId}`);
  }
}

// Load all ICD codes (for small datasets)
export async function loadAllIcdCodes(): Promise<IcdCode[]> {
  const manifest = await loadIcdManifest();
  const allCodes: IcdCode[] = [];

  // Load all chunks
  for (const chunkInfo of manifest.chunks) {
    const chunkData = await loadIcdChunk(chunkInfo.id);
    allCodes.push(...chunkData);
  }

  return allCodes;
}

// Search ICD codes
export async function searchIcdCodes(query: string, limit: number = 50): Promise<IcdCode[]> {
  const allCodes = await loadAllIcdCodes();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return allCodes.slice(0, limit);
  }

  const results = allCodes.filter(code => 
    code.code.toLowerCase().includes(searchTerm) ||
    code.title.toLowerCase().includes(searchTerm) ||
    code.definition.toLowerCase().includes(searchTerm)
  );

  return results.slice(0, limit);
}

// Get ICD code by code
export async function getIcdByCode(code: string): Promise<IcdCode | null> {
  const allCodes = await loadAllIcdCodes();
  return allCodes.find(icd => icd.code === code) || null;
}

// Get ICD codes by chapter
export async function getIcdsByChapter(chapter: string): Promise<IcdCode[]> {
  const allCodes = await loadAllIcdCodes();
  return allCodes.filter(code => code.chapter === chapter || code.code === chapter);
}