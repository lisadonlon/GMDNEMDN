// ICF Data Utilities
// Generated from WHO ICF CSV data

export interface IcfEntry {
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

export interface IcfManifest {
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

let icfManifest: IcfManifest | null = null;
const icfChunkCache = new Map<string, IcfEntry[]>();

/**
 * Load ICF manifest file
 */
export async function loadIcfManifest(): Promise<IcfManifest> {
  if (icfManifest) {
    return icfManifest;
  }

  try {
    const response = await fetch('/icf-chunks/icf-manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load ICF manifest: ${response.statusText}`);
    }
    icfManifest = await response.json();
    return icfManifest;
  } catch (error) {
    console.error('Error loading ICF manifest:', error);
    throw error;
  }
}

/**
 * Load a specific ICF chunk
 */
export async function loadIcfChunk(chunkFile: string): Promise<IcfEntry[]> {
  if (icfChunkCache.has(chunkFile)) {
    return icfChunkCache.get(chunkFile)!;
  }

  try {
    const response = await fetch(`/icf-chunks/${chunkFile}`);
    if (!response.ok) {
      throw new Error(`Failed to load ICF chunk: ${response.statusText}`);
    }
    const chunk = await response.json();
    icfChunkCache.set(chunkFile, chunk);
    return chunk;
  } catch (error) {
    console.error(`Error loading ICF chunk ${chunkFile}:`, error);
    throw error;
  }
}

/**
 * Load all ICF entries
 */
export async function loadAllIcfEntries(): Promise<IcfEntry[]> {
  const manifest = await loadIcfManifest();
  const allEntries: IcfEntry[] = [];

  for (const chunkInfo of manifest.chunks) {
    const chunk = await loadIcfChunk(chunkInfo.file);
    allEntries.push(...chunk);
  }

  return allEntries;
}

/**
 * Search ICF entries by text
 */
export async function searchIcfEntries(
  query: string,
  limit: number = 50
): Promise<IcfEntry[]> {
  const manifest = await loadIcfManifest();
  const results: IcfEntry[] = [];
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

  for (const chunkInfo of manifest.chunks) {
    if (results.length >= limit) break;

    const chunk = await loadIcfChunk(chunkInfo.file);
    
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
 * Get ICF entries by classification type
 */
export async function getIcfEntriesByKind(
  classKind: string
): Promise<IcfEntry[]> {
  const allEntries = await loadAllIcfEntries();
  return allEntries.filter(entry => entry.classKind === classKind);
}
