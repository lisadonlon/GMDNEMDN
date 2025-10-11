/**
 * ICD-10 Integration Utilities
 * 
 * Provides functions to load and work with ICD-10 mappings for EMDN and GMDN codes
 */

import { IcdMapping, IcdLookupIndex, IcdIndication } from '../types';

// Cache for loaded mappings
let emdnMappings: IcdMapping[] | null = null;
let gmdnMappings: IcdMapping[] | null = null;
let emdnLookupIndex: IcdLookupIndex | null = null;
let gmdnLookupIndex: IcdLookupIndex | null = null;

/**
 * Load EMDN to ICD-10 mappings
 */
export async function loadEmdnIcdMappings(): Promise<IcdMapping[]> {
  if (emdnMappings) {
    return emdnMappings;
  }

  try {
    const response = await fetch('./icd10-mappings/emdn-high-confidence.json');
    if (!response.ok) {
      console.warn('High-confidence EMDN mappings not found, trying complete mappings');
      const fallbackResponse = await fetch('./icd10-mappings/emdn-icd10-mappings.json');
      if (!fallbackResponse.ok) {
        throw new Error('No EMDN ICD-10 mappings found');
      }
      const data = await fallbackResponse.json();
      emdnMappings = data.mappings || [];
    } else {
      const data = await response.json();
      emdnMappings = data.mappings || [];
    }
  } catch (error) {
    console.warn('Failed to load EMDN ICD-10 mappings:', error);
    emdnMappings = [];
  }

  return emdnMappings!;
}

/**
 * Load GMDN to ICD-10 mappings
 */
export async function loadGmdnIcdMappings(): Promise<IcdMapping[]> {
  if (gmdnMappings) {
    return gmdnMappings;
  }

  try {
    const response = await fetch('./icd10-mappings/gmdn-high-confidence.json');
    if (!response.ok) {
      console.warn('High-confidence GMDN mappings not found, trying complete mappings');
      const fallbackResponse = await fetch('./icd10-mappings/gmdn-icd10-mappings.json');
      if (!fallbackResponse.ok) {
        throw new Error('No GMDN ICD-10 mappings found');
      }
      const data = await fallbackResponse.json();
      gmdnMappings = data.mappings || [];
    } else {
      const data = await response.json();
      gmdnMappings = data.mappings || [];
    }
  } catch (error) {
    console.warn('Failed to load GMDN ICD-10 mappings:', error);
    gmdnMappings = [];
  }

  return gmdnMappings!;
}

/**
 * Load EMDN lookup index for fast searches
 */
export async function loadEmdnLookupIndex(): Promise<IcdLookupIndex> {
  if (emdnLookupIndex) {
    return emdnLookupIndex;
  }

  try {
    const response = await fetch('./icd10-mappings/emdn-lookup-index.json');
    if (!response.ok) {
      throw new Error('EMDN lookup index not found');
    }
    emdnLookupIndex = await response.json();
  } catch (error) {
    console.warn('Failed to load EMDN lookup index:', error);
    emdnLookupIndex = {};
  }

  return emdnLookupIndex!;
}

/**
 * Load GMDN lookup index for fast searches
 */
export async function loadGmdnLookupIndex(): Promise<IcdLookupIndex> {
  if (gmdnLookupIndex) {
    return gmdnLookupIndex;
  }

  try {
    const response = await fetch('./icd10-mappings/gmdn-lookup-index.json');
    if (!response.ok) {
      throw new Error('GMDN lookup index not found');
    }
    gmdnLookupIndex = await response.json();
  } catch (error) {
    console.warn('Failed to load GMDN lookup index:', error);
    gmdnLookupIndex = {};
  }

  return gmdnLookupIndex!;
}

/**
 * Get ICD-10 indications for an EMDN code
 */
export async function getEmdnIndications(emdnCode: string): Promise<IcdIndication[]> {
  const mappings = await loadEmdnIcdMappings();
  const mapping = mappings.find(m => m.deviceCode === emdnCode);
  return mapping?.icdMatches || [];
}

/**
 * Get ICD-10 indications for a GMDN code
 */
export async function getGmdnIndications(gmdnCode: string): Promise<IcdIndication[]> {
  const mappings = await loadGmdnIcdMappings();
  const mapping = mappings.find(m => m.deviceCode === gmdnCode);
  return mapping?.icdMatches || [];
}

/**
 * Search devices by ICD-10 code
 */
export async function searchDevicesByIcd(icdCode: string): Promise<{emdn: string[], gmdn: string[]}> {
  const [emdnMappings, gmdnMappings] = await Promise.all([
    loadEmdnIcdMappings(),
    loadGmdnIcdMappings()
  ]);

  const emdnDevices = emdnMappings
    .filter(m => m.icdMatches.some(icd => icd.code === icdCode || icd.code.startsWith(icdCode)))
    .map(m => m.deviceCode);

  const gmdnDevices = gmdnMappings
    .filter(m => m.icdMatches.some(icd => icd.code === icdCode || icd.code.startsWith(icdCode)))
    .map(m => m.deviceCode);

  return { emdn: emdnDevices, gmdn: gmdnDevices };
}

/**
 * Get clinical indications summary for a device type
 */
export async function getClinicalSummary(deviceCode: string, deviceType: 'emdn' | 'gmdn') {
  const indications = deviceType === 'emdn' 
    ? await getEmdnIndications(deviceCode)
    : await getGmdnIndications(deviceCode);

  if (indications.length === 0) {
    return null;
  }

  // Group by confidence level
  const highConfidence = indications.filter(i => i.confidence >= 80);
  const mediumConfidence = indications.filter(i => i.confidence >= 60 && i.confidence < 80);
  const manualMappings = indications.filter(i => i.source === 'manual');

  return {
    totalIndications: indications.length,
    highConfidence: highConfidence.length,
    mediumConfidence: mediumConfidence.length,
    manualMappings: manualMappings.length,
    primaryIndications: highConfidence.slice(0, 3),
    allIndications: indications
  };
}

/**
 * Group indications by ICD-10 chapter
 */
export function groupIndicationsByChapter(indications: IcdIndication[]) {
  const chapters: { [key: string]: string } = {
    'A': 'Infectious and parasitic diseases',
    'C': 'Neoplasms',
    'E': 'Endocrine, nutritional and metabolic diseases',
    'F': 'Mental and behavioural disorders',
    'G': 'Nervous system',
    'H': 'Eye and adnexa / Ear and mastoid process',
    'I': 'Circulatory system',
    'J': 'Respiratory system',
    'K': 'Digestive system',
    'M': 'Musculoskeletal system and connective tissue',
    'N': 'Genitourinary system',
    'Q': 'Congenital malformations',
    'S': 'Injury, poisoning and external causes',
    'Z': 'Factors influencing health status'
  };

  const grouped: { [key: string]: { chapter: string, indications: IcdIndication[] } } = {};

  indications.forEach(indication => {
    const chapter = indication.code.charAt(0);
    if (chapters[chapter]) {
      if (!grouped[chapter]) {
        grouped[chapter] = {
          chapter: chapters[chapter],
          indications: []
        };
      }
      grouped[chapter].indications.push(indication);
    }
  });

  return grouped;
}

/**
 * Check if ICD-10 mappings are available
 */
export async function checkIcdMappingsAvailable(): Promise<boolean> {
  try {
    const [emdnResponse, gmdnResponse] = await Promise.all([
      fetch('./icd10-mappings/emdn-lookup-index.json'),
      fetch('./icd10-mappings/gmdn-lookup-index.json')
    ]);
    
    return emdnResponse.ok || gmdnResponse.ok;
  } catch {
    return false;
  }
}