import React, { useState, useEffect } from 'react';
import { EmdnCode, SecondaryCode } from '../types';
import { 
  loadSemanticRelationships, 
  getIcdCodesForDevice, 
  IcdMatch 
} from '../data/semanticRelationships';
import { isFeatureEnabled } from '../config/features';
import { externalGmdnEmdnMapper, type ReverseLookupEntry } from '../data/externalGmdnEmdnMapper';

interface EmdnDetailEnhancedProps {
  code: EmdnCode | null;
  allCodes: EmdnCode[];
  allGmdnCodes: SecondaryCode[];
  onSelectGmdn: (code: string) => void;
}

const EmdnDetailEnhanced: React.FC<EmdnDetailEnhancedProps> = ({
  code,
  allCodes,
  allGmdnCodes,
  onSelectGmdn
}) => {
  const [semanticLoaded, setSemanticLoaded] = useState(false);
  const [icdMatches, setIcdMatches] = useState<IcdMatch[]>([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [gmdnLoading, setGmdnLoading] = useState(false);
  const [reverseLookupEntries, setReverseLookupEntries] = useState<ReverseLookupEntry[]>([]);
  const [relatedGmdnCodes, setRelatedGmdnCodes] = useState<Array<{ gmdn: SecondaryCode; match: ReverseLookupEntry }>>([]);

  // Load semantic relationships when component mounts
  useEffect(() => {
    const loadSemantic = async () => {
      try {
        await loadSemanticRelationships();
        setSemanticLoaded(true);
      } catch (error) {
        console.error('Failed to load semantic relationships:', error);
      }
    };

    if (!semanticLoaded) {
      loadSemantic();
    }
  }, [semanticLoaded]);

  // Get ICD matches when code changes
  useEffect(() => {
    if (code && semanticLoaded) {
      setIcdLoading(true);
      const matches = getIcdCodesForDevice(code.code, 'emdn');
      setIcdMatches(matches);
      setIcdLoading(false);
    } else {
      setIcdMatches([]);
    }
  }, [code, semanticLoaded]);

  useEffect(() => {
    let isMounted = true;

    const loadReverseMappings = async () => {
      if (!code) {
        if (!isMounted) return;
        setReverseLookupEntries([]);
        setRelatedGmdnCodes([]);
        return;
      }

      setGmdnLoading(true);
      try {
        await externalGmdnEmdnMapper.loadMappings();
        if (!isMounted) return;

        const matches = externalGmdnEmdnMapper.getGmdnCodesForEmdn(code.code) ?? [];
        const enriched = matches
          .map((match) => {
            const gmdn = allGmdnCodes.find((entry) => entry.code === match.gmdnCode);
            if (!gmdn) {
              return null;
            }
            return { gmdn, match };
          })
          .filter((entry): entry is { gmdn: SecondaryCode; match: ReverseLookupEntry } => entry !== null);

        setReverseLookupEntries(matches);
        setRelatedGmdnCodes(enriched);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load GMDN mappings for EMDN detail:', error);
          setReverseLookupEntries([]);
          setRelatedGmdnCodes([]);
        }
      } finally {
        if (isMounted) {
          setGmdnLoading(false);
        }
      }
    };

    loadReverseMappings();

    return () => {
      isMounted = false;
    };
  }, [code, allGmdnCodes]);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Select an EMDN Code</h3>
          <p className="text-sm">Choose a device from the list to view detailed information and semantic relationships.</p>
        </div>
      </div>
    );
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (confidence >= 70) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '👤';
      case 'expert': return '🎯';
      case 'auto': return '🤖';
      default: return '📊';
    }
  };

  // Get the main category (first letter of the code)
  const mainCategory = code.code.charAt(0);
  const categoryName = (() => {
    switch (mainCategory) {
      case 'A': return 'Administration, Withdrawal and Collection';
      case 'B': return 'Haematology and Haemotransfusion';
      case 'C': return 'Cardiocirculatory System';
      case 'D': return 'Disinfectants, Antiseptics, Sterilising Agents';
      case 'F': return 'Dialysis';
      case 'G': return 'Gastrointestinal';
      case 'H': return 'Suture Devices';
      case 'J': return 'Active-Implantable Devices';
      case 'K': return 'Endotherapy and Electrosurgical';
      case 'L': return 'Reusable Surgical Instruments';
      case 'M': return 'General and Specialist Dressings';
      case 'N': return 'Nervous and Medullary Systems';
      case 'P': return 'Implantable Prosthetic and Osteosynthesis';
      case 'Q': return 'Dental, Ophthalmologic and ENT';
      case 'R': return 'Respiratory and Anaesthesia';
      case 'S': return 'Sterilisation Devices';
      case 'T': return 'Patient Protective Equipment';
      case 'U': return 'Urogenital System';
      case 'V': return 'Various Medical Devices';
      case 'W': return 'In Vitro Diagnostic';
      case 'X': return 'Products Without Medical Purpose';
      case 'Y': return 'Devices for Persons with Disabilities';
      case 'Z': return 'Medical Equipment and Accessories';
      default: return 'Medical Device';
    }
  })();

  // Find related codes in the same main category
  const relatedCodes = allCodes
    .filter(c => c.code.charAt(0) === mainCategory && c.code !== code.code)
    .slice(0, 5);

  const totalReverseMatches = reverseLookupEntries.length;

  // Determine device level based on code structure
  const deviceLevel = (() => {
    if (code.code.length === 1) return 'Category';
    if (code.code.length === 3) return 'Group';
    if (code.code.length === 5) return 'Sub-Group';
    return 'Product';
  })();

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-lg p-6 border border-sky-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-sky-300 mb-2">{code.code}</h2>
            <p className="text-lg text-slate-200 leading-relaxed">{code.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Category</div>
            <div className="text-lg font-semibold text-sky-400">{categoryName}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Level:</span>
            <span className="ml-2 text-slate-200">{deviceLevel}</span>
          </div>
          <div>
            <span className="text-slate-400">Parent Code:</span>
            <span className="ml-2 text-slate-200 font-mono">{code.parentCode || 'Root'}</span>
          </div>
        </div>
      </div>

      {/* Semantic Relationships - ICD-10 Diagnoses (Hidden in production until data is more complete) */}
      {isFeatureEnabled('icdClinicalIndications') && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
            🩺 Clinical Indications (ICD-10)
            {icdLoading && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
          </h3>
          
          {!semanticLoaded ? (
            <div className="text-slate-400 text-sm">Loading semantic relationships...</div>
          ) : icdMatches.length > 0 ? (
            <div className="space-y-3">
              {icdMatches.map((match, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <code className="text-blue-400 font-mono text-sm bg-slate-800 px-2 py-1 rounded">
                        {match.code}
                      </code>
                      <span className={`text-xs px-2 py-1 rounded border ${getConfidenceBadgeColor(match.confidence)}`}>
                        {match.confidence}% confidence
                      </span>
                      <span className="text-xs text-slate-400">
                        {getSourceIcon(match.source)} {match.source}
                      </span>
                    </div>
                    <div className="text-slate-200 text-sm">{match.indication}</div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xs text-blue-300 mb-1">💡 Semantic Mapping Information</div>
                <div className="text-xs text-slate-400">
                  These ICD-10 codes represent medical conditions that typically require this device type.
                  Mappings are derived from clinical expertise, automated analysis, and manual curation.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center space-x-2 mb-2">
                <span>🔍</span>
                <span>No ICD-10 mappings available for this device</span>
              </div>
              <div className="text-xs text-slate-500">
                This device may not have established clinical indication mappings yet,
                or may be a general-purpose device used across multiple conditions.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Global GMDN Codes */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
          🔁 Related Global (GMDN) Codes
          {gmdnLoading && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>}
        </h3>

        {relatedGmdnCodes.length > 0 ? (
          <div className="space-y-3">
            {relatedGmdnCodes.map(({ gmdn, match }) => (
              <div
                key={match.gmdnCode}
                className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <code className="text-emerald-400 font-mono text-sm">{match.gmdnCode}</code>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        match.source === 'manual'
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {match.source === 'manual' ? 'Manual mapping' : `Auto ${match.score}%`}
                    </span>
                  </div>
                  <div className="text-slate-200 text-sm">{gmdn.description}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Validated through expert review
                  </div>
                </div>
                <button
                  onClick={() => onSelectGmdn(match.gmdnCode)}
                  className="ml-4 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                >
                  View GMDN Details
                </button>
              </div>
            ))}

            <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-slate-400">
              These links use the manually curated expert mappings dataset.
              <div className="mt-2 text-slate-500">
                Total expert mappings: {totalReverseMatches.toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <span>🔍</span>
              <span>No validated GMDN mappings found for this code yet</span>
            </div>
            <div className="text-xs text-slate-500">
              The reciprocal mapping dataset does not currently contain GMDN links for this EMDN code.
              New manual approvals will surface here automatically.
            </div>
          </div>
        )}
      </div>

      {/* Related Devices */}
      {relatedCodes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">🔗 Related Devices in {categoryName}</h3>
          <div className="space-y-2">
            {relatedCodes.map((relatedCode) => (
              <div 
                key={relatedCode.code}
                className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <code className="text-sky-400 font-mono text-sm">{relatedCode.code}</code>
                  <span className="text-slate-200 text-sm">{relatedCode.description}</span>
                </div>
                <div className="text-xs text-slate-400">→</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">📋 Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">EMDN Code:</span>
              <span className="ml-2 text-slate-200 font-mono">{code.code}</span>
            </div>
            <div>
              <span className="text-slate-400">Category:</span>
              <span className="ml-2 text-slate-200">{categoryName}</span>
            </div>
            <div>
              <span className="text-slate-400">Level:</span>
              <span className="ml-2 text-slate-200">{deviceLevel}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">Parent Code:</span>
              <span className="ml-2 text-slate-200 font-mono">{code.parentCode || 'Root'}</span>
            </div>
            <div>
              <span className="text-slate-400">Semantic Mappings:</span>
              <span className="ml-2 text-slate-200">{icdMatches.length} ICD-10 codes</span>
            </div>
            <div>
              <span className="text-slate-400">Related Devices:</span>
              <span className="ml-2 text-slate-200">{relatedCodes.length} in category</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmdnDetailEnhanced;