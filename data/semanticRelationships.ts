/**
 * Semantic Relationship Manager
 * 
 * Provides bidirectional lookup between medical device codes and diagnostic codes
 * Integrates existing EMDN→ICD-10 and GMDN→ICD-10 mappings with the UI
 */

export interface DeviceMapping {
  deviceCode: string;
  deviceTerm: string;
  deviceType: 'emdn' | 'gmdn';
  icdMatches: IcdMatch[];
}

export interface IcdMatch {
  code: string;
  indication: string;
  confidence: number;
  source: 'manual' | 'auto' | 'expert';
}

export interface DiagnosisMapping {
  icdCode: string;
  icdTitle: string;
  deviceMatches: DeviceMatch[];
}

export interface DeviceMatch {
  code: string;
  term: string;
  type: 'emdn' | 'gmdn';
  confidence: number;
  source: string;
}

class SemanticRelationshipManager {
  private emdnToIcdMappings: Map<string, IcdMatch[]> = new Map();
  private gmdnToIcdMappings: Map<string, IcdMatch[]> = new Map();
  private icdToDeviceMappings: Map<string, DeviceMatch[]> = new Map();
  private loaded = false;

  /**
   * Load all mapping data from the generated files
   */
  async loadMappings(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load EMDN → ICD-10 mappings
      const emdnResponse = await fetch('/icd10-mappings/emdn-icd10-mappings.json');
      if (emdnResponse.ok) {
        const emdnData = await emdnResponse.json();
        this.processEmdnMappings(emdnData);
      }

      // Load GMDN → ICD-10 mappings  
      const gmdnResponse = await fetch('/icd10-mappings/gmdn-icd10-mappings.json');
      if (gmdnResponse.ok) {
        const gmdnData = await gmdnResponse.json();
        this.processGmdnMappings(gmdnData);
      }

      // Load high-confidence mappings for additional data
      const highConfResponse = await fetch('/icd10-mappings/emdn-high-confidence.json');
      if (highConfResponse.ok) {
        const highConfData = await highConfResponse.json();
        this.processHighConfidenceMappings(highConfData);
      }

      this.buildReverseIndex();
      this.loaded = true;

      console.log(`✅ Loaded semantic relationships:
        - EMDN codes: ${this.emdnToIcdMappings.size}
        - GMDN codes: ${this.gmdnToIcdMappings.size}  
        - ICD codes: ${this.icdToDeviceMappings.size}`);

    } catch (error) {
      console.error('Failed to load semantic mappings:', error);
      throw new Error('Could not load device-diagnosis mappings');
    }
  }

  /**
   * Process EMDN mapping data
   */
  private processEmdnMappings(data: any[]): void {
    for (const mapping of data) {
      if (mapping.emdnCode && mapping.clinicalIndications) {
        const icdMatches: IcdMatch[] = mapping.clinicalIndications.map((indication: any) => ({
          code: indication.icdCode,
          indication: indication.indication || '',
          confidence: this.parseConfidence(indication.confidence),
          source: indication.source?.toLowerCase() || 'auto'
        }));
        
        this.emdnToIcdMappings.set(mapping.emdnCode, icdMatches);
      }
    }
  }

  /**
   * Process GMDN mapping data
   */
  private processGmdnMappings(data: any[]): void {
    for (const mapping of data) {
      if (mapping.gmdnCode && mapping.icdMatches) {
        const icdMatches: IcdMatch[] = mapping.icdMatches.map((match: any) => ({
          code: match.code,
          indication: match.indication || '',
          confidence: match.confidence || 50,
          source: match.source || 'auto'
        }));
        
        this.gmdnToIcdMappings.set(mapping.gmdnCode, icdMatches);
      }
    }
  }

  /**
   * Process high-confidence mapping data (manual curated mappings)
   */
  private processHighConfidenceMappings(data: any): void {
    if (data.mappings) {
      for (const mapping of data.mappings) {
        if (mapping.deviceCode && mapping.icdMatches) {
          // Determine if this is EMDN or GMDN based on code format
          const isEmdn = /^[A-Z]\d{4}$/.test(mapping.deviceCode);
          const targetMap = isEmdn ? this.emdnToIcdMappings : this.gmdnToIcdMappings;
          
          const icdMatches: IcdMatch[] = mapping.icdMatches.map((match: any) => ({
            code: match.code,
            indication: match.indication,
            confidence: match.confidence,
            source: match.source
          }));
          
          // Merge with existing mappings or create new
          const existing = targetMap.get(mapping.deviceCode) || [];
          const merged = this.mergeIcdMatches(existing, icdMatches);
          targetMap.set(mapping.deviceCode, merged);
        }
      }
    }
  }

  /**
   * Build reverse index: ICD code → devices
   */
  private buildReverseIndex(): void {
    this.icdToDeviceMappings.clear();

    // Process EMDN mappings
    for (const [emdnCode, icdMatches] of this.emdnToIcdMappings) {
      for (const icdMatch of icdMatches) {
        if (!this.icdToDeviceMappings.has(icdMatch.code)) {
          this.icdToDeviceMappings.set(icdMatch.code, []);
        }
        
        this.icdToDeviceMappings.get(icdMatch.code)!.push({
          code: emdnCode,
          term: '', // Will be filled when needed
          type: 'emdn',
          confidence: icdMatch.confidence,
          source: icdMatch.source
        });
      }
    }

    // Process GMDN mappings
    for (const [gmdnCode, icdMatches] of this.gmdnToIcdMappings) {
      for (const icdMatch of icdMatches) {
        if (!this.icdToDeviceMappings.has(icdMatch.code)) {
          this.icdToDeviceMappings.set(icdMatch.code, []);
        }
        
        this.icdToDeviceMappings.get(icdMatch.code)!.push({
          code: gmdnCode,
          term: '', // Will be filled when needed
          type: 'gmdn',
          confidence: icdMatch.confidence,
          source: icdMatch.source
        });
      }
    }
  }

  /**
   * Get ICD codes for a device
   */
  getIcdCodesForDevice(deviceCode: string, deviceType: 'emdn' | 'gmdn'): IcdMatch[] {
    if (!this.loaded) {
      console.warn('Semantic mappings not loaded yet');
      return [];
    }

    const mappings = deviceType === 'emdn' ? 
      this.emdnToIcdMappings : 
      this.gmdnToIcdMappings;
    
    return mappings.get(deviceCode) || [];
  }

  /**
   * Get devices for an ICD code
   */
  getDevicesForIcdCode(icdCode: string): DeviceMatch[] {
    if (!this.loaded) {
      console.warn('Semantic mappings not loaded yet');
      return [];
    }

    return this.icdToDeviceMappings.get(icdCode) || [];
  }

  /**
   * Get all mapped ICD codes
   */
  getAllMappedIcdCodes(): string[] {
    if (!this.loaded) return [];
    return Array.from(this.icdToDeviceMappings.keys());
  }

  /**
   * Get all mapped device codes by type
   */
  getAllMappedDeviceCodes(type: 'emdn' | 'gmdn'): string[] {
    if (!this.loaded) return [];
    
    const mappings = type === 'emdn' ? 
      this.emdnToIcdMappings : 
      this.gmdnToIcdMappings;
    
    return Array.from(mappings.keys());
  }

  /**
   * Search for semantic relationships by text
   */
  searchRelationships(query: string): {
    deviceToIcd: DeviceMapping[],
    icdToDevice: DiagnosisMapping[]
  } {
    if (!this.loaded) {
      return { deviceToIcd: [], icdToDevice: [] };
    }

    const queryLower = query.toLowerCase();
    const deviceToIcd: DeviceMapping[] = [];
    const icdToDevice: DiagnosisMapping[] = [];

    // Search device codes and terms
    for (const [deviceCode, icdMatches] of this.emdnToIcdMappings) {
      if (deviceCode.toLowerCase().includes(queryLower)) {
        deviceToIcd.push({
          deviceCode,
          deviceTerm: '', // Would need device data to fill
          deviceType: 'emdn',
          icdMatches
        });
      }
    }

    // Search ICD indications
    for (const [icdCode, deviceMatches] of this.icdToDeviceMappings) {
      const hasMatchingIndication = deviceMatches.some(match => 
        match.code.toLowerCase().includes(queryLower)
      );
      
      if (icdCode.toLowerCase().includes(queryLower) || hasMatchingIndication) {
        icdToDevice.push({
          icdCode,
          icdTitle: '', // Would need ICD data to fill
          deviceMatches
        });
      }
    }

    return { deviceToIcd, icdToDevice };
  }

  /**
   * Get mapping statistics
   */
  getStatistics(): {
    totalEmdnMappings: number;
    totalGmdnMappings: number;
    totalIcdCodes: number;
    averageDevicesPerIcd: number;
    highConfidenceMappings: number;
  } {
    if (!this.loaded) {
      return {
        totalEmdnMappings: 0,
        totalGmdnMappings: 0,
        totalIcdCodes: 0,
        averageDevicesPerIcd: 0,
        highConfidenceMappings: 0
      };
    }

    const totalIcdCodes = this.icdToDeviceMappings.size;
    const totalDevices = Array.from(this.icdToDeviceMappings.values())
      .reduce((sum, devices) => sum + devices.length, 0);
    
    let highConfidenceCount = 0;
    for (const icdMatches of this.emdnToIcdMappings.values()) {
      highConfidenceCount += icdMatches.filter(m => m.confidence >= 80).length;
    }
    for (const icdMatches of this.gmdnToIcdMappings.values()) {
      highConfidenceCount += icdMatches.filter(m => m.confidence >= 80).length;
    }

    return {
      totalEmdnMappings: this.emdnToIcdMappings.size,
      totalGmdnMappings: this.gmdnToIcdMappings.size,
      totalIcdCodes,
      averageDevicesPerIcd: totalIcdCodes > 0 ? totalDevices / totalIcdCodes : 0,
      highConfidenceMappings: highConfidenceCount
    };
  }

  /**
   * Helper: Parse confidence string to number
   */
  private parseConfidence(confidence: any): number {
    if (typeof confidence === 'number') return confidence;
    if (typeof confidence === 'string') {
      const lower = confidence.toLowerCase();
      if (lower === 'high') return 90;
      if (lower === 'medium') return 70;
      if (lower === 'low') return 50;
      const num = parseInt(confidence);
      return isNaN(num) ? 50 : num;
    }
    return 50;
  }

  /**
   * Helper: Merge ICD matches, avoiding duplicates
   */
  private mergeIcdMatches(existing: IcdMatch[], newMatches: IcdMatch[]): IcdMatch[] {
    const merged = [...existing];
    
    for (const newMatch of newMatches) {
      const existingIndex = merged.findIndex(m => m.code === newMatch.code);
      if (existingIndex >= 0) {
        // Keep higher confidence version
        if (newMatch.confidence > merged[existingIndex].confidence) {
          merged[existingIndex] = newMatch;
        }
      } else {
        merged.push(newMatch);
      }
    }
    
    return merged.sort((a, b) => b.confidence - a.confidence);
  }
}

// Singleton instance
export const semanticRelationships = new SemanticRelationshipManager();

// Convenience functions
export async function loadSemanticRelationships(): Promise<void> {
  return semanticRelationships.loadMappings();
}

export function getIcdCodesForDevice(deviceCode: string, deviceType: 'emdn' | 'gmdn'): IcdMatch[] {
  return semanticRelationships.getIcdCodesForDevice(deviceCode, deviceType);
}

export function getDevicesForIcdCode(icdCode: string): DeviceMatch[] {
  return semanticRelationships.getDevicesForIcdCode(icdCode);
}

export function searchSemanticRelationships(query: string) {
  return semanticRelationships.searchRelationships(query);
}

export function getSemanticStatistics() {
  return semanticRelationships.getStatistics();
}