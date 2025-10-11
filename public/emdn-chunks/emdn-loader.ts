/**
 * EMDN Data Loader
 * Generated: 2025-10-06T16:24:58.579Z
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
  const response = await fetch(`${basePath}/manifest.json`);
  return response.json();
}

/**
 * Load a specific EMDN category
 */
export async function loadEMDNCategory(category: string, basePath: string = './emdn-chunks'): Promise<EMDNCategoryData> {
  const response = await fetch(`${basePath}/emdn-${category}.json`);
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
