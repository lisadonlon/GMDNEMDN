// ICHI Data Utilities
// Generated from WHO ICHI CSV data

export interface IchiEntry {
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

export interface IchiManifest {
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

let ichiManifest: IchiManifest | null = null;
const ichiChunkCache = new Map<string, IchiEntry[]>();

/**
 * Load ICHI manifest file
 */
export async function loadIchiManifest(): Promise<IchiManifest> {
  if (ichiManifest) {
    return ichiManifest;
  }

  try {
    const response = await fetch('/ichi-chunks/ichi-manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load ICHI manifest: ${response.statusText}`);
    }
    ichiManifest = await response.json();
    if (!ichiManifest) {
      throw new Error('Invalid ICHI manifest data');
    }
    return ichiManifest;
  } catch (error) {
    console.error('Error loading ICHI manifest:', error);
    throw error;
  }
}

/**
 * Load a specific ICHI chunk
 */
export async function loadIchiChunk(chunkFile: string): Promise<IchiEntry[]> {
  if (ichiChunkCache.has(chunkFile)) {
    return ichiChunkCache.get(chunkFile)!;
  }

  try {
    const response = await fetch(`/ichi-chunks/${chunkFile}`);
    if (!response.ok) {
      throw new Error(`Failed to load ICHI chunk: ${response.statusText}`);
    }
    const chunk = await response.json();
    ichiChunkCache.set(chunkFile, chunk);
    return chunk;
  } catch (error) {
    console.error(`Error loading ICHI chunk ${chunkFile}:`, error);
    throw error;
  }
}

/**
 * Load all ICHI entries
 */
export async function loadAllIchiEntries(): Promise<IchiEntry[]> {
  const manifest = await loadIchiManifest();
  const allEntries: IchiEntry[] = [];

  for (const chunkInfo of manifest.chunks) {
    const chunk = await loadIchiChunk(chunkInfo.file);
    allEntries.push(...chunk);
  }

  return allEntries;
}

/**
 * Search ICHI entries by text
 */
export async function searchIchiEntries(
  query: string,
  limit: number = 50
): Promise<IchiEntry[]> {
  const manifest = await loadIchiManifest();
  const results: IchiEntry[] = [];
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

  for (const chunkInfo of manifest.chunks) {
    if (results.length >= limit) break;

    const chunk = await loadIchiChunk(chunkInfo.file);
    
    for (const entry of chunk) {
      if (results.length >= limit) break;

      const searchText = `${entry.title} ${entry.code}`.toLowerCase();
      const matches = searchTerms.every(term => searchText.includes(term));

      if (matches) {
        results.push(entry);
      }
    }
  }

  return results;
}

/**
 * Get ICHI entries by classification type
 */
export async function getIchiEntriesByKind(
  classKind: string
): Promise<IchiEntry[]> {
  const allEntries = await loadAllIchiEntries();
  return allEntries.filter(entry => entry.classKind === classKind);
}
