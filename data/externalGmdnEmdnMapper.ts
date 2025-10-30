/**
 * External GMDN-EMDN Mapping Utilities
 * 
 * Loads and manages pre-generated mapping files for better performance
 * and accuracy than real-time semantic matching.
 */

// DEPRECATED: GMDN-EMDN mapping utilities have been removed.
// This module remains as a no-op stub to prevent import errors.
interface GmdnEmdnMatch {
  emdnCode: string;
  emdnDescription: string;
  score: number;
  source: 'manual' | 'automatic';
}

interface GmdnMapping {
  gmdnCode: string;
  gmdnDescription: string;
  emdnMatches: GmdnEmdnMatch[];
  matchCount: number;
}

interface MappingData {
  metadata: {
    generated: string;
    version: string;
    description: string;
    stats: {
      totalGmdn: number;
      mappedGmdn: number;
      manualMappings: number;
      automaticMappings: number;
    };
  };
  mappings: { [gmdnCode: string]: GmdnMapping };
}

interface LookupIndex {
  [code: string]: string[];
}

interface ReverseLookupEntry {
  gmdnCode: string;
  score: number;
  source: string;
}

interface ReverseLookupIndex {
  [emdnCode: string]: ReverseLookupEntry[];
}

class ExternalGmdnEmdnMapper {
  private loaded = false;
  async loadMappings(): Promise<void> {
    this.loaded = true;
    if (typeof console !== 'undefined') {
      console.warn('externalGmdnEmdnMapper is deprecated and returns no data.');
    }
  }

  // Intentionally removed: reverse lookup is not supported in deprecated mapper

  /**
   * Get EMDN codes related to a GMDN code
   */
  getEmdnCodesForGmdn(_gmdnCode: string): GmdnEmdnMatch[] {
    return [];
  }

  /**
   * Get GMDN codes related to an EMDN code
   */
  getGmdnCodesForEmdn(_emdnCode: string): ReverseLookupEntry[] {
    return [];
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    return null;
  }

  /**
   * Check if mappings are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get all available GMDN codes with mappings
   */
  getAllMappedGmdnCodes(): string[] {
    return [];
  }

  /**
   * Search for GMDN codes by description
   */
  searchGmdnByDescription(_query: string): GmdnMapping[] {
    return [];
  }
}

// Export singleton instance
export const externalGmdnEmdnMapper = new ExternalGmdnEmdnMapper();

// Export types
export type {
  GmdnEmdnMatch,
  GmdnMapping,
  MappingData,
  LookupIndex,
  ReverseLookupEntry,
  ReverseLookupIndex
};