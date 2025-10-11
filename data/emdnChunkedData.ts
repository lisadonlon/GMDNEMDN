import { EmdnCode } from '../types';

// This file loads and transforms the chunked EMDN data to work with the existing app structure

export interface EMDNEntry {
  category: string;
  categoryDescription: string;
  code: string;
  term: string;
  level: number;
  isTerminal: boolean;
}

// Transform EMDN entries to match the existing EmdnCode interface
function transformEMDNEntry(entry: EMDNEntry): EmdnCode {
  // Calculate parent code based on hierarchical level and code structure
  let parentCode: string | undefined;
  
  if (entry.level > 1) {
    // For codes like A01 -> parent is A
    // For codes like A0101 -> parent is A01
    // For codes like A010101 -> parent is A0101
    
    if (entry.code.length > 1) {
      if (entry.code.length === 3) {
        // Level 2: A01 -> A
        parentCode = entry.code.charAt(0);
      } else if (entry.code.length === 5) {
        // Level 3: A0101 -> A01
        parentCode = entry.code.substring(0, 3);
      } else if (entry.code.length === 7) {
        // Level 4: A010101 -> A0101
        parentCode = entry.code.substring(0, 5);
      } else if (entry.code.length === 9) {
        // Level 5: A01010101 -> A010101
        parentCode = entry.code.substring(0, 7);
      } else if (entry.code.length === 11) {
        // Level 6: A0101010101 -> A01010101
        parentCode = entry.code.substring(0, 9);
      }
    }
  }

  return {
    code: entry.code,
    description: entry.term,
    parentCode
  };
}

// Cache for loaded categories
const categoryCache = new Map<string, EMDNEntry[]>();
let allEntriesCache: EmdnCode[] | null = null;

// Load a specific category
async function loadCategory(category: string): Promise<EMDNEntry[]> {
  if (categoryCache.has(category)) {
    return categoryCache.get(category)!;
  }

  try {
    const response = await fetch(`/emdn-chunks/emdn-${category}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load category ${category}`);
    }
    const data = await response.json();
    categoryCache.set(category, data.entries);
    return data.entries;
  } catch (error) {
    console.error(`Error loading EMDN category ${category}:`, error);
    return [];
  }
}

// Load all EMDN data (combines all categories)
export async function loadAllEMDNData(): Promise<EmdnCode[]> {
  if (allEntriesCache) {
    return allEntriesCache;
  }

  try {
    // Load manifest to get list of categories
    const manifestResponse = await fetch('/emdn-chunks/manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load EMDN manifest');
    }
    const manifest = await manifestResponse.json();

    // Load all categories
    const allEntries: EMDNEntry[] = [];
    for (const categoryInfo of manifest.categories) {
      const categoryEntries = await loadCategory(categoryInfo.category);
      allEntries.push(...categoryEntries);
    }

    // Transform to EmdnCode format
    allEntriesCache = allEntries.map(transformEMDNEntry);
    return allEntriesCache;
  } catch (error) {
    console.error('Error loading EMDN data:', error);
    // Fallback to empty array if loading fails
    return [];
  }
}

// Search function that works with chunked data
export async function searchEMDNData(query: string): Promise<EmdnCode[]> {
  const allData = await loadAllEMDNData();
  const lowerQuery = query.toLowerCase();
  
  return allData.filter(entry => 
    entry.code.toLowerCase().includes(lowerQuery) ||
    entry.description.toLowerCase().includes(lowerQuery)
  );
}

// Get entry by code
export async function getEMDNByCode(code: string): Promise<EmdnCode | null> {
  const allData = await loadAllEMDNData();
  return allData.find(entry => entry.code === code) || null;
}