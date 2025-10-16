/**
 * External GMDN-EMDN Mapping Utilities
 * 
 * Loads and manages pre-generated mapping files for better performance
 * and accuracy than real-time semantic matching.
 */

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
  private mappingData: MappingData | null = null;
  // private _gmdnLookup: LookupIndex | null = null; // TODO: Implement GMDN lookup functionality
  private emdnLookup: ReverseLookupIndex | null = null;
  private loaded = false;

  async loadMappings(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load main mappings
      const mappingResponse = await fetch('/gmdn-emdn-mappings/gmdn-emdn-mappings.json');
      if (!mappingResponse.ok) {
        throw new Error(`Failed to load mappings: ${mappingResponse.status}`);
      }
      this.mappingData = await mappingResponse.json();

      // Build reverse lookup index from mappings
      this.emdnLookup = this.buildReverseLookupIndex(this.mappingData);

      this.loaded = true;
      console.log('✅ External GMDN-EMDN mappings loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load external GMDN-EMDN mappings:', error);
      throw error;
    }
  }

  private buildReverseLookupIndex(data: MappingData | null): ReverseLookupIndex {
    const reverseIndex: ReverseLookupIndex = {};
    if (!data?.mappings) {
      return reverseIndex;
    }

    for (const record of Object.values(data.mappings)) {
      if (!record?.emdnMatches?.length) {
        continue;
      }

      for (const match of record.emdnMatches) {
  const { emdnCode, score = 100 } = match;
        if (!emdnCode) continue;

        if (!reverseIndex[emdnCode]) {
          reverseIndex[emdnCode] = [];
        }

        reverseIndex[emdnCode].push({
          gmdnCode: record.gmdnCode,
          score,
          source: 'manual',  // All mappings are now manual/expert curated
        });
      }
    }

    // Sort entries by manual first, then descending score
    for (const entries of Object.values(reverseIndex)) {
      entries.sort((a, b) => {
        if (a.source === b.source) {
          return b.score - a.score;
        }
        return a.source === 'manual' ? -1 : 1;
      });
    }

    return reverseIndex;
  }

  /**
   * Get EMDN codes related to a GMDN code
   */
  getEmdnCodesForGmdn(gmdnCode: string): GmdnEmdnMatch[] {
    if (!this.loaded || !this.mappingData) {
      console.warn('Mappings not loaded');
      return [];
    }

    const mapping = this.mappingData.mappings[gmdnCode];
    if (!mapping) {
      return [];
    }

    return mapping.emdnMatches;
  }

  /**
   * Get GMDN codes related to an EMDN code
   */
  getGmdnCodesForEmdn(emdnCode: string): ReverseLookupEntry[] {
    if (!this.loaded || !this.emdnLookup) {
      console.warn('Reverse lookup not loaded');
      return [];
    }

    return this.emdnLookup[emdnCode] || [];
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    if (!this.loaded || !this.mappingData) {
      return null;
    }

    return this.mappingData.metadata.stats;
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
    if (!this.loaded || !this.mappingData) {
      return [];
    }

    return Object.keys(this.mappingData.mappings);
  }

  /**
   * Search for GMDN codes by description
   */
  searchGmdnByDescription(query: string): GmdnMapping[] {
    if (!this.loaded || !this.mappingData) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const results: GmdnMapping[] = [];

    for (const mapping of Object.values(this.mappingData.mappings)) {
      if (mapping.gmdnDescription.toLowerCase().includes(queryLower)) {
        results.push(mapping);
      }
    }

    return results.sort((a, b) => b.matchCount - a.matchCount);
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